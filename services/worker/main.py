"""Persistent task reminders. Run separately, one worker per deployment."""

import time
import asyncio
import os
from sqlalchemy import select
from app.db import SessionLocal, now
from app.models import Task, Notification, AuditLog, DocumentChunk
from app.adapters import AIProvider


def tick():
    with SessionLocal() as db:
        for task in db.scalars(
            select(Task)
            .where(Task.reminder_at <= now(), Task.reminded.is_(False), Task.status.not_in(["Completed", "Cancelled"]))
            .with_for_update(skip_locked=True)
        ):
            db.add(
                Notification(
                    user_id=task.owner_id, title=f"Reminder: {task.title}", kind="reminder", resource=f"task:{task.id}"
                )
            )
            db.add(
                AuditLog(
                    department_id=task.department_id,
                    actor_id=task.owner_id,
                    action="task.reminder_delivered",
                    resource=f"task:{task.id}",
                    detail={"automated": True},
                )
            )
            task.reminded = True
        db.commit()


async def index_embeddings():
    if not os.getenv("EMBEDDING_MODEL"):
        return
    with SessionLocal() as db:
        chunks = list(
            db.scalars(
                select(DocumentChunk).where(DocumentChunk.embedding.is_(None)).order_by(DocumentChunk.id).limit(32)
            )
        )
        if not chunks:
            return
        vectors = await AIProvider().embed([c.text for c in chunks])
        if not vectors or len(vectors) != len(chunks):
            raise RuntimeError("Embedding provider returned an invalid batch")
        for chunk, vector in zip(chunks, vectors):
            chunk.embedding = vector
        db.commit()


if __name__ == "__main__":
    while True:
        try:
            tick()
            asyncio.run(index_embeddings())
        except Exception:
            import logging

            logging.exception("Reminder worker failed; will retry in 30 seconds")
        time.sleep(30)
