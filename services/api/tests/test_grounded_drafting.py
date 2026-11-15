import hashlib
from sqlalchemy import select, update
import pytest
from app.db import SessionLocal
from app import models as m
from .conftest import login


def prepare(client):
    login(client)
    users = client.get("/users").json()
    reviewer = next(u for u in users if u["role"] == "approver")
    admin = next(u for u in users if u["role"] == "department_admin")
    template = client.post(
        "/documents/upload",
        data={"visibility": "department"},
        files={"file": ("template.txt", b"{{title}}\n{{sources}}", "text/plain")},
    ).json()
    client.patch(f"/documents/{template['id']}", json={"tags": ["template"]})
    approval = client.post(f"/documents/{template['id']}/submit", json={"reviewer_id": reviewer["id"]}).json()
    login(client, "approver")
    assert client.post(f"/approvals/{approval['id']}/decision", json={"status": "Approved"}).status_code == 200
    login(client)
    source = client.post(
        "/documents/upload",
        data={"visibility": "department"},
        files={"file": ("evidence.txt", b"DEMO review examined 42 files.", "text/plain")},
    ).json()
    data = {
        "title": "Grounded review",
        "query": "examined",
        "template_id": template["id"],
        "document_ids": [source["id"]],
        "recommendations": "Consider a follow-up.",
        "reviewer_ids": [reviewer["id"], admin["id"]],
    }
    return data, source, reviewer, admin


def test_complete_grounded_draft_edit_review_and_approval(client):
    data, source, reviewer, admin = prepare(client)
    response = client.post("/documents/grounded-draft", json=data)
    assert response.status_code == 201, response.text
    doc = response.json()
    evidence = client.get(f"/documents/{doc['id']}/evidence").json()
    assert evidence["citations"][0]["sha256"] == hashlib.sha256(b"DEMO review examined 42 files.").hexdigest()
    original = client.get(f"/documents/{doc['id']}/download?version=1").content
    edit = client.post(
        f"/documents/{doc['id']}/versions", json={"text": "Proposed edited summary", "summary": "Human edit"}
    )
    assert edit.status_code == 201, edit.text
    assert client.get(f"/documents/{doc['id']}/download?version=1").content == original
    assert "unsupported" in client.get(f"/documents/{doc['id']}/evidence").json()["recommendations"]
    approval = client.post(f"/documents/{doc['id']}/submit", json={"reviewer_id": reviewer["id"]}).json()
    assert client.post(f"/approvals/{approval['id']}/decision", json={"status": "Approved"}).status_code == 403
    assert client.post(f"/documents/{doc['id']}/versions", json={"text": "Oops", "summary": "Edit"}).status_code == 409
    login(client, "approver")
    assert client.post(f"/approvals/{approval['id']}/decision", json={"status": "Approved"}).status_code == 200
    assert client.get(f"/documents/{doc['id']}").json()["status"] == "Submitted"
    assert client.post(f"/approvals/{approval['id']}/decision", json={"status": "Approved"}).status_code == 409
    login(client, "admin")
    pending = next(
        a for a in client.get("/approvals").json() if a["document_id"] == doc["id"] and a["status"] == "Submitted"
    )
    assert client.post(f"/approvals/{pending['id']}/decision", json={"status": "Approved"}).status_code == 200
    assert client.get(f"/documents/{doc['id']}").json()["status"] == "Approved"
    with SessionLocal() as db:
        actions = list(db.scalars(select(m.AuditLog.action).where(m.AuditLog.resource == f"document:{doc['id']}")))
        assert "draft.grounded" in actions and actions.count("approval.decision") == 2
    login(client, "other")
    for path in [f"/documents/{doc['id']}", f"/documents/{doc['id']}/evidence", f"/documents/{doc['id']}/download"]:
        assert client.get(path).status_code == 404
    assert not client.get("/documents/search?q=examined").json()["results"]


