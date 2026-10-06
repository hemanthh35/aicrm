from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.upload_limits import UploadTooLarge, read_limited_upload
from app.db.session import get_db
from app.core.security import require_admin
from app.models.models import Customer, Domain, KnowledgeBase, KnowledgeChunk, KnowledgeDocument, Language
from app.schemas.schemas import KnowledgeBaseCreate, KnowledgeBaseOut, KnowledgeBaseUpdate, KnowledgeDocumentOut
from app.services.pdf_ingestion import PdfExtractionError, extract_docx_chunks, extract_pdf_chunks
from app.services import vector_index

router = APIRouter(prefix="/api/knowledge-base", tags=["knowledge-base"])
PDF_CONTENT_TYPE = "application/pdf"
DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@router.get("", response_model=list[KnowledgeBaseOut])
def list_articles(domain: str | None = None, language: str | None = None, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(KnowledgeBase)
    if domain:
        query = query.filter(KnowledgeBase.domain == domain)
    if language:
        query = query.filter(KnowledgeBase.language == language)
    return query.order_by(KnowledgeBase.updated_at.desc()).all()


@router.post("", response_model=KnowledgeBaseOut)
def create_article(payload: KnowledgeBaseCreate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    article = KnowledgeBase(**payload.model_dump())
    db.add(article)
    db.commit()
    db.refresh(article)
    vector_index.rebuild_index(db)
    return article


@router.get("/documents", response_model=list[KnowledgeDocumentOut])
def list_documents(domain: str | None = None, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(KnowledgeDocument)
    if domain:
        query = query.filter(KnowledgeDocument.domain == domain)
    return query.order_by(KnowledgeDocument.created_at.desc()).all()


@router.post("/documents", response_model=KnowledgeDocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    domain: str = Form(...),
    language: str = Form(default="en"),
    current: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if domain not in {item.value for item in Domain}:
        raise HTTPException(status_code=422, detail="domain must be ecommerce or agriculture")
    if language not in {item.value for item in Language}:
        raise HTTPException(status_code=422, detail="language must be en, hi, or te")
    filename = Path(file.filename or "document.pdf").name[:200]
    is_pdf = file.content_type == PDF_CONTENT_TYPE or filename.lower().endswith(".pdf")
    is_docx = file.content_type == DOCX_CONTENT_TYPE or filename.lower().endswith(".docx")
    if not is_pdf and not is_docx:
        raise HTTPException(status_code=415, detail="Only PDF or DOCX documents are supported")
    try:
        contents = await read_limited_upload(file, settings.max_pdf_upload_bytes)
    except UploadTooLarge:
        raise HTTPException(status_code=413, detail="PDF must be smaller than 15MB") from None
    if not contents:
        raise HTTPException(status_code=400, detail="The PDF is empty")
    try:
        page_count, chunks = extract_pdf_chunks(contents) if is_pdf else extract_docx_chunks(contents)
    except PdfExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    document = KnowledgeDocument(
        original_filename=filename,
        content_type=PDF_CONTENT_TYPE if is_pdf else DOCX_CONTENT_TYPE,
        size_bytes=len(contents),
        page_count=page_count,
        domain=Domain(domain),
        language=Language(language),
        created_by=current.id,
    )
    db.add(document)
    db.flush()
    db.add_all(
        KnowledgeChunk(document_id=document.id, chunk_index=index, page_number=page_number, content=content)
        for index, (page_number, content) in enumerate(chunks)
    )
    db.commit()
    db.refresh(document)
    vector_index.rebuild_index(db)
    return document


@router.delete("/documents/{document_id}")
def delete_document(document_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    document = db.query(KnowledgeDocument).get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(document)
    db.commit()
    vector_index.rebuild_index(db)
    return {"ok": True}


@router.put("/{article_id}", response_model=KnowledgeBaseOut)
def update_article(article_id: int, payload: KnowledgeBaseUpdate, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    article = db.query(KnowledgeBase).get(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(article, field, value)
    db.commit()
    db.refresh(article)
    vector_index.rebuild_index(db)
    return article


@router.delete("/{article_id}")
def delete_article(article_id: int, _: object = Depends(require_admin), db: Session = Depends(get_db)):
    article = db.query(KnowledgeBase).get(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
    vector_index.rebuild_index(db)
    return {"ok": True}
