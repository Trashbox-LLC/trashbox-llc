"use client";

import { useEffect, useRef } from "react";

/** Loops the outline logo while the keyboard plugs into the box. */
export function LogoPlugPreview() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let cancelled = false;
    let destroy = () => {};

    void import("lottie-web").then((module) => {
      if (cancelled || !ref.current) return;
      const animation = module.default.loadAnimation({
        container: ref.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/trashbox-logo-plug.json?v=2",
      });
      destroy = () => animation.destroy();
    });

    return () => {
      cancelled = true;
      destroy();
    };
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div
        ref={ref}
        className="aspect-square w-full max-w-xl"
        role="img"
        aria-label="Trashbox logo plugging into the box"
      />
    </div>
  );
}