def test_missing_evidence_and_forged_citation_fail_closed(client):
    data, source, reviewer, _ = prepare(client)
    assert client.post("/documents/grounded-draft", json=data | {"query": "zzzznonexistent"}).status_code == 422
    doc = client.post("/documents/grounded-draft", json=data).json()
    with SessionLocal() as db:
        evidence = db.get(m.DraftEvidence, doc["version_id"])
        forged = [dict(c, passage="Fabricated official reference") for c in evidence.citations]
        # Simulate privileged out-of-band database corruption, bypassing ORM guards.
        db.execute(
            update(m.DraftEvidence).where(m.DraftEvidence.version_id == doc["version_id"]).values(citations=forged)
        )
        db.commit()
    assert client.get(f"/documents/{doc['id']}/evidence").status_code == 409
    assert client.get(f"/documents/{doc['id']}/download").status_code == 409
    assert client.post(f"/documents/{doc['id']}/submit", json={"reviewer_id": reviewer["id"]}).status_code == 409


def test_revoked_source_acl_hides_derived_draft(client):
    data, source, reviewer, _ = prepare(client)
    doc = client.post("/documents/grounded-draft", json=data).json()
    client.post(f"/documents/{doc['id']}/share", json={"email": reviewer["email"]})
    client.patch(f"/documents/{source['id']}", json={"visibility": "private"})
    login(client, "approver")
    assert client.get(f"/documents/{doc['id']}/evidence").status_code == 404
    assert doc["id"] not in [d["id"] for d in client.get("/documents").json()]
    assert all(c["document_id"] != doc["id"] for c in client.get("/documents/search?q=examined").json()["results"])


@pytest.mark.parametrize(
    "model,field", [(m.DocumentVersion, "text"), (m.DraftEvidence, "recommendations"), (m.AuditLog, "action")]
)
def test_application_cannot_mutate_history(client, model, field):
    data, _, _, _ = prepare(client)
    client.post("/documents/grounded-draft", json=data)
    with SessionLocal() as db:
        item = db.scalar(select(model))
        setattr(item, field, "Changed history")
        with pytest.raises(ValueError, match="append-only"):
            db.commit()
        db.rollback()


def test_genuine_recents_and_own_activity(client):
    employee = login(client)
    assert client.get("/me/tools/recent").json() == []
    assert client.post("/me/tools/documents/open").status_code == 200
    assert client.post("/me/tools/unknown/open").status_code == 422
    client.put("/me/preferences", json={"theme": "dark"})
    assert client.get("/me/tools/recent").json()[0]["id"] == "documents"
    assert client.delete("/me/tools/recent").status_code == 200
    assert client.get("/me/tools/recent").json() == []
    history = client.get("/me/activity?q=tool.opened").json()
    assert history and all(a["actor_id"] == employee["id"] for a in history)
    login(client, "other")
    assert client.get("/me/activity?q=tool.opened").json() == []


def test_platform_admin_has_no_blanket_private_document_access(client):
    login(client)
    source = client.post("/documents/upload", files={"file": ("private.txt", b"private proof", "text/plain")}).json()
    with SessionLocal() as db:
        platform = db.scalar(select(m.User).where(m.User.email == "manager@demo.invalid"))
        platform.role = "super_admin"
        email = platform.email
        db.commit()
    assert client.post("/auth/demo", json={"email": email}).status_code == 200
    assert client.get(f"/documents/{source['id']}").status_code == 404
    assert source["id"] not in [d["id"] for d in client.get("/documents").json()]


def test_exact_pdf_page_and_historical_source_version(client):
    import pymupdf

    data, _, reviewer, _ = prepare(client)
    with pymupdf.open() as pdf:
        pdf.new_page().insert_text((72, 72), "Cover")
        pdf.new_page().insert_text((72, 72), "DEMO examined 42 files on this page.")
        binary = pdf.tobytes()
    source = client.post(
        "/documents/upload", data={"visibility": "department"}, files={"file": ("paged.pdf", binary, "application/pdf")}
    ).json()
    data["document_ids"] = [source["id"]]
    doc = client.post("/documents/grounded-draft", json=data).json()
    evidence = client.get(f"/documents/{doc['id']}/evidence").json()
    citation = evidence["citations"][0]
    assert citation["page"] == 2
    assert citation["sha256"] == hashlib.sha256(binary).hexdigest()
    passage = client.get(f"/documents/{source['id']}/passages/{citation['chunk_id']}").json()
    assert passage["passage"] == citation["passage"]
    assert passage["page"] == 2
    client.post(
        f"/documents/{source['id']}/versions",
        json={"text": "New evidence examined 99 files", "summary": "New source revision"},
    )
    assert client.get(f"/documents/{doc['id']}/evidence").json()["citations"][0]["version_number"] == 1
    login(client, "other")
    assert client.get(f"/documents/{source['id']}/passages/{citation['chunk_id']}").status_code == 404


