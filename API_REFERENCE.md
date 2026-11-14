# API reference

Interactive OpenAPI: direct backend `http://127.0.0.1:8000/docs` during local development. Browser API prefix is `/api`; API paths below omit that prefix.

All mutations require `X-Brahma-Client: web`, JSON Content-Type except multipart upload, and a matching Origin when present. Authenticated endpoints require the HttpOnly session cookie. Errors use FastAPI `detail`; HTTP 401 unauthenticated, 403 forbidden, 404 inaccessible/missing, 409 state conflict, 422 invalid input, 429 rate limited, 502 provider failed, 503 model unconfigured.

| Module | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /auth/login`, `/auth/demo`, `/auth/logout`, `/auth/reset-request`, `/auth/reset` |
| Account | `GET/PATCH /me`, `PUT /me/preferences`, `GET /me/sessions`, `DELETE /me/sessions/{reference}`, `GET /users` |
| Capability status | `GET /capabilities` |
| Projects | `GET/POST /projects`, `PATCH /projects/{id}`, `GET/POST /projects/{id}/members` |
| Tasks | `GET/POST /tasks`, `PATCH /tasks/{id}`, `GET /tasks/{id}/history` |
| Assistant | `POST /assistant/commands`: `list_pending`, `daily_summary`, `set_priority` (confirmation required) |
| Chat | `GET/POST /conversations`, `PATCH/DELETE /conversations/{id}`, `POST /conversations/{id}/share`, `GET/POST /conversations/{id}/messages` |
| Feedback | `POST /messages/{id}/feedback?value=helpful` or `unhelpful` |
| Documents | `GET /documents`, `POST /documents/upload`, `POST /documents/generate`, `GET /documents/search?q=…` |
| Document details | `GET/PATCH /documents/{id}`, `POST /documents/{id}/versions`, `GET /documents/{id}/compare?left=1&right=2`, `GET /documents/{id}/download?version=1` |
| Sharing and approvals | `POST /documents/{id}/share`, `/documents/{id}/submit`, `GET /approvals`, `POST /approvals/{id}/decision` |
| Notifications | `GET /notifications`, `POST /notifications/read`, `POST /notifications/{id}/read` |
| Meetings | `GET/POST /projects/{id}/meetings` |
| Outreach | `GET/POST /outreach`, `POST /outreach/{id}/simulate`, `GET /outreach/{id}/export` |
| Integration samples | `POST /integrations/eoffice/test`, `/integrations/legacy_systems/test` (admin only) |
| Governance | `GET /audit`, `GET /analytics` |

Chat POST returns NDJSON: `sources`, zero or more `delta` records, and `done`. Upstream completions are buffered. A configuration/provider failure does not insert fabricated assistant messages. No provider key can be set through a browser endpoint.

Upload supports up to 20 MB with whitelisted extensions and actual parser validation. Scanned image PDFs can have empty text; OCR is unconfigured. Compare performs text diffs, not structural/layout comparison. Download always enforces document access and serves an attachment.
