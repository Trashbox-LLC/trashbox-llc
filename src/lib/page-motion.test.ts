import { afterEach, describe, expect, it } from "vitest";
import { gsap } from "@/lib/gsap-client";
import {
  cssDurationMs,
  holdPageMotion,
  pageMotionHeld,
  pageMotionReleaseDelay,
} from "@/lib/page-motion";

describe("pageMotionHeld", () => {
  it("holds only while the loading screen is still covering a public page", () => {
    const covering = {
      motionReleased: false,
      portal: false,
      logoPreview: false,
      reducedMotion: false,
    };

    expect(pageMotionHeld(covering)).toBe(true);
    expect(pageMotionHeld({ ...covering, motionReleased: true })).toBe(false);
    expect(pageMotionHeld({ ...covering, portal: true })).toBe(false);
    expect(pageMotionHeld({ ...covering, logoPreview: true })).toBe(false);
    expect(pageMotionHeld({ ...covering, reducedMotion: true })).toBe(false);
  });
});

describe("pageMotionReleaseDelay", () => {
  it("starts the page a little before a one second wipe finishes", () => {
    expect(pageMotionReleaseDelay(1000)).toBe(550);
    expect(cssDurationMs("1s")).toBe(1000);
    expect(cssDurationMs("450ms, 2s")).toBe(450);
  });

  it("starts immediately when the wipe is shorter than the lead", () => {
    expect(pageMotionReleaseDelay(200)).toBe(0);
    expect(pageMotionReleaseDelay(Number.NaN)).toBe(0);
  });
});

describe("holdPageMotion", () => {
  afterEach(() => {
    holdPageMotion(false);
    gsap.globalTimeline.getChildren(true, true, false).forEach((child) => {
      child.kill();
    });
  });

  it("keeps a tween parked until the hold is released", async () => {
    gsap.ticker.lagSmoothing(0);
    const state = { opacity: 0 };
    holdPageMotion(true);
    const tween = gsap.to(state, {
      opacity: 1,
      duration: 0.5,
      immediateRender: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(tween.progress()).toBe(0);

    holdPageMotion(false);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(tween.progress()).toBeGreaterThan(0);
    expect(tween.progress()).toBeLessThan(1);

    gsap.ticker.lagSmoothing(500, 33);
  });
});
