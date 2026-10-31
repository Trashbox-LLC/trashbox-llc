"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const SPLASH_LEAVE_ANIMATION = "splash-leave";

const LOGO = "/images/trashbox-logo-outlined.svg";

type SplashScreenProps = {
  /** Loop the fill and keep the screen up. Used by Storybook. */
  persist?: boolean;
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
export function SplashScreen({ persist = false, onDone }: SplashScreenProps) {
  const [gone, setGone] = useState(false);
  const finished = useRef(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (persist || !prefersReducedMotion()) return;
    finished.current = true;
    onDoneRef.current?.();
    setGone(true);
  }, [persist]);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen || persist) return;

    function onAnimationEnd(event: AnimationEvent): void {
      if (finished.current) return;
      if (event.target !== screen) return;
      if (event.animationName !== SPLASH_LEAVE_ANIMATION) return;
      finished.current = true;
      onDoneRef.current?.();
      setGone(true);
    }

    screen.addEventListener("animationend", onAnimationEnd);
    return () => screen.removeEventListener("animationend", onAnimationEnd);
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
