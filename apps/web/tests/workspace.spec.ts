import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, role = "employee") {
  await page.goto("/");
  await page.getByLabel("Demo role").selectOption(`${role}@demo.invalid`);
  await page.getByRole("button", { name: "Enter demonstration" }).click();
  await expect(
    page.getByRole("heading", { name: "How can Brahma help?" }),
  ).toBeVisible();
}
test("chat, documents, task persistence, language and simulation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.screenshot({
    path: "../../.local/screenshots/chat-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /^New chat/ }).click();
  await page
    .getByRole("textbox", { name: "Message Brahma" })
    .fill("Show my pension files");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "AI configuration required" }),
  ).toContainText("AI configuration required");
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await page.getByLabel("Upload documents", { exact: true }).setInputFiles({
    name: "browser-pension.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Pension review: 42 fictional records."),
  });
  await expect(
    page.getByRole("heading", { name: "browser-pension.txt" }),
  ).toBeVisible();
  await page.getByLabel("Search documents", { exact: true }).fill("42");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("Matching passages")).toBeVisible();
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await page.getByLabel("Title", { exact: true }).fill("Browser office note");
  await page
    .getByLabel("Facts and source material")
    .fill("Reviewed 42 synthetic records. No official authority asserted.");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Browser office note" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New revision" }).click();
  await page
    .getByLabel("Revised content")
    .fill("Reviewed 43 synthetic records.");
  await page.getByLabel("Change summary").fill("Updated synthetic count");
  await page.getByRole("button", { name: "Save new version" }).click();
  await expect(
    page.locator(".version-row").filter({ hasText: "Updated synthetic count" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "My Tasks" })
    .click();
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await page
    .getByLabel("Task title", { exact: true })
    .fill("Browser persistence task");
  await page
    .getByRole("button", { name: "Create task", exact: true })
    .last()
    .click();
  await expect(
    page.getByText("Browser persistence task", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "My Tasks" })
    .click();
  await expect(
    page.getByText("Browser persistence task", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Language", { exact: true }).selectOption("as");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "নথিপত্ৰ", exact: true }),
  ).toBeVisible();
  await page.getByLabel("ভাষা", { exact: true }).selectOption("en");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Department Work", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Outreach Agent", exact: true })
    .click();
  await page.getByLabel("Campaign title").fill("Browser synthetic outreach");
  await page.getByRole("button", { name: "Create campaign" }).click();
  await page.getByRole("button", { name: "Run simulation" }).last().click();
  await expect(page.getByText("3 simulated events · en").last()).toBeVisible();
  expect(errors).toEqual([]);
});
test("project creation and real membership operation", async ({ page }) => {
  await login(page, "manager");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Projects", exact: true })
    .click();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project title").fill("Browser project");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page.getByLabel("Member email").fill("employee@demo.invalid");
  await page.getByRole("button", { name: "Add member", exact: true }).click();
  await expect(
    page.locator(".member-chip").filter({ hasText: "Ananya Bora" }),
  ).toBeVisible();
});
