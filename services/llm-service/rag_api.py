"""Small authenticated HTTP API that exposes the local travel RAG to n8n."""

import os
import secrets
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from rag_engine import get_rag


PROJECT_DIR = Path(__file__).resolve().parent
load_dotenv(PROJECT_DIR / ".env")

app = FastAPI(
    title="AI Travel RAG API",
    version="1.0.0",
    description="Retrieves relevant travel knowledge for the n8n content workflow.",
)


class RagSearchRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=300)
    location: str = Field(default="", max_length=200)
    target_audience: str = Field(default="", max_length=300)
    top_k: int = Field(default=3, ge=1, le=5)


class RagSource(BaseModel):
    title: str
    section: str
    source: str
    content: str


class RagSearchResponse(BaseModel):
    query: str
    found: bool
    context: str
    sources: List[RagSource]


def _check_api_key(provided_key: Optional[str]) -> None:
    expected_key = os.getenv("RAG_API_KEY", "").strip()
    if len(expected_key) < 32:
        raise HTTPException(
            status_code=503,
            detail="RAG_API_KEY is not configured. Add a random key of at least 32 characters to .env.",
        )
    if not provided_key or not secrets.compare_digest(provided_key, expected_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


@app.get("/health")
def health():
    """Non-sensitive health check; does not expose filenames or credentials."""
    rag = get_rag()
    return {"status": "ok", "loaded_chunks": len(rag.chunks)}


@app.post("/rag/search", response_model=RagSearchResponse)
def search_knowledge(
    request: RagSearchRequest,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    _check_api_key(x_api_key)
    rag = get_rag()

    query = " ".join(
        value.strip()
        for value in (request.product_name, request.location, request.target_audience)
        if value and value.strip()
    )
    chunks = rag.retrieve(query, top_k=request.top_k)

    sources = [
        {
            "title": chunk["title"],
            "section": chunk["section"],
            "source": chunk["source"],
            "content": chunk["content"],
        }
        for chunk in chunks
    ]

    if chunks:
        context = "\n\n".join(
            f"--- NGUỒN RAG #{index} ---\n"
            f"Tiêu đề: {chunk['title']}\n"
            f"Mục: {chunk['section']}\n"
            f"Tệp nguồn: {chunk['source']}\n\n"
            f"{chunk['content']}"
            for index, chunk in enumerate(chunks, start=1)
        )
    else:
        context = (
            "Không tìm thấy kiến thức RAG phù hợp. "
            "Chỉ sử dụng dữ liệu đã được merchant xác nhận."
        )

    return {
        "query": query,
        "found": bool(chunks),
        "context": context,
        "sources": sources,
    }
