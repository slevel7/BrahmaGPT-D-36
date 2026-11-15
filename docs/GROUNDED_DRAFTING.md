# Grounded document drafting

## Repository inspection and execution plan

Starting point: main at d13637b, four existing commits; origin slevel7/BrahmaGPT-D-36, default branch main. The existing monorepo uses apps/web and services/api, with Alembic, SQLAlchemy, local/S3 storage, provider adapters and pytest/Playwright. The baseline backend suite passed 20 tests. No tracked lotus source asset was found. The referenced external prompt is specification input; the user's existing-repository and preservation requirements govern delivery.

Incremental work: (1) inspect baseline and create feature branch, (2) additive evidence migration and grounded extraction, (3) version-bound review chain and security checks, (4) existing UI extensions, (5) regression/security/browser verification, (6) commit, push and PR. No production database or existing uploads are migrated or overwritten by verification; tests use isolated SQLite databases and storage.

## Use

1. Upload a template with `{{title}}` and `{{sources}}`. Tag it `template`. Share it with the intended reviewers or set department visibility. Submit it for approval by a different authorised officer.
2. Upload evidence. Share source files with every configured reviewer. Source permissions are checked before generation and again during reads, submission, decisions and downloads.
3. In Documents, expand Source-grounded Brahma drafting. Select the approved template, evidence files and query. Choose reviewers (the UI displays their sequence; API order is authoritative).
4. Generate a DOCX. The deterministic extractive engine inserts exact retrieved passages. This is explicitly not an LLM completion. An empty result fails without creating a draft. No official reference is synthesised.
5. Inspect expandable evidence, checksums, exact version references and original downloads. Page numbers exist only for formats supporting extraction pages; unpaginated files are labelled accurately.
6. Create editable revisions through the existing document editor. Originals stay unchanged; evidence is carried forward and all edits receive an unsupported-until-human-verification warning.
7. Submit to the first configured reviewer. Each distinct human reviewer approves their own step. Document approval occurs only after the last step. Rejection or changes requested returns control for revision/resubmission; decisions remain in audit history.

## Backend contract

- POST /documents/grounded-draft: title, query, template_id, document_ids, recommendations, reviewer_ids, optional use_ai (default false).
- GET /documents/{id}/evidence: current version evidence or explicit unsupported-version warning.
- GET /documents/{id}/passages/{chunk_id}: exact immutable version/page/passage with ACL enforcement.
- Existing revision, submit, decision and download routes remain compatible.
- GET /me/activity?q=: own append-only activity (latest 200).
- GET/DELETE /me/tools/recent and POST /me/tools/{tool}/open: genuine per-user recents, separate from audit.

Migration 0002 adds only draft_evidence; apply `python -m alembic upgrade head` from services/api after backing up the deployment database. It preserves existing tables and rows.

## Security and limits

Sources and templates are untrusted content, never agent instructions. The extractive engine does not execute instructions in them. Verbatim evidence proves provenance, not truth or legal authority. Recommendations and manually edited prose are not automatically fact checked; humans must check factual correctness, relevance and authority. Historical source versions remain cited even when newer versions exist. Source revocation blocks access to dependent derived records; it does not erase previously downloaded copies.

Application ORM guards reject updates/deletions of versions, evidence and audit records. Administrators with direct SQL/object-store access can bypass application guards: restrict database roles, use protected object storage/backups and an external audit sink. Division/classification policies and expired multi-department membership are not yet modeled. Platform administrators no longer receive blanket private-document content access; department administrators retain existing department access.

Extractive drafting and the optional AI evidence-selection contract are verified with a test-only provider. Live provider operation is not verified. LLM paraphrasing/semantic claim validation, streaming generations, rich-text autosave, workflow admin/versioning, digital signatures, external providers and production PostgreSQL concurrency remain unverified or unimplemented. No credentials are bundled. The original lotus artwork must be supplied for faithful branding.

## Local startup

Backend: from services/api, `python -m alembic upgrade head`, then `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
Frontend: from apps/web, `npm.cmd run dev`. Open http://localhost:3000; API health is http://127.0.0.1:8000/health.
Demo entry uses synthetic employee@demo.invalid, approver@demo.invalid and admin@demo.invalid accounts; no password is committed. Never expose demo mode to untrusted users.

## Verification record

Local verification on 15 November 2026:

- Baseline: `python -m pytest -q` ? 20 passed before changes.
- Extended backend suite: `python -m pytest -q` - 32 passed; includes drafting, multistep approval, return/reject/resubmit, PDF page provenance, historical source references, ACL revocation, tampering, append-only guards and recents isolation.
- `python -m ruff check services scripts` ? passed.
- `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` from apps/web ? passed.
- `npm.cmd run test:e2e` ? 6 passed, including grounded drafting/approval and account/tool persistence (20.2 seconds in final clean run). Sandbox Windows server cleanup stalled after successful assertions; rerun with process-cleanup permission exited successfully.
- Isolated SQLite migration: `python -m alembic upgrade 0001`, `python -m alembic upgrade head`, `python -m alembic check` ? passed, no schema drift. The verification database is ignored under .local; no production data changed.
- `git diff --check` ? passed. Staged secret scan must run before commits.
- Desktop and mobile screenshots inspected/generated under ignored .local/screenshots. Existing screens and seeded functionality retained.
- PostgreSQL/container/live model-provider checks were not run locally; existing CI contains PostgreSQL and browser jobs.

One existing FastAPI/Starlette httpx deprecation warning remains. No live external AI/OAuth credentials were used. These results do not assert completion of the master specification or production readiness.

## Optional AI evidence selection

Set AI_MODEL and server-side provider credentials (or a configured local adapter). An administrator must explicitly enable GROUNDED_AI_ALLOWED=true after reviewing classification and provider-transfer policy. This flag defaults to false. The UI requires an explicit choice to use AI. The model receives only retrieved authorised evidence and the query; it must return a JSON list of existing chunk IDs. The backend rejects unknown IDs, duplicates, empty lists, arbitrary prose and extra fields. Document text and citations are rendered from the stored source passages, never model-supplied factual text. Usage and generation mode are recorded. Live credentials were not available; tests use a deterministic test-only provider, including a fabricated-reference rejection case.
