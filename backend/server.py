# Minimal FastAPI stub. Divine Traders talks to Supabase directly from the browser.
# This exists only so supervisor stays happy.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Divine Traders (stub)")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True,
)

@app.get("/api/health")
def health():
    return {"status": "ok", "note": "Divine Traders uses Supabase directly on the client. This backend is a stub."}
