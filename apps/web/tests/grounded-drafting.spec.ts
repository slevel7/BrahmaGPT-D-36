import { test, expect } from "@playwright/test";

test("grounded draft retains evidence through human approval", async ({
  page,
}) => {
  const headers = { "X-Brahma-Client": "web" };
  const post = async (url: string, data: unknown) => {
    const response = await page.request.post("/api" + url, { headers, data });
    expect(response.ok(), await response.text()).toBeTruthy();
    return response.json();
  };
  await post("/auth/demo", { email: "employee@demo.invalid" });
  const users = await (await page.request.get("/api/users")).json();
  const reviewer = users.find((u: { role: string }) => u.role === "approver");
  const upload = async (name: string, text: string) => {
    const response = await page.request.post("/api/documents/upload", {
      headers,
      multipart: {
        visibility: "department",
        file: { name, mimeType: "text/plain", buffer: Buffer.from(text) },
      },
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  };
  const template = await upload(
    `Template ${Date.now()}.txt`,
    "{{title}}\n{{sources}}",
  );
  await page.request.patch(`/api/documents/${template.id}`, {
    headers,
    data: { tags: ["template"] },
  });
  const approval = await post(`/documents/${template.id}/submit`, {
    reviewer_id: reviewer.id,
  });
  await post("/auth/demo", { email: "approver@demo.invalid" });
  await post(`/approvals/${approval.id}/decision`, { status: "Approved" });
  await post("/auth/demo", { email: "employee@demo.invalid" });
  const source = await upload(
    `Evidence ${Date.now()}.txt`,
    "DEMO examined 42 files.",
  );
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await page
    .getByText("Source-grounded Brahma drafting", { exact: true })
    .click();
  const title = `Grounded browser draft ${Date.now()}`;
  await page.getByLabel("Draft title", { exact: true }).fill(title);
  await page
    .getByLabel("Approved template", { exact: true })
    .selectOption(String(template.id));
  await page.getByLabel("Evidence search query").fill("examined");
  await page
    .getByLabel("Source documents", { exact: true })
    .selectOption([String(source.id)]);
  await page
    .getByLabel("Human review sequence")
    .selectOption([String(reviewer.id)]);
  await page
    .getByRole("button", { name: "Create grounded DOCX draft" })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Version-bound source evidence" }),
  ).toBeVisible();
  await page.getByLabel("Reviewing officer").selectOption(String(reviewer.id));
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Submitted for human review",
  );
  await post("/auth/demo", { email: "approver@demo.invalid" });
  const queue = await (await page.request.get("/api/approvals")).json();
  const step = queue.find(
    (a: { status: string; id: number }) => a.status === "Submitted",
  );
  await post(`/approvals/${step.id}/decision`, {
    status: "Approved",
    comment: "Verified exact DEMO evidence",
  });
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await page.getByRole("button").filter({ hasText: title }).click();
  await expect(page.locator(".document-preview>.status-badge")).toHaveText(
    "Approved",
  );
});
