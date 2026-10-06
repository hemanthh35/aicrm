"""Retrieval-Augmented Generation over text articles and indexed PDF chunks."""
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.models import Domain, KnowledgeBase, KnowledgeChunk, KnowledgeDocument, Language
from app.services import vector_index

MIN_SIMILARITY = 0.25


@dataclass(frozen=True)
class KnowledgeHit:
    title: str
    content: str
    domain: Domain
    language: Language
    source_type: str
    source_id: int
    page_number: int | None = None
    score: float = 0.0


def retrieve_knowledge(
    db: Session, query: str, domain: Domain, language: Language, k: int = 6
) -> list[KnowledgeHit]:
    hits = vector_index.search(db, query, k=k * 4)
    if not hits:
        return []

    article_ids = [entry_id for entry_type, entry_id, score in hits if entry_type == "article" and score >= MIN_SIMILARITY]
    chunk_ids = [entry_id for entry_type, entry_id, score in hits if entry_type == "document_chunk" and score >= MIN_SIMILARITY]
    articles = {article.id: article for article in db.query(KnowledgeBase).filter(KnowledgeBase.id.in_(article_ids)).all()} if article_ids else {}
    chunks = {
        chunk.id: chunk
        for chunk in db.query(KnowledgeChunk).filter(KnowledgeChunk.id.in_(chunk_ids)).all()
    } if chunk_ids else {}

    ordered: list[KnowledgeHit] = []
    for entry_type, entry_id, score in hits:
        if score < MIN_SIMILARITY:
            continue
        if entry_type == "article":
            article = articles.get(entry_id)
            if article is None or article.domain != domain or (article.language != language and article.language != Language.en):
                continue
            ordered.append(KnowledgeHit(article.title, article.content, article.domain, article.language, "article", article.id, score=score))
        else:
            chunk = chunks.get(entry_id)
            document = chunk.document if chunk else None
            if document is None or document.domain != domain or (document.language != language and document.language != Language.en):
                continue
            ordered.append(KnowledgeHit(document.original_filename, chunk.content, document.domain, document.language, "pdf", document.id, chunk.page_number, score))
        if len(ordered) >= k:
            break
    return ordered


def format_knowledge_context(hits: list[KnowledgeHit]) -> str:
    if not hits:
        return "No matching knowledge base articles found."
    blocks = []
    for hit in hits:
        page = f", page {hit.page_number}" if hit.page_number else ""
        blocks.append(f"[{hit.title}{page}]\n{hit.content}")
    return "\n\n".join(blocks)
