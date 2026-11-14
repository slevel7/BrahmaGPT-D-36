# Setup guide

## Environment

See README for local and Compose commands. Python 3.13 and Node 22 are the verified host versions. Use a virtual environment. `.env.example` is a Compose template, not a source of production credentials. SQLAlchemy uses SQLite in `services/api/data` by default when run from that directory.

| Variable | Meaning |
| --- | --- |
| `DEMO_MODE` | `true` seeds synthetic accounts and allows explicit demo login; set `false` before any real deployment |
| `DATABASE_URL` | SQLAlchemy PostgreSQL+psycopg or SQLite URL |
| `STORAGE_DIR` | Private local immutable file-version directory |
| `WEB_ORIGIN` | Exact browser origin; default `http://localhost:3000` |
| `COOKIE_SECURE` | `true` for HTTPS; HTTP local development needs `false` |
| `AI_BASE_URL` | Trusted server-side OpenAI-compatible `/v1` base URL |
| `AI_MODEL`, `AI_API_KEY` | Model identifier and secret credential |
| `LOCAL_MODEL` | `true` permits a trusted local server without API key |
| `EMBEDDING_MODEL` | OpenAI-compatible embedding model; run the worker to index pending chunks |
| `S3_BUCKET`, `S3_ENDPOINT_URL` | Optional S3-compatible storage using ambient AWS credentials; existing versions must be migrated before switching stores |
| `PDF_FONT_PATH` | Unicode TrueType font with desired script coverage; DOCX recommended when unset |
| `API_INTERNAL_URL` | Next.js build-time proxy target; local default `http://127.0.0.1:8000`; Docker build sets `http://api:8000` |
| `POSTGRES_PASSWORD` | Compose development DB password override; replace local default |

Server secrets must be injected by a deployment secret manager; never use `NEXT_PUBLIC_` variables for them. No government, speech, email, calendar, telephony or WhatsApp credentials are present.

## Worker

Run from `services/api` with the same database variables:

```powershell
$env:PYTHONPATH = (Get-Location).Path
python ../worker/main.py
```

On POSIX, `PYTHONPATH=. python ../worker/main.py`. It delivers persistent reminder notifications at most 30 seconds after the scheduled time (excluding downtime). UTC is used in storage. UI converts local date/time values to UTC.

## Non-demo bootstrap

Run Alembic first. Use an authorised administration script or secure database provisioning process to create departments and users, hashing each password with `app.security.hash_password`. There is deliberately no unauthenticated registration or bootstrap-admin endpoint. Account lifecycle UI and external identity federation remain production work.

## Test isolation

Pytest uses a separate temporary database/files directory. Playwright uses a timestamped `.local/e2e-*.db` and `.local/e2e-files`, and reuses local servers only if already running. For reliable isolated tests, stop other servers on ports 3000/8000 first. Run `npm run build` before Playwright. The tests do not need an AI key; real model verification must be performed separately with authorised credentials.

## Container verification

`docker compose config` validates configuration. `docker compose up --build` should run migrations, seed synthetic data, and start web/API/worker/database. Check `docker compose ps`, `docker compose logs api worker web`, and log in through the browser. Docker is not installed on the authoring host; do not interpret source configuration as a verified container deployment.

Before public or sensitive deployment, complete SECURITY.md, disable demo login, configure TLS/SSO and access provisioning, verify backups, validate PostgreSQL and S3 behavior, and obtain operational authorisation.
