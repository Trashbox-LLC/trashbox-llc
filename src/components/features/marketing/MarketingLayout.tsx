"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SiteFooter } from "@/components/features/marketing/SiteFooter";
import { SiteHeader } from "@/components/features/marketing/SiteHeader";
import { SplashScreen } from "@/components/features/marketing/SplashScreen";
import { ScrollTrigger } from "@/lib/gsap-client";
import {
  holdPageMotion,
  pageMotionHeld,
  prefersReducedMotion,
} from "@/lib/page-motion";
import {
  isPortalWorkspacePath,
  subscribePortalNavigate,
} from "@/lib/portal-routes";
import { isPortalPath, isPlatformPath } from "@/lib/sites";

type MarketingLayoutProps = {
  children: React.ReactNode;
};

function isLogoPreview(path: string | null | undefined): boolean {
  return path?.replace(/\/$/, "") === "/logo-preview";
}

/** Marketing chrome; portal and platform routes use their own headers. */
export function MarketingLayout({ children }: MarketingLayoutProps) {
  const nextPath = usePathname();
  const [pathname, setPathname] = useState(nextPath);
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [motionReleased, setMotionReleased] = useState(false);
  const motionHeld = pageMotionHeld({
    motionReleased,
    portal: isPortalPath(pathname),
    logoPreview: isLogoPreview(pathname),
    reducedMotion: prefersReducedMotion(),
  });
  const wasHeld = useRef(motionHeld);
  // Pause before child layout effects create entrance tweens.
  holdPageMotion(motionHeld);

  useEffect(() => {
    const win = window.location.pathname;
    // Prefer the real browser path for slug workspace deep links (404 bootstrap).
    if (isPortalWorkspacePath(win)) setPathname(win);
    else setPathname(nextPath || win);
    return subscribePortalNavigate(setPathname);
  }, [nextPath]);

  useEffect(() => {
    if (isPortalPath(pathname)) setSplashDismissed(true);
  }, [pathname]);

  useEffect(() => () => holdPageMotion(false), []);

  useLayoutEffect(() => {
    const released = wasHeld.current && !motionHeld;
    wasHeld.current = motionHeld;
    if (released) ScrollTrigger.refresh();
  }, [motionHeld]);

  if (isPortalPath(pathname)) {
    return <div className="flex min-h-dvh flex-col">{children}</div>;
  }

  const shell = isPlatformPath(pathname) ? (
    <div className="flex min-h-dvh flex-col">{children}</div>
  ) : (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );

  return (
    <>
      {splashDismissed || isLogoPreview(pathname) ? null : (
        <SplashScreen
          onReveal={() => setMotionReleased(true)}
          onDone={() => {
            setMotionReleased(true);
            setSplashDismissed(true);
          }}
        />
      )}
      {shell}
    </>
  );
}
