import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setForceHideSiteHeader } from "@/lib/site-header-visibility";
import { SiteHeader } from "./SiteHeader";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("SiteHeader", () => {
  it("hides before paint so the entrance animation does not flash then snap", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("navigation")).toHaveAttribute(
      "data-hidden",
      "false",
    );
    expect(screen.getByRole("navigation").firstElementChild).toHaveStyle({
      opacity: "0",
      transform: "translateY(-16px)",
    });
  });

  it("hides on scroll down and returns on scroll up", () => {
    let scrollY = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollY,
    });

    render(<SiteHeader />);
    const nav = screen.getByRole("navigation");

    act(() => {
      scrollY = 40;
      window.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(nav).toHaveAttribute("data-hidden", "true");

    act(() => {
      scrollY = 60;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(nav).toHaveAttribute("data-hidden", "false");
  });

  it("stays hidden while a page section forces the header away", () => {
    setForceHideSiteHeader(false);
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation");

    act(() => {
      setForceHideSiteHeader(true);
    });
    expect(nav).toHaveAttribute("data-hidden", "true");

    act(() => {
      setForceHideSiteHeader(false);
    });
    expect(nav).toHaveAttribute("data-hidden", "false");
  });
  it("opens a Services dropdown with offering and CRM links", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.click(screen.getByRole("button", { name: /^services$/i }));

    expect(
      await screen.findByRole("menuitem", { name: /^websites$/i }),
    ).toHaveAttribute("href", "/services/websites");
    expect(
      screen.getByRole("menuitem", { name: /^web applications$/i }),
    ).toHaveAttribute("href", "/services/web-applications");
    expect(
      screen.getByRole("menuitem", { name: /^systems$/i }),
    ).toHaveAttribute("href", "/services/systems");
    expect(
      screen.getByRole("menuitem", { name: /^mobile apps$/i }),
    ).toHaveAttribute("href", "/services/mobile-apps");
    expect(
      screen.getByRole("menuitem", { name: /^ai integration$/i }),
    ).toHaveAttribute("href", "/services/ai-integration");
    expect(
      screen.getByRole("menuitem", {
        name: /^customer relationship management$/i,
      }),
    ).toHaveAttribute("href", expect.stringMatching(/\/platform\/?$/));
  });

  it("does not expose a top-level CRM link", () => {
    render(<SiteHeader />);

    expect(
      screen.queryByRole("link", { name: /^crm$/i }),
    ).not.toBeInTheDocument();
  });

  it("opens a mobile menu with a content-sized background panel", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const panel = screen
      .getByRole("navigation")
      .querySelector("[data-mobile-menu]");
    expect(panel).toBeTruthy();
    expect(panel).toHaveAttribute("data-open", "false");

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(panel).toHaveAttribute("data-open", "true");
    expect(panel).toHaveClass("bg-background");
    expect(panel?.className).not.toMatch(/border-white/);
    expect(panel).not.toHaveClass("fixed");
    expect(panel).not.toHaveClass("inset-0");

    expect(
      screen.getAllByRole("link", { name: /^work$/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen
        .getAllByRole("link", { name: /^work$/i })
        .every((link) => link.getAttribute("href") === "/work"),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: /^about$/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("link", { name: /^contact$/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });
});
