"""Add the curated TechKart and AgriMart assistant knowledge without resetting app data."""

from pathlib import Path

from app.db.session import SessionLocal
from app.knowledge_seed import KNOWLEDGE_ARTICLES, SEEDED_GUIDES
from app.models.models import Customer, Domain, KnowledgeBase, KnowledgeChunk, KnowledgeDocument, Language, UserRole
from app.services.pdf_ingestion import extract_pdf_chunks
from app.services.vector_index import rebuild_index


def main() -> None:
    db = SessionLocal()
    try:
        admin = db.query(Customer).filter(Customer.role == UserRole.admin).order_by(Customer.id.asc()).first()
        if admin is None:
            raise RuntimeError("Create an admin account before seeding assistant knowledge")

        articles_added = 0
        for domain, title, content in KNOWLEDGE_ARTICLES:
            existing = db.query(KnowledgeBase).filter(
                KnowledgeBase.domain == domain,
                KnowledgeBase.language == Language.en,
                KnowledgeBase.title == title,
            ).first()
            if existing is None:
                db.add(KnowledgeBase(title=title, content=content, domain=domain, language=Language.en))
                articles_added += 1

        pdf_root = Path(__file__).resolve().parents[2] / "output" / "pdf"
        documents_added = 0
        chunks_added = 0
        for filename, domain in SEEDED_GUIDES:
            existing = db.query(KnowledgeDocument).filter(
                KnowledgeDocument.original_filename == filename,
                KnowledgeDocument.domain == domain,
            ).first()
            if existing is not None:
                continue
            path = pdf_root / filename
            if not path.exists():
                raise FileNotFoundError(f"Seeded knowledge PDF is missing: {path}")
            contents = path.read_bytes()
            page_count, extracted_chunks = extract_pdf_chunks(contents)
            document = KnowledgeDocument(
                original_filename=filename,
                content_type="application/pdf",
                size_bytes=len(contents),
                page_count=page_count,
                domain=domain,
                language=Language.en,
                created_by=admin.id,
            )
            db.add(document)
            db.flush()
            for chunk_index, (page_number, content) in enumerate(extracted_chunks):
                db.add(KnowledgeChunk(
                    document_id=document.id,
                    chunk_index=chunk_index,
                    page_number=page_number,
                    content=content,
                ))
                chunks_added += 1
            documents_added += 1

        db.commit()
        rebuild_index(db)
        print(f"Knowledge seed complete: {articles_added} articles, {documents_added} PDFs, {chunks_added} PDF chunks added.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
