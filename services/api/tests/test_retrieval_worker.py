import asyncio
import importlib.util
from datetime import timedelta
from pathlib import Path
from sqlalchemy import select
from .conftest import login
from app.db import SessionLocal, now
from app.models import DocumentChunk, Notification, Task


def worker_module():
    path = Path(__file__).resolve().parents[2] / "worker" / "main.py"
    spec = importlib.util.spec_from_file_location("brahma_worker", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_embedding_pipeline_and_permission_filter(client, monkeypatch):
    login(client)
    doc = client.post("/documents/upload", files={"file": ("review.txt", b"Pension records reviewed.")}).json()
    monkeypatch.setenv("EMBEDDING_MODEL", "test-only")

    async def embed(self, texts):
        return [[1.0, 0.0, 0.0] for _ in texts]

    monkeypatch.setattr("app.adapters.AIProvider.embed", embed)
    asyncio.run(worker_module().index_embeddings())
    with SessionLocal() as db:
        assert db.scalar(select(DocumentChunk)).embedding is not None
    result = client.get("/documents/search?q=retirement").json()
    assert result["mode"] == "permission-filtered semantic search"
    assert result["results"][0]["document_id"] == doc["id"]
    login(client, "other")
    assert client.get("/documents/search?q=retirement").json()["results"] == []


def test_reminder_is_delivered_once(client):
    login(client)
    with SessionLocal() as db:
        task = db.scalar(select(Task))
        task.reminder_at = now() - timedelta(minutes=1)
        db.commit()
    worker = worker_module()
    worker.tick()
    worker.tick()
    with SessionLocal() as db:
        assert len(list(db.scalars(select(Notification).where(Notification.kind == "reminder")))) == 1
