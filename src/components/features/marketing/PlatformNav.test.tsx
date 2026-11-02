import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformNav } from "./PlatformNav";

const usePathname = vi.fn(() => "/platform/");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("PlatformNav", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/platform/");
  });

  it("renders a fixed CRM header with logo, nav links, and Login", () => {
    render(<PlatformNav />);

    const nav = screen.getByRole("navigation", { name: /trashbox crm/i });
    expect(nav).toHaveClass("fixed");

    expect(
      screen.getByRole("link", { name: /trashbox studios home/i }),
    ).toHaveAttribute("href", "/");

    expect(screen.getByRole("link", { name: /^overview$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/\/platform\/?$/),
    );
    expect(screen.getByRole("link", { name: /^features$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/\/platform\/features\/?$/),
    );
    expect(screen.getByRole("link", { name: /^pricing$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/\/platform\/pricing\/?$/),
    );
    expect(screen.getByRole("link", { name: /^api$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/\/platform\/api\/?$/),
    );
    expect(
      screen.getByRole("link", { name: /^documentation$/i }),
    ).toHaveAttribute(
      "href",
      expect.stringMatching(/\/platform\/documentation\/?$/),
    );
    expect(screen.getByRole("link", { name: /^login$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/\/portal\/login\/?$/),
    );
  });

  it("opens a mobile menu with platform links", async () => {
    const user = userEvent.setup();
    render(<PlatformNav />);

    const panel = screen
      .getByRole("navigation")
      .querySelector("[data-mobile-menu]");
    expect(panel).toBeTruthy();
    expect(panel).toHaveAttribute("data-open", "false");

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(
      screen.getByRole("button", { name: /close menu/i }),
    ).toBeInTheDocument();
    expect(panel).toHaveAttribute("data-open", "true");
    expect(panel).toHaveClass("bg-background");
    expect(panel?.className).not.toMatch(/border-white/);
    expect(panel).not.toHaveClass("fixed");
    expect(panel).not.toHaveClass("inset-0");
    expect(
      screen.getAllByRole("link", { name: /^features$/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("link", { name: /^login$/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders without crashing when pathname is null", () => {
    usePathname.mockReturnValue(null);

    expect(() => render(<PlatformNav />)).not.toThrow();
    expect(
      screen.getByRole("link", { name: /^features$/i }),
    ).toBeInTheDocument();
  });
});
