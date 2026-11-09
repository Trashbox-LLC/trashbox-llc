import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SplashScreen, SPLASH_LEAVE_ANIMATION } from "./SplashScreen";

function finishAnimation(element: Element, animationName: string): void {
  const event = new Event("animationend", { bubbles: true });
  Object.defineProperty(event, "animationName", { value: animationName });
  act(() => {
    element.dispatchEvent(event);
  });
}

function startLeave(element: Element): void {
  const event = new Event("animationstart", { bubbles: true });
  Object.defineProperty(event, "animationName", {
    value: SPLASH_LEAVE_ANIMATION,
  });
  act(() => {
    element.dispatchEvent(event);
  });
}

describe("SplashScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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

  it("lets the page start while the splash is still leaving", () => {
    vi.useFakeTimers();
    const computedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const style = computedStyle(element);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === "animationDuration") return "1s";
          const value = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    });

    const onReveal = vi.fn();
    const onDone = vi.fn();
    render(<SplashScreen onReveal={onReveal} onDone={onDone} />);
    const splash = screen.getByRole("status", { name: "Loading" });

    startLeave(splash);
    act(() => {
      vi.advanceTimersByTime(549);
    });
    expect(onReveal).not.toHaveBeenCalled();
    expect(splash).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onReveal).toHaveBeenCalledOnce();
    expect(onDone).not.toHaveBeenCalled();
    expect(splash).toHaveClass("splash-motion-released");

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
