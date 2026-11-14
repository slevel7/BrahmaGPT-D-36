import os
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

root = Path(tempfile.mkdtemp(prefix="brahma-tests-"))
os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", "sqlite:///" + str(root / "test.db"))
os.environ["STORAGE_DIR"] = str(root / "files")
os.environ["DEMO_MODE"] = "true"
os.environ.pop("AI_MODEL", None)
from app.main import app, rate  # noqa: E402
from app.db import Base, engine, SessionLocal  # noqa: E402
from app.seed import seed  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    rate.clear()
    with TestClient(app, headers={"X-Brahma-Client": "web"}) as client:
        yield client


def login(client, role="employee"):
    response = client.post("/auth/demo", json={"email": f"{role}@demo.invalid"})
    assert response.status_code == 200, response.text
    return response.json()
