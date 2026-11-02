import { render, screen, within } from "@testing-library/react";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("links the public pages from the sitemap", () => {
    render(<SiteFooter />);

    const sitemap = screen.getByRole("navigation", { name: /sitemap/i });

    expect(within(sitemap).getByRole("link", { name: "Work" })).toHaveAttribute(
      "href",
      "/work",
    );
    expect(
      within(sitemap).getByRole("link", { name: "Contact" }),
    ).toHaveAttribute("href", "/contact");
    expect(
      within(sitemap).getByRole("link", { name: "Websites" }),
    ).toHaveAttribute("href", "/services/websites");
    expect(
      within(sitemap).getByRole("link", { name: "Pricing" }),
    ).toHaveAttribute("href", "/platform/pricing");
    expect(
      within(sitemap).getByRole("link", { name: "Client portal" }),
    ).toHaveAttribute("href", "/portal/login");
  });

  it("links email and phone", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: /714-586-1630/i })).toHaveAttribute(
      "href",
      "tel:+17145861630",
    );
    expect(
      screen.getByRole("link", { name: /contact@trashbox\.io/i }),
    ).toHaveAttribute("href", "mailto:contact@trashbox.io");
  });
});
