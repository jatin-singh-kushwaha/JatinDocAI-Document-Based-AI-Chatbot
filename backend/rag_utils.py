import os
import docx
import PyPDF2
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
from google import genai

# -----------------------------
# ENV + GEMINI
# -----------------------------
load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# You were right: this model gives better answers
GEMINI_MODEL = "gemini-2.5-flash-lite"

# -----------------------------
# FILE READERS
# -----------------------------
def read_text_file(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def read_pdf_file(file_path: str):
    text = ""
    with open(file_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def read_docx_file(file_path: str):
    doc = docx.Document(file_path)
    return "\n".join(p.text for p in doc.paragraphs)

def read_document(file_path: str):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".txt":
        return read_text_file(file_path)
    elif ext == ".pdf":
        return read_pdf_file(file_path)
    elif ext == ".docx":
        return read_docx_file(file_path)
    else:
        raise ValueError("Unsupported file type")

# -----------------------------
# CHUNKING (your logic, improved)
# -----------------------------
def split_text(text: str, chunk_size: int = 600):
    sentences = text.replace("\n", " ").split(". ")
    chunks, current, size = [], [], 0

    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if not s.endswith("."):
            s += "."
        if size + len(s) > chunk_size and current:
            chunks.append(" ".join(current))
            current, size = [s], len(s)
        else:
            current.append(s)
            size += len(s)

    if current:
        chunks.append(" ".join(current))
    return chunks

# -----------------------------
# CHROMA
# -----------------------------
chroma_client = chromadb.PersistentClient(path="chroma_db")

embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

collection = chroma_client.get_or_create_collection(
    name="documents_collection",
    embedding_function=embedding_fn
)

# -----------------------------
# INGESTION
# -----------------------------
def process_document(file_path: str):
    content = read_document(file_path)
    chunks = split_text(content)
    filename = os.path.basename(file_path)

    ids = [f"{filename}_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename} for _ in chunks]

    return ids, chunks, metadatas

def add_to_collection(ids, texts, metadatas):
    if texts:
        collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )

def ingest_existing_documents(upload_dir="uploads"):
    if not os.path.exists(upload_dir):
        return

    for filename in os.listdir(upload_dir):
        path = os.path.join(upload_dir, filename)
        if not os.path.isfile(path):
            continue
        try:
            ids, texts, metas = process_document(path)
            add_to_collection(ids, texts, metas)
            print(f"Ingested: {filename}")
        except Exception as e:
            print(f"Failed {filename}: {e}")

# -----------------------------
# RETRIEVAL
# -----------------------------
def semantic_search(query, n_results=3):
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    if not results["documents"][0]:
        return None
    return results

def get_context_with_sources(results):
    context = "\n\n".join(results["documents"][0])
    sources = list(set(
        m["source"] for m in results["metadatas"][0]
    ))
    return context, sources

def rag_query(query):
    results = semantic_search(query)
    if results is None:
        return "I cannot answer this from the provided document.", []
    return get_context_with_sources(results)

# -----------------------------
# GENERATION (GEMINI 2.5)
# -----------------------------
def generate_response(query, context):
    prompt = f"""
You are a strict document-based assistant.

Answer ONLY from the given context.
If not found, say exactly:
"I cannot answer this from the provided document."

Do not use outside knowledge.
Do not hallucinate.

Context:
{context}

Question:
{query}
"""

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={
            "temperature": 0,
            "max_output_tokens": 1800
        }
    )
    return response.text
