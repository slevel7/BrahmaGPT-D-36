# BrahmaGPT · Project D-36

An administrative productivity workspace developed by **Singularity**. Next.js frontend, FastAPI backend, persistent SQLAlchemy database, immutable document versions, project tasks, human approvals and a configurable Brahma AI assistant.

**Demonstration software. Fictional employees and records. No endorsement, authorisation or deployment by the Government of Assam is claimed. Do not upload real government or citizen records to an unsecured demo.**

## Quick start with Docker

Requirements: Docker Engine/Desktop with Compose, Git, at least 4 GB available RAM. From a fresh checkout:

```sh
git clone https://github.com/slevel7/BrahmaGPT-D-36.git
cd BrahmaGPT-D-36
cp .env.example .env
docker compose up --build
```

Open http://localhost:3000 and choose **Enter demonstration**. The default fictional employee is `employee@demo.invalid`. Choose `manager`, `approver`, `admin` or `auditor` in the demo role selector to exercise different permissions. `other@demo.invalid` belongs to another fictional department.

There are no committed demo passwords. Demo access is an explicit development bypass, restricted to synthetic accounts. Disable `DEMO_MODE` for an authorised deployment and provision users securely. Never expose demo mode publicly. The Compose web port binds to loopback by default. Database, Redis and API are private to the Compose network.

## Local development without Docker

Requirements: Python 3.13, Node.js 22, npm. SQLite provides a convenient functional local fallback; PostgreSQL is the intended deployment database.

```sh
python -m venv .venv
# Activate .venv using your platform's activation script.
python -m pip install -r services/api/requirements.txt
cd services/api
python -m alembic upgrade head
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

In another terminal, from the repository root:

```sh
cd apps/web
npm ci
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`. `scripts/dev.ps1` runs backend migration and development startup. The backend reads environment variables; `.env` is consumed by Docker Compose, not automatically loaded by a bare Python command. See [SETUP_GUIDE.md](SETUP_GUIDE.md) for provider setup, worker and production prerequisites.

## Working features

- Secure hashed passwords, opaque HttpOnly cookie sessions, logout, session revocation and demo password reset.
- Server-enforced role, department, project and document access checks.
- Persistent conversations, rename/pin/archive/export, authenticated sharing and feedback.
- Real OpenAI-compatible provider integration, including local model servers. No configured model means an explicit configuration error, never an invented answer.
- TXT/CSV/PDF/DOCX/XLSX/PPTX upload and text extraction; permission-filtered lexical passage search.
- Immutable originals, content checksums, new revisions, version downloads and text comparison.
- Real draft generation in six file formats using supplied facts and document templates.
- Projects, existing-account membership, task assignment/status/priority/due dates, task history and reminder worker.
- Manual internal calendar, meeting links and consent-gated transcripts.
- Human approval transitions bound to a specific document version, in-app notifications and audit logs.
- English, Assamese and Hindi navigation and primary labels; language and theme preferences.
- Database-backed dashboards, capability status and local outreach simulator with CSV reports.

## AI configuration

Set server-side `AI_BASE_URL`, `AI_MODEL` and `AI_API_KEY`. For a trusted local OpenAI-compatible server, set `LOCAL_MODEL=true` and its server URL/model. Restart the backend. Keys never enter browser configuration. Docker containers need a URL reachable from inside the container (for example `host.docker.internal`, when supported).

The current chat adapter buffers the upstream completion, then streams response chunks to the browser. Stop cancels the browser request; cancellation of an already-running upstream completion is not guaranteed. Context is limited to recent messages and retrieved passages. Sources expose authentic passages and referenced file versions and are retained as access dependencies for sharing. Set `EMBEDDING_MODEL` and run the worker for permission-filtered semantic retrieval. Without a working embedding provider/index, search uses a clearly labelled Unicode lexical fallback. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Verification

```sh
python -m pytest -q
python -m ruff check services scripts
cd apps/web
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts an isolated SQLite backend and the built Next.js server. Backend tests cover authentication, permissions, original preservation, approvals, real file formats, provider contracts and demo simulations. Contract tests substitute a deterministic provider **inside tests only**; live model quality requires credentials and is not claimed as tested. GitHub Actions runs backend, frontend and browser verification.

## Repository layout

```text
apps/web/               Next.js App Router, TypeScript, Tailwind, shadcn-style UI
services/api/           FastAPI, SQLAlchemy, Alembic, pytest
services/worker/        persistent task reminder polling
packages/shared/       cross-service contracts
infrastructure/docker/ container notes
docs/                  architecture, workflows, API, security notes
scripts/               local development and staged secret scan
.github/workflows/     automated checks
```

## Limits and delivery status

This is an extensible MVP, not a completed implementation of every feature in the master prompt or a certified production system. Speech, OCR, live outreach, external calendar/email/government connectors and WebAuthn are unconfigured or pending. Semantic retrieval and embedding contracts are tested with a test-only adapter; live providers, S3 and PostgreSQL/container operation require separate verification. Profile photos, discussions/comments, full role administration, collaboration editing and several advanced workflows remain pending. Detailed feature-by-feature status and test evidence are in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Production security work is in [SECURITY.md](SECURITY.md).

Originals and conversations carry retention holds. No automatic record deletion is exposed. Backups, retention schedules and legal authorisation require deployment-specific policy.

## GitHub workflow

Preserve remote history; never force-push. Review `git diff`, stage explicit source paths, run `python scripts/secret_scan.py`, commit a logical milestone and push to the authorised repository. `.gitignore` excludes secrets, uploads, local databases and generated private files. Never commit real government data. Read [CONTRIBUTING.md](CONTRIBUTING.md).

Further documentation: [architecture](ARCHITECTURE.md), [schema](DATABASE_SCHEMA.md), [API](API_REFERENCE.md), [setup](SETUP_GUIDE.md), [user guide](USER_GUIDE.md).
