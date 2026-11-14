import hashlib
import hmac
import secrets
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from .db import db_session, now
from .models import Session as LoginSession, User

WRITE_ROLES = {"super_admin", "department_admin", "approver", "project_manager", "employee"}
ADMIN_ROLES = {"super_admin", "department_admin"}
REVIEW_ROLES = ADMIN_ROLES | {"approver"}


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return f"{salt}:{digest}"


def verify_password(password, stored):
    salt, expected = stored.split(":")
    actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return hmac.compare_digest(actual, expected)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def current_user(request: Request, db: Session = Depends(db_session)):
    token = request.cookies.get("brahma_session", "")
    session = db.get(LoginSession, token_hash(token))
    if not session or session.expires_at <= now():
        raise HTTPException(401, "Please sign in")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, "Session is no longer valid")
    return user


def writable(user):
    if user.role not in WRITE_ROLES:
        raise HTTPException(403, "Read-only role")


def require_role(user, roles):
    if user.role not in roles:
        raise HTTPException(403, "This action requires an authorised role")
