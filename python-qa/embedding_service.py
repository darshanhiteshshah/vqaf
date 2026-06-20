from sentence_transformers import SentenceTransformer

print("🔄 Loading embedding model...")

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

print("✅ Embedding model loaded")

def get_embedding(text):

    if not text:
        return []

    embedding = model.encode(
        text,
        convert_to_numpy=True
    )

    return embedding.tolist()