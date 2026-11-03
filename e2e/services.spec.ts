import { expect, test } from "@playwright/test";

test.describe("services page", () => {
  test("shows contact form fields", async ({ page }) => {
    await page.goto("/services");

    await expect(page.getByRole("heading", { name: /build once/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /start a project/i })).toBeVisible();

    await page.goto("/contact");

    await expect(page.getByRole("heading", { name: /start a project/i })).toBeVisible();
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
    await expect(page.getByPlaceholder("you@company.com")).toBeVisible();
    await expect(
      page.getByPlaceholder("Share a short brief, timeline, or goals…"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
  });
});
