import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SplashScreen, SPLASH_LEAVE_ANIMATION } from "./SplashScreen";

function finishAnimation(element: Element, animationName: string): void {
  const event = new Event("animationend", { bubbles: true });
  Object.defineProperty(event, "animationName", { value: animationName });
  act(() => {
    element.dispatchEvent(event);
  });
}

describe("SplashScreen", () => {
  it("holds the page until the splash finishes fading", () => {
    const onDone = vi.fn();
    render(<SplashScreen onDone={onDone} />);

    const splash = screen.getByRole("status", { name: "Loading" });
    const mark = splash.firstElementChild;
    expect(mark).not.toBeNull();
    finishAnimation(mark as Element, "splash-fill");
    expect(splash).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    finishAnimation(splash, SPLASH_LEAVE_ANIMATION);
    expect(onDone).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("status", { name: "Loading" }),
    ).not.toBeInTheDocument();
  });

  it("skips the splash when reduced motion is preferred", () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const onDone = vi.fn();
    render(<SplashScreen onDone={onDone} />);

    expect(
      screen.queryByRole("status", { name: "Loading" }),
    ).not.toBeInTheDocument();
    expect(onDone).toHaveBeenCalledOnce();

    window.matchMedia = matchMedia;
  });
});
