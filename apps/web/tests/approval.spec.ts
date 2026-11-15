import { test, expect } from "@playwright/test";
test("human officer reviews the exact submitted draft", async ({ page }) => {
  const title = `Approval browser draft ${Date.now()}`;
  await page.goto("/");
  await page.getByRole("button", { name: "Enter demonstration" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByLabel("Facts and source material")
    .fill("Only synthetic facts: 17 demo records reviewed.");
  await page
    .getByRole("button", { name: "Generate draft", exact: true })
    .last()
    .click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page
    .getByLabel("Reviewing officer")
    .selectOption({ label: "Mira Saikia" });
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Submitted for human review.",
  );
  await page.locator(".profile-button").click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Demo role").selectOption("approver@demo.invalid");
  await page.getByRole("button", { name: "Enter demonstration" }).click();
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await expect(
    page.getByText(`Approval requested: ${title}`, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Department Work", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept("Verified synthetic facts."));
  await page
    .getByRole("button", { name: "Approved", exact: true })
    .last()
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Decision recorded: Approved",
  );
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await page.getByRole("button").filter({ hasText: title }).click();
  await expect(page.locator(".document-preview>.status-badge")).toHaveText(
    "Approved",
  );
  await page.screenshot({
    path: "../../.local/screenshots/approval-desktop.png",
    fullPage: true,
  });
});

test("mobile navigation remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter demonstration" }).click();
  await expect(
    page.getByRole("heading", { name: "How can Brahma help?" }),
  ).toBeVisible();
  await page.screenshot({
    path: "../../.local/screenshots/chat-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Toggle sidebar", exact: true })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Documents", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
