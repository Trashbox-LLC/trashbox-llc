import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FadeIn } from "@/components/atoms/FadeIn";
import { SPLASH_LEAVE_ANIMATION } from "@/components/features/marketing/SplashScreen";
import { MarketingLayout } from "./MarketingLayout";

const usePathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

vi.mock("@/components/features/marketing/SiteHeader", () => ({
  SiteHeader: () => <header>Site header</header>,
}));

vi.mock("@/components/features/marketing/SiteFooter", () => ({
  SiteFooter: () => <footer>Site footer</footer>,
}));

function finishSplash(): void {
  const splash = screen.getByRole("status", { name: "Loading" });
  const event = new Event("animationend", { bubbles: true });
  Object.defineProperty(event, "animationName", {
    value: SPLASH_LEAVE_ANIMATION,
  });
  act(() => {
    splash.dispatchEvent(event);
  });
}

describe("MarketingLayout", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
  });

  it("wraps marketing routes with header and footer", () => {
    render(
      <MarketingLayout>
        <p>Content</p>
      </MarketingLayout>,
    );

    expect(screen.getByText("Site header")).toBeInTheDocument();
    expect(screen.getByText("Site footer")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("shows a loading screen on the public site until it finishes", () => {
    render(
      <MarketingLayout>
        <p>Content</p>
      </MarketingLayout>,
    );

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("does not replay the loading screen after opening the portal", () => {
    usePathname.mockReturnValue("/portal/inbox/");
    const { rerender } = render(
      <MarketingLayout>
        <p>Portal content</p>
      </MarketingLayout>,
    );

    usePathname.mockReturnValue("/");
    rerender(
      <MarketingLayout>
        <p>Content</p>
      </MarketingLayout>,
    );

    expect(
      screen.queryByRole("status", { name: "Loading" }),
    ).not.toBeInTheDocument();
  });

  it("holds entrance motion until the loading screen finishes", async () => {
    render(
      <MarketingLayout>
        <FadeIn>
          <p>Intro copy</p>
        </FadeIn>
      </MarketingLayout>,
    );

    const intro = screen.getByText("Intro copy").parentElement;
    expect(intro).toHaveStyle({ opacity: "0" });

    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(intro).toHaveStyle({ opacity: "0" });

    finishSplash();

    await waitFor(() => {
      expect(intro).not.toHaveStyle({ opacity: "0" });
    });
  });

  it("plays entrance motion immediately on portal routes", async () => {
    usePathname.mockReturnValue("/portal/inbox/");

    render(
      <MarketingLayout>
        <FadeIn>
          <p>Portal intro</p>
        </FadeIn>
      </MarketingLayout>,
    );

    const intro = screen.getByText("Portal intro").parentElement;
    await waitFor(() => {
      expect(intro).not.toHaveStyle({ opacity: "0" });
    });
  });

  it("omits the loading screen on portal routes", () => {
    usePathname.mockReturnValue("/portal/inbox/");

    render(
      <MarketingLayout>
        <p>Portal content</p>
      </MarketingLayout>,
    );

    expect(
      screen.queryByRole("status", { name: "Loading" }),
    ).not.toBeInTheDocument();
  });

  it("omits marketing chrome on portal routes", () => {
    usePathname.mockReturnValue("/portal/inbox/");

    render(
      <MarketingLayout>
        <p>Portal content</p>
      </MarketingLayout>,
    );

    expect(screen.queryByText("Site header")).not.toBeInTheDocument();
    expect(screen.queryByText("Site footer")).not.toBeInTheDocument();
    expect(screen.getByText("Portal content")).toBeInTheDocument();
  });

  it("omits marketing chrome on platform routes", () => {
    usePathname.mockReturnValue("/platform/");

    render(
      <MarketingLayout>
        <p>Platform content</p>
      </MarketingLayout>,
    );

    expect(screen.queryByText("Site header")).not.toBeInTheDocument();
    expect(screen.queryByText("Site footer")).not.toBeInTheDocument();
    expect(screen.getByText("Platform content")).toBeInTheDocument();
  });

  it("treats a null pathname as a marketing route", () => {
    usePathname.mockReturnValue(null);

    expect(() =>
      render(
        <MarketingLayout>
          <p>Fallback</p>
        </MarketingLayout>,
      ),
    ).not.toThrow();

    expect(screen.getByText("Site header")).toBeInTheDocument();
    expect(screen.getByText("Fallback")).toBeInTheDocument();
  });
});
