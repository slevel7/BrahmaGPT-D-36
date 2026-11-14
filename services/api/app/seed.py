import secrets
from sqlalchemy import select
from .models import Department, User, Project, ProjectMember, Task
from .security import hash_password


def seed(db):
    if db.scalar(select(User.id).limit(1)):
        return
    department = Department(name="Pension & Public Grievances — Fictional Demo")
    other = Department(name="Education — Fictional Demo")
    db.add_all([department, other])
    db.flush()
    users = []
    for name, email, role, dept in [
        ("Ananya Bora", "employee@demo.invalid", "employee", department.id),
        ("Rohan Das", "manager@demo.invalid", "project_manager", department.id),
        ("Mira Saikia", "approver@demo.invalid", "approver", department.id),
        ("Dev Sharma", "admin@demo.invalid", "department_admin", department.id),
        ("Isha Deka", "auditor@demo.invalid", "auditor", department.id),
        ("Nila Roy", "other@demo.invalid", "employee", other.id),
    ]:
        user = User(
            name=name,
            email=email,
            role=role,
            department_id=dept,
            password_hash=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        users.append(user)
    db.flush()
    project = Project(
        title="Pension service review",
        description="Synthetic demonstration project for administrative collaboration.",
        owner_id=users[1].id,
        department_id=department.id,
    )
    db.add(project)
    db.flush()
    for user in users[:5]:
        db.add(
            ProjectMember(
                project_id=project.id, user_id=user.id, role="manager" if user.id == users[1].id else "member"
            )
        )
    db.add(
        Task(
            title="Prepare pension review office note",
            description="Use fictional facts only. Submit the draft for human review.",
            owner_id=users[0].id,
            creator_id=users[1].id,
            department_id=department.id,
            project_id=project.id,
            priority="High",
        )
    )
    db.commit()
