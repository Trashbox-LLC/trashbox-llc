import { expect, test } from "@playwright/test";

test.describe("site navigation", () => {
  test("header links move between key pages", async ({ page }) => {
    await page.goto("/");

    const marketingNav = page.getByRole("navigation");

    await marketingNav
      .getByRole("button", { name: "Services", exact: true })
      .hover();
    await marketingNav
      .getByRole("region", { name: "Services" })
      .getByRole("link", {
        name: "Customer Relationship Management",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/platform\/?$/);

    const platformNav = page.getByRole("navigation", { name: /trashbox crm/i });
    await expect(
      platformNav.getByRole("link", { name: "Overview", exact: true }),
    ).toBeVisible();
    await expect(
      platformNav.getByRole("link", { name: "Login", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Services", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "About", exact: true }),
    ).toHaveCount(0);

    await page.goto("/");

    await marketingNav
      .getByRole("button", { name: "Services", exact: true })
      .hover();
    await marketingNav
      .getByRole("region", { name: "Services" })
      .getByRole("link", { name: "Websites", exact: true })
      .click();
    await expect(page).toHaveURL(/\/services\/websites\/?$/);
    await expect(
      page.getByRole("heading", { name: /sites that look sharp/i }),
    ).toBeVisible();

    const nav = page.getByRole("navigation");
    await nav.getByRole("link", { name: "About", exact: true }).click();
    await expect(page).toHaveURL(/\/about\/?$/);
    await expect(
      page.getByRole("heading", { name: /trashbox/i }),
    ).toBeVisible();

    await nav.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: /trashbox llc/i }),
    ).toBeVisible();
  });
});
