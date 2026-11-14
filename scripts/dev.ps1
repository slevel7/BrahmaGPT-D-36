$ErrorActionPreference = 'Stop'
$workspace = Split-Path $PSScriptRoot -Parent
Push-Location (Join-Path $workspace 'services/api')
try {
    python -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed' }
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
} finally { Pop-Location }
