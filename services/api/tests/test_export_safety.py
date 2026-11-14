import csv
import io
from openpyxl import load_workbook
from app.documents import generate


def test_user_facts_do_not_become_spreadsheet_formulas():
    facts = '=HYPERLINK("https://example.invalid","synthetic")'
    result = generate("Test", "Office Note", facts, "csv")
    rows = list(csv.reader(io.StringIO(result.decode("utf-8-sig"))))
    assert rows[1][3].startswith("'=")
    book = load_workbook(io.BytesIO(generate("Test", "Office Note", facts, "xlsx")))
    assert book.active.cell(2, 4).data_type == "s"