def test_grounded_review_return_reject_and_resubmit(client):
    data, _, reviewer, _ = prepare(client)
    data["reviewer_ids"] = [reviewer["id"]]
    doc = client.post("/documents/grounded-draft", json=data).json()
    assert (
        client.post(
            "/documents/grounded-draft", json=data | {"reviewer_ids": [reviewer["id"], reviewer["id"]]}
        ).status_code
        == 422
    )
    for status in ["Changes Requested", "Rejected", "Approved"]:
        login(client)
        step = client.post(f"/documents/{doc['id']}/submit", json={"reviewer_id": reviewer["id"]}).json()
        login(client, "approver")
        assert (
            client.post(
                f"/approvals/{step['id']}/decision", json={"status": status, "comment": "Human review"}
            ).status_code
            == 200
        )
    assert client.get(f"/documents/{doc['id']}").json()["status"] == "Approved"


def test_review_chain_grants_draft_access_to_each_configured_reviewer(client):
    data, _, reviewer, _ = prepare(client)
    with SessionLocal() as db:
        second = db.scalar(select(m.User).where(m.User.email == "manager@demo.invalid"))
        second.role = "approver"
        second_id = second.id
        db.commit()
    data["reviewer_ids"] = [reviewer["id"], second_id]
    doc = client.post("/documents/grounded-draft", json=data).json()
    step = client.post(f"/documents/{doc['id']}/submit", json={"reviewer_id": reviewer["id"]}).json()
    login(client, "approver")
    response = client.post(f"/approvals/{step['id']}/decision", json={"status": "Approved"})
    assert response.status_code == 200, response.text
    login(client, "manager")
    assert client.get(f"/documents/{doc['id']}").status_code == 200
    step = next(
        a for a in client.get("/approvals").json() if a["document_id"] == doc["id"] and a["status"] == "Submitted"
    )
    assert client.post(f"/approvals/{step['id']}/decision", json={"status": "Approved"}).status_code == 200


def test_ai_selection_is_policy_gated_and_cannot_create_citations(client, monkeypatch):
    import json
    from app.adapters import AIProvider

    data, _, _, _ = prepare(client)
    data["use_ai"] = True
    monkeypatch.setenv("GROUNDED_AI_ALLOWED", "false")
    assert client.post("/documents/grounded-draft", json=data).status_code == 403
    monkeypatch.setenv("GROUNDED_AI_ALLOWED", "true")
    assert client.post("/documents/grounded-draft", json=data).status_code == 503
    monkeypatch.setenv("AI_MODEL", "test-contract-model")
    monkeypatch.setenv("LOCAL_MODEL", "true")

    async def valid(self, messages, language="en"):
        evidence = json.loads(messages[-1]["content"])["untrusted_evidence"]
        return json.dumps({"chunk_ids": [evidence[0]["chunk_id"]]}), {"prompt_tokens": 12, "completion_tokens": 8}

    monkeypatch.setattr(AIProvider, "complete", valid)
    result = client.post("/documents/grounded-draft", json=data)
    assert result.status_code == 201, result.text
    assert "AI-selected" in result.json()["mode"]
    evidence = client.get(f"/documents/{result.json()['id']}/evidence").json()
    assert evidence["citations"][0]["passage"] == "DEMO review examined 42 files."

    async def fabricated(self, messages, language="en"):
        return '{"chunk_ids": [99999999], "official_reference": "invented"}', {}

    monkeypatch.setattr(AIProvider, "complete", fabricated)
    before = len(client.get("/documents").json())
    assert client.post("/documents/grounded-draft", json=data).status_code == 502
    assert len(client.get("/documents").json()) == before
