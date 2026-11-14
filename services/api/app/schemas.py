from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Login(Input):
    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=256)


class Email(Input):
    email: str = Field(max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class Reset(Input):
    token: str
    password: str = Field(min_length=12, max_length=256)


class ProjectInput(Input):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=20000)


class ProjectPatch(Input):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=20000)
    archived: bool | None = None


class TaskInput(Input):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=20000)
    owner_id: int | None = None
    project_id: int | None = None
    priority: Literal["High", "Medium", "Low"] = "Medium"
    due_date: date | None = None
    reminder_at: datetime | None = None


class TaskPatch(Input):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=20000)
    owner_id: int | None = None
    priority: Literal["High", "Medium", "Low"] | None = None
    status: Literal["To Do", "In Progress", "Completed", "Paused", "Cancelled"] | None = None
    due_date: date | None = None
    reminder_at: datetime | None = None


class ConversationPatch(Input):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    pinned: bool | None = None
    archived: bool | None = None


class ChatInput(Input):
    content: str = Field(min_length=1, max_length=20000)
    document_ids: list[int] = Field(default_factory=list, max_length=20)
    language: Literal["en", "as", "hi"] = "en"


class GenerateInput(Input):
    title: str = Field(min_length=1, max_length=200)
    kind: str = "Office Note"
    facts: str = Field(min_length=1, max_length=100000)
    format: Literal["txt", "csv", "pdf", "docx", "xlsx", "pptx"] = "docx"


class VersionInput(Input):
    text: str = Field(min_length=1, max_length=100000)
    summary: str = Field(min_length=1, max_length=500)
    format: Literal["txt", "docx"] = "docx"


class DocumentPatch(Input):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    visibility: Literal["private", "department"] | None = None
    tags: list[str] | None = Field(default=None, max_length=30)


class ApprovalInput(Input):
    reviewer_id: int


class Decision(Input):
    status: Literal["Under Review", "Changes Requested", "Approved", "Rejected"]
    comment: str = Field(default="", max_length=10000)


class Preferences(Input):
    language: Literal["en", "as", "hi"] = "en"
    theme: Literal["light", "dark", "system"] = "system"
    pinned_tools: list[str] = Field(default_factory=list, max_length=20)
    notifications: bool = True


class Profile(Input):
    name: str = Field(min_length=1, max_length=150)
    phone: str = Field(default="", max_length=30)
    designation: str = Field(default="", max_length=150)


class MeetingInput(Input):
    title: str = Field(min_length=1, max_length=200)
    starts_at: datetime
    link: str = Field(default="", max_length=1000)
    transcript: str = Field(default="", max_length=100000)
    consent: bool = False


class CampaignInput(Input):
    title: str = Field(min_length=1, max_length=200)
    language: Literal["en", "as", "hi"] = "en"


class Command(Input):
    action: Literal["list_pending", "daily_summary", "set_priority"]
    task_id: int | None = None
    priority: Literal["High", "Medium", "Low"] = "High"
    confirmed: bool = False
