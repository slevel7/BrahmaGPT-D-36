import hashlib
import json
import pytest
from .conftest import login


def test_auth_sessions_and_csrf(client):
    assert client.get("/me").status_code == 401
    user = login(client)
    assert user["role"] == "employee"
    assert "password_hash" not in user
    assert client.cookies.get("brahma_session")
    sessions = client.get("/me/sessions").json()
    assert sessions and "id" not in sessions[0]
    assert client.post("/conversations", headers={"Origin": "https://evil.invalid"}).status_code == 403
    assert (
        client.put(
            "/me/preferences",
            json={"language": "as", "theme": "dark", "pinned_tools": ["documents"], "notifications": True},
        ).status_code
        == 200
    )
    assert client.get("/me").json()["preferences"]["language"] == "as"
    assert client.post("/auth/logout").status_code == 200
    assert client.get("/me").status_code == 401


def test_project_assignment_and_persistence(client):
    manager = login(client, "manager")
    employees = client.get("/users").json()
    employee = next(u for u in employees if u["role"] == "employee")
    project = client.post("/projects", json={"title": "Review project", "description": "Fictional facts"}).json()
    assert client.post(f"/projects/{project['id']}/members", json={"email": employee["email"]}).status_code == 200
    task = client.post(
        "/tasks",
        json={
            "title": "Review pension report",
            "owner_id": employee["id"],
            "project_id": project["id"],
            "priority": "High",
        },
    )
    assert task.status_code == 201, task.text
    login(client)
    task_id = task.json()["id"]
    assert client.patch(f"/tasks/{task_id}", json={"status": "Completed"}).status_code == 200
    assert next(t for t in client.get("/tasks").json() if t["id"] == task_id)["status"] == "Completed"
    assert client.get(f"/tasks/{task_id}/history").json()[-1]["action"] == "task.updated"
    assert client.patch(f"/tasks/{task_id}", json={"owner_id": manager["id"]}).status_code == 403
    login(client, "other")
    assert client.get(f"/projects/{project['id']}/members").status_code == 404
    assert client.patch(f"/tasks/{task_id}", json={"status": "Cancelled"}).status_code == 404


def test_immutable_documents_search_compare_and_approval(client):
    login(client)
    original = b"Fictional pension review: 42 files examined. No official records."
    response = client.post("/documents/upload", files={"file": ("review.txt", original, "text/plain")})
    assert response.status_code == 201, response.text
    doc_id = response.json()["id"]
    assert client.get("/documents/search?q=pension").json()["results"][0]["document_id"] == doc_id
    detail = client.get(f"/documents/{doc_id}").json()
    assert detail["versions"][0]["sha256"] == hashlib.sha256(original).hexdigest()
    version = client.post(
        f"/documents/{doc_id}/versions",
        json={"text": "Fictional pension review: 43 files examined.", "summary": "Corrected synthetic count"},
    )
    assert version.status_code == 201, version.text
    assert client.get(f"/documents/{doc_id}/download?version=1").content == original
    diff = client.get(f"/documents/{doc_id}/compare?left=1&right=2").json()["diff"]
    assert "42 files" in diff and "43 files" in diff
    users = client.get("/users").json()
    reviewer = next(u for u in users if u["role"] == "approver")
    approval = client.post(f"/documents/{doc_id}/submit", json={"reviewer_id": reviewer["id"]})
    assert approval.status_code == 200, approval.text
    assert (
        client.post(f"/documents/{doc_id}/versions", json={"text": "race", "summary": "not allowed"}).status_code == 409
    )
    login(client, "approver")
    assert any(n["kind"] == "approval" for n in client.get("/notifications").json())
    assert (
        client.post(
            f"/approvals/{approval.json()['id']}/decision",
            json={"status": "Approved", "comment": "Reviewed synthetic facts"},
        ).status_code
        == 200
    )
    assert client.post(f"/approvals/{approval.json()['id']}/decision", json={"status": "Rejected"}).status_code == 409
    assert client.get(f"/documents/{doc_id}").json()["status"] == "Approved"
    login(client, "other")
    for endpoint in [
        f"/documents/{doc_id}",
        f"/documents/{doc_id}/download",
        f"/documents/{doc_id}/compare?left=1&right=2",
    ]:
        assert client.get(endpoint).status_code == 404
    assert client.get("/documents/search?q=pension").json()["results"] == []


@pytest.mark.parametrize("extension", ["txt", "csv", "pdf", "docx", "xlsx", "pptx"])
def test_real_document_formats(client, extension):
    login(client)
    result = client.post(
        "/documents/generate",
        json={
            "title": "Fictional note",
            "kind": "Office Note",
            "facts": "Reviewed 42 synthetic pension files.",
            "format": extension,
        },
    )
    assert result.status_code == 201, result.text
    doc_id = result.json()["id"]
    blob = client.get(f"/documents/{doc_id}/download").content
    if extension in {"docx", "xlsx", "pptx"}:
        assert blob.startswith(b"PK")
    elif extension == "pdf":
        assert blob.startswith(b"%PDF")
    assert "42" in client.get(f"/documents/{doc_id}").json()["versions"][0]["text"]


