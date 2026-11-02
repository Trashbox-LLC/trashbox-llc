import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    expect(screen.getByRole("navigation")).not.toHaveClass("-translate-y-full");
    expect(screen.getByRole("navigation").firstElementChild).toHaveStyle({
      opacity: "0",
      transform: "translateY(-16px)",
    });
  });

  it("stays at the top while scrolling down and back up", () => {
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
    expect(nav).toBeVisible();
    expect(nav).not.toHaveClass("-translate-y-full");

    act(() => {
      scrollY = 60;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(nav).toBeVisible();
    expect(nav).not.toHaveClass("-translate-y-full");
  });

  it("fades the background in as the hero image moves under the header", () => {
    render(
      <>
        <SiteHeader />
        <div data-header-scrim-target />
      </>,
    );

    const scrim = screen
      .getByRole("navigation")
      .querySelector("[data-header-scrim]") as HTMLElement;
    const bar = scrim.parentElement as HTMLElement;
    const media = document.querySelector(
      "[data-header-scrim-target]",
    ) as HTMLElement;
    let mediaTop = 180;

    const spy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: Element) {
        if (this === bar) return new DOMRect(0, 0, 200, 100);
        if (this === media) return new DOMRect(0, mediaTop, 200, 400);
        return new DOMRect();
      });

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(scrim.style.opacity).toBe("0");

    mediaTop = 50;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(scrim.style.opacity).toBe("0.5");

    mediaTop = -10;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(scrim.style.opacity).toBe("1");

    spy.mockRestore();
  });

  it("shows the background after leaving the top of a page without a hero image", () => {
    let scrollY = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollY,
    });

    render(<SiteHeader />);
    const scrim = screen
      .getByRole("navigation")
      .querySelector("[data-header-scrim]") as HTMLElement;

    act(() => {
      scrollY = 0;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(scrim.style.opacity).toBe("0");

    act(() => {
      scrollY = 40;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(scrim.style.opacity).toBe("1");
  });
  it("calls the site number from the header", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "714-586-1630" })).toHaveAttribute(
      "href",
      "tel:+17145861630",
    );
  });

  it("marks the current page for the traveling underline", () => {
    render(<SiteHeader />);

    expect(
      screen.getAllByRole("link", { name: /^home$/i }).every(
        (link) => link.getAttribute("aria-current") === "page",
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole("button", { name: /^services$/i }).every(
        (button) => !button.hasAttribute("aria-current"),
      ),
    ).toBe(true);
  });

  it("opens the services menu on hover with offering and CRM links", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    expect(
      screen.queryByRole("link", { name: /^websites$/i }),
    ).not.toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: /^services$/i }));

    expect(screen.getByRole("link", { name: /^websites$/i })).toHaveAttribute(
      "href",
      "/services/websites",
    );
    expect(
      screen.getByRole("link", { name: /^web applications$/i }),
    ).toHaveAttribute("href", "/services/web-applications");
    expect(screen.getByRole("link", { name: /^systems$/i })).toHaveAttribute(
      "href",
      "/services/systems",
    );
    expect(
      screen.getByRole("link", { name: /^mobile apps$/i }),
    ).toHaveAttribute("href", "/services/mobile-apps");
    expect(
      screen.getByRole("link", { name: /^ai integration$/i }),
    ).toHaveAttribute("href", "/services/ai-integration");
    expect(
      screen.getByRole("link", {
        name: /^customer relationship management$/i,
      }),
    ).toHaveAttribute("href", expect.stringMatching(/\/platform\/?$/));
  });

  it("closes the services menu when the pointer leaves the header", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.hover(screen.getByRole("button", { name: /^services$/i }));
    expect(screen.getByRole("link", { name: /^websites$/i })).toBeInTheDocument();

    const bar = screen
      .getByRole("navigation")
      .querySelector("[data-header-scrim]")?.parentElement as HTMLElement;
    fireEvent.mouseLeave(bar, { relatedTarget: document.body });

    expect(
      screen.queryByRole("link", { name: /^websites$/i }),
    ).not.toBeInTheDocument();
  });

  it("closes the services menu on Escape", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.hover(screen.getByRole("button", { name: /^services$/i }));
    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("link", { name: /^websites$/i }),
    ).not.toBeInTheDocument();
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
      screen.getAllByRole("link", { name: /^about us$/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen
        .getAllByRole("link", { name: /^about us$/i })
        .every((link) => link.getAttribute("href") === "/about"),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: /^contact$/i }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen
        .getAllByRole("link", { name: /^contact$/i })
        .every((link) => link.getAttribute("href") === "/services#contact"),
    ).toBe(true);
  });
});
