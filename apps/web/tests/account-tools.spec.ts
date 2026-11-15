import { test, expect } from "@playwright/test";

test("tool favourites, recents and account preferences persist", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter demonstration" }).click();
  const nav = page.getByRole("navigation", { name: "Workspace" });
  await expect(nav.getByRole("button")).toHaveText([
    "Projects",
    "Department Work",
    "Documents",
    "Customize",
    "My Tasks",
  ]);
  await nav.getByRole("button", { name: "Customize", exact: true }).click();
  for (const tab of [
    "Recommended",
    "Favourites",
    "Recently Used",
    "All Tools",
    "Connected Tools",
    "Department Tools",
  ])
    await expect(
      page.getByRole("button", { name: tab, exact: true }),
    ).toBeVisible();
  const card = page
    .locator(".tool-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Document workspace",
        exact: true,
      }),
    });
  await card.getByRole("button", { name: "Pin shortcut", exact: true }).click();
  await page.getByRole("button", { name: "Favourites", exact: true }).click();
  await expect(card).toBeVisible();
  await card
    .getByRole("button", { name: "Open workspace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Documents", exact: true }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Customize", exact: true }).click();
  await page
    .getByRole("button", { name: "Recently Used", exact: true })
    .click();
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: "Account menu", exact: true }).hover();
  await expect(page.getByRole("menuitem")).toHaveCount(10);
  await page
    .getByRole("menuitem", { name: "Preferences", exact: true })
    .click();
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
