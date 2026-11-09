"use client";

import { gsap } from "@/lib/gsap-client";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Start the page underneath this long before the loader finishes leaving. */
export const PAGE_MOTION_LEAD_MS = 450;

/** True while entrance motion should stay parked. */
export function pageMotionHeld(input: {
  motionReleased: boolean;
  portal: boolean;
  logoPreview: boolean;
  reducedMotion: boolean;
}): boolean {
  return (
    !input.motionReleased &&
    !input.portal &&
    !input.logoPreview &&
    !input.reducedMotion
  );
}

/** Milliseconds after the wipe starts before the page underneath may move. */
export function pageMotionReleaseDelay(
  leaveDurationMs: number,
  leadMs = PAGE_MOTION_LEAD_MS,
): number {
  if (!Number.isFinite(leaveDurationMs) || leaveDurationMs <= 0) return 0;
  return Math.max(0, leaveDurationMs - leadMs);
}

/** First time in a CSS duration list, such as `1s` or `450ms`. */
export function cssDurationMs(value: string): number {
  const first = value.split(",")[0]?.trim() ?? "";
  if (first.endsWith("ms")) return Number.parseFloat(first);
  if (first.endsWith("s")) return Number.parseFloat(first) * 1000;
  return Number.NaN;
}

/**
 * Park every GSAP tween while the loading screen is up.
 * Call this during render: entrance tweens are created in child layout
 * effects, which run after this render.
 */
export function holdPageMotion(hold: boolean): void {
  if (typeof window === "undefined") return;
  if (hold) {
    gsap.globalTimeline.pause();
    return;
  }
  gsap.globalTimeline.resume();
}
