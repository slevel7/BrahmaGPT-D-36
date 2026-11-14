# Database schema

The SQLAlchemy model source is `services/api/app/models.py`; Alembic revision `0001` initialises the schema. All records use foreign keys and indexed resource/department references. SQLite enables FK enforcement.

| Table | Purpose and important constraints |
| --- | --- |
| departments | Unique fictional department name |
| users | Unique email, password hash, department FK, role, profile and JSON preferences |
| sessions | Hashed opaque token PK, user FK, expiry |
| password_resets | Hashed single-use token, user FK, expiry |
| projects | Department and owner FKs, archived state |
| project_members | Unique project/user pair, membership role |
| tasks | Department, creator, owner and optional project FKs; status, priority, due date and persistent reminder |
| conversations | Owner FK, pinned/archived state, retention hold |
| conversation_shares | Unique conversation/user pair |
| messages | Conversation FK, role/content, source access dependencies, feedback |
| documents | Department/owner FKs, type, visibility, status, tags, retention hold |
| document_versions | Unique document/version and storage key, author, SHA-256, extracted text, summary, time |
| document_permissions | Unique document/user read share |
| document_chunks | Version FK, optional page number, text; nullable pgvector embedding on PostgreSQL / JSON on SQLite |
| approvals | Specific document/version FKs, requester/reviewer and status/comment |
| notifications | Recipient FK, resource reference, type, read flag |
| meetings | Project FK, timestamp, manual link, consent and transcript |
| outreach_campaigns | Department/owner FKs, language, simulation state |
| outreach_contacts | Campaign FK, synthetic name and consent |
| outreach_events | Campaign/contact FKs, local channel and synthetic feedback |
| audit_logs | Department/actor FKs, action/resource/detail/time |
| ai_usage | User FK, model and provider-reported tokens |

## Intentional MVP consolidation / remaining normalisation

Roles are a server-enforced enumeration rather than separate role/permission tables. User preferences, document tags and citation metadata use JSON. Reminder fields live on tasks; approval events and task history use audit logs; transcripts live on meetings. Separate `roles`, `permissions`, `user_roles`, `task_comments`, `task_reminders`, `document_tags`, `document_embeddings`, `approval_events`, `meeting_transcripts`, `integrations` and `user_preferences` tables from the master prompt are not fully implemented. Add migrations when expanding these modules. Semantic ranking is implemented without a native ANN index.

Originals are immutable through the application API; database administrators can still modify storage. Production must add storage-level WORM/object lock and append-only audit controls. Migrations deliberately reject automatic destructive downgrade.
