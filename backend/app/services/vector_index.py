"""In-memory FAISS index over KnowledgeBase content, rebuilt from SQLite.

FAISS holds only vectors + a parallel list of KnowledgeBase row ids — the
actual title/content/domain/language always lives in SQLite. We rebuild the
whole index on every KB write since the knowledge base is small (hundreds,
not millions, of articles), which avoids FAISS's awkward delete support.
"""
import threading

import faiss
import numpy as np
from sqlalchemy.orm import Session

from app.models.models import KnowledgeBase, KnowledgeChunk
from app.services.embeddings import EMBEDDING_DIM, embed_texts

_lock = threading.Lock()
_index: faiss.Index | None = None
_id_map: list[tuple[str, int]] = []  # FAISS row position -> (entry type, row id)


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1
    return vectors / norms


def rebuild_index(db: Session) -> None:
    global _index, _id_map
    articles = db.query(KnowledgeBase).all()
    chunks = db.query(KnowledgeChunk).all()
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    entries: list[tuple[str, int, str]] = [
        ("article", article.id, f"{article.title}\n{article.content}") for article in articles
    ]
    entries.extend(("document_chunk", chunk.id, chunk.content) for chunk in chunks)
    if entries:
        texts = [text for _, _, text in entries]
        vectors = np.array(embed_texts(texts), dtype="float32")
        index.add(_normalize(vectors))
    with _lock:
        _index = index
        _id_map = [(entry_type, entry_id) for entry_type, entry_id, _ in entries]


def _ensure_index(db: Session) -> None:
    if _index is None:
        rebuild_index(db)


def search(db: Session, query: str, k: int = 5) -> list[tuple[str, int, float]]:
    """Returns [(entry_type, entry_id, similarity_score)] sorted best-first."""
    _ensure_index(db)
    with _lock:
        index, id_map = _index, _id_map
    if index is None or index.ntotal == 0:
        return []
    query_vec = np.array(embed_texts([query]), dtype="float32")
    query_vec = _normalize(query_vec)
    scores, positions = index.search(query_vec, min(k, index.ntotal))
    results = []
    for score, pos in zip(scores[0], positions[0]):
        if pos == -1:
            continue
        entry_type, entry_id = id_map[pos]
        results.append((entry_type, entry_id, float(score)))
    return results
