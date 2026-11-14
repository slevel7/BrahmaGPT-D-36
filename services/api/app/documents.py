import csv
import hashlib
import io
import uuid
import zipfile
from pathlib import Path
from fastapi import HTTPException
from sqlalchemy import select, func
from .adapters import Storage
from .models import DocumentVersion, DocumentChunk

FORMATS = {"txt", "csv", "pdf", "docx", "xlsx", "pptx"}
KINDS = {
    "Official Letter",
    "Office Note",
    "Memorandum",
    "Circular",
    "Notice",
    "Report",
    "Meeting Minutes",
    "RTI Response Draft",
    "Miscellaneous",
}
MAX_BYTES = 20 * 1024 * 1024


def extract(data, extension):
    if extension in {"txt", "csv"}:
        return [(None, data.decode("utf-8-sig"))]
    if extension in {"docx", "xlsx", "pptx"}:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            if sum(i.file_size for i in archive.infolist()) > 60 * 1024 * 1024 or len(archive.infolist()) > 5000:
                raise ValueError("Expanded document exceeds safety limit")
    if extension == "pdf":
        import pymupdf

        if not data.startswith(b"%PDF"):
            raise ValueError("Invalid PDF header")
        with pymupdf.open(stream=data, filetype="pdf") as pdf:
            return [(i + 1, page.get_text()) for i, page in enumerate(pdf)]
    if extension == "docx":
        from docx import Document

        doc = Document(io.BytesIO(data))
        return [
            (
                None,
                "\n".join(
                    [p.text for p in doc.paragraphs]
                    + [" | ".join(c.text for c in r.cells) for t in doc.tables for r in t.rows]
                ),
            )
        ]
    if extension == "xlsx":
        from openpyxl import load_workbook

        book = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
        pages = [
            (
                None,
                sheet.title
                + "\n"
                + "\n".join(" | ".join(str(c or "") for c in row) for row in sheet.iter_rows(values_only=True)),
            )
            for sheet in book
        ]
        book.close()
        return pages
    from pptx import Presentation

    deck = Presentation(io.BytesIO(data))
    return [
        (i + 1, "\n".join(shape.text for shape in slide.shapes if shape.has_text_frame))
        for i, slide in enumerate(deck.slides)
    ]


def create_version(db, document, user, filename, data, summary):
    extension = Path(filename).suffix.lower().lstrip(".")
    if extension not in FORMATS or not data or len(data) > MAX_BYTES:
        raise HTTPException(422, "Use TXT, CSV, PDF, DOCX, XLSX or PPTX, up to 20 MB")
    try:
        pages = extract(data, extension)
    except Exception as exc:
        raise HTTPException(422, "Could not safely parse this document") from exc
    if sum(len(t) for _, t in pages) > 2_000_000:
        raise HTTPException(422, "Extracted text exceeds safety limit")
    number = (
        db.scalar(select(func.max(DocumentVersion.number)).where(DocumentVersion.document_id == document.id)) or 0
    ) + 1
    key = uuid.uuid4().hex + "." + extension
    Storage().put(key, data)
    version = DocumentVersion(
        document_id=document.id,
        number=number,
        author_id=user.id,
        filename=Path(filename).name[:255],
        storage_key=key,
        sha256=hashlib.sha256(data).hexdigest(),
        text="\n".join(t for _, t in pages),
        change_summary=summary,
    )
    db.add(version)
    db.flush()
    for page, text in pages:
        for offset in range(0, len(text), 900):
            db.add(DocumentChunk(version_id=version.id, page=page, text=text[offset : offset + 1100]))
    return version


def generate(title, kind, facts, extension):
    """Template renderer uses supplied facts only. This is not an AI answer."""
    content = f"DRAFT — HUMAN REVIEW REQUIRED\n{kind}\n{title}\n\n{facts}\n\nPrepared in BrahmaGPT demonstration environment. No official authority asserted."
    buffer = io.BytesIO()
    if extension == "txt":
        return content.encode("utf-8")
    if extension == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Status", "Type", "Title", "Facts"])

        def safe_cell(value):
            return "'" + value if value.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")) else value

        writer.writerow([safe_cell(value) for value in ["Draft", kind, title, facts]])
        return output.getvalue().encode("utf-8-sig")
    if extension == "docx":
        from docx import Document

        doc = Document()
        doc.add_heading("DRAFT — HUMAN REVIEW REQUIRED", 0)
        doc.add_heading(title, 1)
        doc.add_paragraph(kind)
        for line in facts.splitlines():
            doc.add_paragraph(line)
        doc.save(buffer)
    elif extension == "pdf":
        from reportlab.pdfgen.canvas import Canvas
        from reportlab.lib.utils import simpleSplit
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        # Unicode PDF requires a configured font with the desired script coverage.
        import os

        font_path = os.getenv("PDF_FONT_PATH")
        if any(ord(c) > 255 for c in title + kind + facts) and not font_path:
            raise HTTPException(
                422, "Unicode PDF requires PDF_FONT_PATH with suitable script support; use DOCX instead"
            )
        font = "Helvetica"
        if font_path:
            pdfmetrics.registerFont(TTFont("ConfiguredFont", font_path))
            font = "ConfiguredFont"
        if not font_path:
            content = content.replace("—", "-")
        canvas = Canvas(buffer)
        canvas.setFont(font, 11)
        y = 790
        for line in content.splitlines():
            for wrapped in simpleSplit(line, font, 11, 475) or [""]:
                if y < 55:
                    canvas.showPage()
                    canvas.setFont(font, 11)
                    y = 790
                canvas.drawString(55, y, wrapped)
                y -= 16
        canvas.save()
    elif extension == "xlsx":
        from openpyxl import Workbook

        book = Workbook()
        book.active.append(["Status", "Type", "Title", "Facts"])
        # Explicit text cells prevent formula injection from supplied facts.
        for col, value in enumerate(["Draft", kind, title, facts], 1):
            cell = book.active.cell(2, col, value)
            cell.data_type = "s"
        book.save(buffer)
    elif extension == "pptx":
        from pptx import Presentation

        deck = Presentation()
        slide = deck.slides.add_slide(deck.slide_layouts[1])
        slide.shapes.title.text = title + " (DRAFT)"
        slide.placeholders[1].text = kind + "\n" + facts
        deck.save(buffer)
    else:
        raise HTTPException(422, "Unsupported export format")
    return buffer.getvalue()
