"""Scan staged text for common credential patterns without printing values."""

import re
import subprocess
import sys

files = subprocess.check_output(["git", "diff", "--cached", "--name-only", "-z"]).decode().split("\0")
patterns = [
    r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    r"\bgh[pousr]_[A-Za-z0-9]{30,}",
    r"\bgithub_pat_[A-Za-z0-9_]{50,}",
    r"\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}",
    r"\bAKIA[A-Z0-9]{16}\b",
]
bad = []
for path in filter(None, files):
    result = subprocess.run(["git", "show", ":" + path], capture_output=True)
    if result.returncode:
        continue
    if path.endswith(".env") or "/data/" in "/" + path or path.endswith((".db", ".pem", ".key")):
        bad.append(path)
        continue
    text = result.stdout.decode("utf-8", errors="ignore")
    if any(re.search(pattern, text) for pattern in patterns):
        bad.append(path)
if bad:
    print("Potential secrets or private data in staged files:", ", ".join(bad))
    sys.exit(1)
print(f"Staged secret-pattern review passed ({len(list(filter(None, files)))} files). Manual review remains required.")
