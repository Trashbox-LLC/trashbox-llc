import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("loads brand and primary navigation", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation");

    await expect(page.getByRole("heading", { name: /trashbox studios/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Trashbox Studios home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Services", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About Us", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contact", exact: true }).first()).toBeVisible();
    await expect(nav.getByRole("link", { name: "CRM", exact: true })).toHaveCount(0);
  });
});