def test_upload_validation_and_read_only(client):
    login(client)
    assert client.post("/documents/upload", files={"file": ("attack.exe", b"bad")}).status_code == 422
    assert client.post("/documents/upload", files={"file": ("invalid.pdf", b"not a pdf")}).status_code == 422
    login(client, "auditor")
    assert client.post("/projects", json={"title": "Forbidden"}).status_code == 403
    assert client.post("/documents/upload", files={"file": ("a.txt", b"not allowed")}).status_code == 403
    assert client.get("/audit").status_code == 200
    login(client)
    assert client.get("/audit").status_code == 403


def test_chat_configuration_and_real_adapter_contract(client, monkeypatch):
    login(client)
    chat = client.post("/conversations").json()
    response = client.post(f"/conversations/{chat['id']}/messages", json={"content": "Hello"})
    assert response.status_code == 503
    assert client.get(f"/conversations/{chat['id']}/messages").json() == []
    doc = client.post(
        "/documents/upload", files={"file": ("source.txt", b"Pension review has 42 fictional records.")}
    ).json()
    monkeypatch.setenv("AI_MODEL", "contract-test-only")
    monkeypatch.setenv("LOCAL_MODEL", "true")

    async def completion(self, messages, language="en"):
        assert "42 fictional records" in messages[-1]["content"]
        return "The supplied review has 42 fictional records [source 1].", {
            "prompt_tokens": 20,
            "completion_tokens": 10,
        }

    monkeypatch.setattr("app.adapters.AIProvider.complete", completion)
    response = client.post(
        f"/conversations/{chat['id']}/messages", json={"content": "Pension review?", "document_ids": [doc["id"]]}
    )
    assert response.status_code == 200, response.text
    events = [json.loads(line) for line in response.text.splitlines()]
    assert events[0]["citations"][0]["document_id"] == doc["id"]
    assert client.get("/analytics").json()["tokens"] == 30
    assert len(client.get(f"/conversations/{chat['id']}/messages").json()) == 2
    assert client.delete(f"/conversations/{chat['id']}").status_code == 409
    login(client, "other")
    assert client.get(f"/conversations/{chat['id']}/messages").status_code == 404


def test_sharing_does_not_leak_private_sources(client, monkeypatch):
    login(client)
    doc = client.post("/documents/upload", files={"file": ("private.txt", b"Private pension passage.")}).json()
    chat = client.post("/conversations").json()
    monkeypatch.setenv("AI_MODEL", "test-only")
    monkeypatch.setenv("LOCAL_MODEL", "true")

    async def completion(self, messages, language="en"):
        return "Private pension passage [source 1]", {}

    monkeypatch.setattr("app.adapters.AIProvider.complete", completion)
    client.post(
        f"/conversations/{chat['id']}/messages", json={"content": "Private pension?", "document_ids": [doc["id"]]}
    )
    assert client.post(f"/conversations/{chat['id']}/share", json={"email": "manager@demo.invalid"}).status_code == 404
    assert client.post(f"/documents/{doc['id']}/share", json={"email": "manager@demo.invalid"}).status_code == 200
    assert client.post(f"/conversations/{chat['id']}/share", json={"email": "manager@demo.invalid"}).status_code == 200


def test_outreach_meetings_notifications_and_commands(client):
    login(client)
    c = client.post("/outreach", json={"title": "Fictional review outreach", "language": "as"}).json()
    assert client.post(f"/outreach/{c['id']}/simulate").json()["real_contacts"] == 0
    assert len(client.get("/outreach").json()[0]["events"]) == 3
    assert "Synthetic workflow" in client.get(f"/outreach/{c['id']}/export").text
    assert (
        client.post(
            "/projects/1/meetings",
            json={"title": "Review", "starts_at": "2026-11-15T10:00:00Z", "transcript": "Manual notes"},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/projects/1/meetings",
            json={
                "title": "Review",
                "starts_at": "2026-11-15T10:00:00Z",
                "transcript": "Manual notes",
                "consent": True,
            },
        ).json()["external_scheduling"]
        is False
    )
    task = client.get("/tasks").json()[0]
    proposal = client.post(
        "/assistant/commands", json={"action": "set_priority", "task_id": task["id"], "priority": "Low"}
    ).json()
    assert proposal["confirmation_required"]
    assert client.get("/tasks").json()[0]["priority"] == "High"
    assert (
        client.post(
            "/assistant/commands",
            json={"action": "set_priority", "task_id": task["id"], "priority": "Low", "confirmed": True},
        ).json()["priority"]
        == "Low"
    )
    assert client.post("/notifications/read").status_code == 200
    assert all(n["read"] for n in client.get("/notifications").json())


def test_reset_revokes_sessions(client):
    login(client)
    token = client.post("/auth/reset-request", json={"email": "employee@demo.invalid"}).json()["demo_reset_token"]
    password = "fictional-test-password-2026"
    assert client.post("/auth/reset", json={"token": token, "password": password}).status_code == 200
    assert client.get("/me").status_code == 401
    assert client.post("/auth/reset", json={"token": token, "password": password}).status_code == 400
    assert client.post("/auth/login", json={"email": "employee@demo.invalid", "password": password}).status_code == 200
