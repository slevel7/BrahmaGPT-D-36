from .conftest import login


def test_profile_preferences_and_session_revocation(client):
    login(client)
    result = client.patch(
        "/me", json={"name": "Demo Employee Updated", "phone": "synthetic-extension", "designation": "Demo Officer"}
    )
    assert result.status_code == 200
    assert client.get("/me").json()["name"] == "Demo Employee Updated"
    preferences = {"language": "hi", "theme": "light", "pinned_tools": ["documents", "eoffice"], "notifications": False}
    assert client.put("/me/preferences", json=preferences).json() == preferences
    assert client.get("/me").json()["preferences"] == preferences
    session = client.get("/me/sessions").json()[0]
    assert client.delete("/me/sessions/" + session["reference"]).status_code == 200
    assert client.get("/me").status_code == 401


def test_metadata_chat_sharing_archiving_and_task_dates(client):
    login(client)
    project = client.post("/projects", json={"title": "Metadata project"}).json()
    assert (
        client.patch(f"/projects/{project['id']}", json={"title": "Renamed project", "archived": True}).json()[
            "archived"
        ]
        is True
    )
    chat = client.post("/conversations").json()
    patch = client.patch(
        f"/conversations/{chat['id']}", json={"title": "Renamed conversation", "pinned": True, "archived": True}
    )
    assert patch.json()["pinned"] is True
    assert next(c for c in client.get("/conversations").json() if c["id"] == chat["id"])["archived"] is True
    assert client.post(f"/conversations/{chat['id']}/share", json={"email": "manager@demo.invalid"}).status_code == 200
    login(client, "manager")
    assert client.get(f"/conversations/{chat['id']}/messages").status_code == 200
    assert client.patch(f"/conversations/{chat['id']}", json={"title": "Forbidden edit"}).status_code == 404
    login(client)
    doc = client.post("/documents/generate", json={"title": "Tagged note", "facts": "Synthetic supplied facts"}).json()
    result = client.patch(
        f"/documents/{doc['id']}",
        json={"title": "Renamed note", "tags": ["synthetic", "review"], "visibility": "department"},
    )
    assert result.json()["tags"] == ["synthetic", "review"]
    task = client.post(
        "/tasks", json={"title": "Dated task", "due_date": "2026-11-20", "reminder_at": "2026-11-19T10:00:00Z"}
    ).json()
    assert task["due_date"] == "2026-11-20"
    assert task["reminder_at"].startswith("2026-11-19T10:00:00")
    assert (
        client.patch(f"/tasks/{task['id']}", json={"due_date": None, "reminder_at": None}).json()["reminder_at"] is None
    )
    notifications = client.get("/notifications").json()
    assert notifications
    assert client.post(f"/notifications/{notifications[0]['id']}/read").status_code == 200
    login(client, "approver")
    assert client.get(f"/documents/{doc['id']}").json()["title"] == "Renamed note"


def test_local_connector_status_and_admin_audit(client):
    login(client)
    assert client.post("/integrations/eoffice/test").status_code == 403
    login(client, "admin")
    result = client.post("/integrations/eoffice/test").json()
    assert result["external_connection"] is False
    assert result["mode"] == "local sample connector"
    assert client.post("/integrations/whatsapp/test").status_code == 409
    assert any(x["action"] == "integration.local_test" for x in client.get("/audit").json())
