# Architecture

Browser → same-origin Next.js `/api` proxy → FastAPI → SQLAlchemy → PostgreSQL (Compose) / SQLite (local fallback). Files use UUID storage keys in local storage or the S3-compatible adapter. The browser never receives AI or storage credentials.

## Boundaries

- FastAPI authenticates opaque session tokens using stored SHA-256 digests. Passwords use salted scrypt. Sessions expire after 12 hours.
- Department isolation is mandatory even for administrative roles. Project membership gates projects and linked tasks. Private documents require ownership, department administration or an explicit share. Shared chat reads recheck all source document permissions.
- Pydantic validates writes and rejects extra fields. Read-only auditors cannot create or edit administrative records. Approvals require a distinct, explicitly selected reviewer with an eligible role.
- Every file version gets a new random storage key and checksum. Original file storage is create-only. Revision numbers are unique per document. Approval decisions validate the submitted version and state.
- Chat retrieves permitted passages before calling an OpenAI-compatible provider. The system instruction treats source material as untrusted. This is a mitigation, not a complete prompt-injection guarantee. The model has no administrative action tools.
- Structured assistant commands execute validated database operations; consequential priority changes require an explicit confirmation field. They do not depend on free-text model output.
- In-app notifications are user scoped. Audit views require department administrator or auditor privileges.

## Background work

The separate reminder worker polls persistent task reminders every 30 seconds and marks delivery transactionally. PostgreSQL locks prevent duplicate concurrent processing. Redis is available for future queues/caching but not yet used; no Redis durability guarantees are claimed.

## Search and AI limits

Parsing and chunking are synchronous and bounded. The worker indexes pending chunks through the configured OpenAI-compatible embedding provider. PostgreSQL stores embeddings in pgvector columns; SQLite stores JSON vectors for local testing. Retrieval filters authorised latest document versions before cosine ranking. Ranking is currently in application memory with no native ANN index, so large collections need query/index optimisation. Missing indexes, provider failures or absent embedding configuration use a visibly labelled Unicode lexical fallback. Embedding contract tests use a test-only provider; no live embedding credentials were available.

The provider completion is buffered, persisted, then sent as NDJSON deltas. Context uses the latest 20 messages. No external service is connected merely because a URL/adapter exists. AI outputs remain drafts; document exports use only supplied facts.

## Operational scope

Compose uses PostgreSQL 17 + pgvector, Redis 7, Python 3.13 and Node 22. It binds the web UI to loopback and uses persistent data volumes. TLS, SSO, HA, backup restore drills, distributed rate limits, malware scanning, object locking and independent security review are deployment prerequisites.
