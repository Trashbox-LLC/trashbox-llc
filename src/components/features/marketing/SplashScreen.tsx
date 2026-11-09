"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  cssDurationMs,
  pageMotionReleaseDelay,
} from "@/lib/page-motion";
import { cn } from "@/lib/utils";

export const SPLASH_LEAVE_ANIMATION = "splash-leave";

const LOGO = "/images/trashbox-logo-outlined.svg";

type SplashScreenProps = {
  /** Loop the fill and keep the screen up. Used by Storybook. */
  persist?: boolean;
  /** Page underneath may start while this screen is still leaving. */
  onReveal?: () => void;
  onDone?: () => void;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** First-paint cover: grey outlined mark fills white, then the screen wipes away. */
export function SplashScreen({
  persist = false,
  onReveal,
  onDone,
}: SplashScreenProps) {
  const [gone, setGone] = useState(false);
  const [motionReleased, setMotionReleased] = useState(false);
  const finished = useRef(false);
  const revealed = useRef(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const onRevealRef = useRef(onReveal);
  const onDoneRef = useRef(onDone);
  onRevealRef.current = onReveal;
  onDoneRef.current = onDone;

  function releaseMotion(): void {
    if (revealed.current) return;
    revealed.current = true;
    setMotionReleased(true);
    onRevealRef.current?.();
  }

  useEffect(() => {
    if (persist || !prefersReducedMotion()) return;
    finished.current = true;
    releaseMotion();
    onDoneRef.current?.();
    setGone(true);
  }, [persist]);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen || persist) return;
    const splash: HTMLDivElement = screen;
    let releaseTimer = 0;

    function onAnimationStart(event: AnimationEvent): void {
      if (event.target !== splash) return;
      if (event.animationName !== SPLASH_LEAVE_ANIMATION) return;
      const duration = cssDurationMs(
        getComputedStyle(splash).animationDuration,
      );
      releaseTimer = window.setTimeout(
        releaseMotion,
        pageMotionReleaseDelay(duration),
      );
    }

    function onAnimationEnd(event: AnimationEvent): void {
      if (finished.current) return;
      if (event.target !== splash) return;
      if (event.animationName !== SPLASH_LEAVE_ANIMATION) return;
      finished.current = true;
      window.clearTimeout(releaseTimer);
      releaseMotion();
      onDoneRef.current?.();
      setGone(true);
    }

    splash.addEventListener("animationstart", onAnimationStart);
    splash.addEventListener("animationend", onAnimationEnd);
    return () => {
      window.clearTimeout(releaseTimer);
      splash.removeEventListener("animationstart", onAnimationStart);
      splash.removeEventListener("animationend", onAnimationEnd);
    };
  }, [persist]);

  if (gone) return null;

  return (
    <div
      ref={screenRef}
      role="status"
      aria-label="Loading"
      aria-live="polite"
      className={cn(
        "splash-screen bg-background fixed inset-0 z-[80] flex items-center justify-center",
        motionReleased && "splash-motion-released",
        persist && "splash-screen-persist",
      )}
    >
      <div className="splash-mark relative aspect-square w-[clamp(11rem,28vw,20rem)]">
        <Image
          src={LOGO}
          alt=""
          fill
          priority
          sizes="320px"
          className="splash-logo-grey object-contain"
        />
        <div className="splash-logo-fill absolute inset-0">
          <Image
            src={LOGO}
            alt=""
            fill
            priority
            sizes="320px"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
