from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_utils import (
    ingest_existing_documents,
    rag_query,
    generate_response
)

app = FastAPI(title="RAG Knowledge Base API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str

# 🔥 INDEX PDFs AT STARTUP
@app.on_event("startup")
def startup():
    ingest_existing_documents("uploads")

@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/ask")
def ask_question(data: QuestionRequest):
    context, sources = rag_query(data.question)

    if not sources:
        return {"answer": context, "sources": []}

    answer = generate_response(data.question, context)
    if "I cannot answer this" in answer:
        sources = []

    return {"answer": answer, "sources": sources}
