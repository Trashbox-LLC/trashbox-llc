"use client";

import { useEffect, useState } from "react";
import { NotFoundContent } from "@/components/features/marketing/NotFoundContent";
import { PortalHeader } from "@/components/features/portal/PortalHeader";
import { PortalSkeleton } from "@/components/features/portal/PortalSkeleton";
import { PortalWorkspaceApp } from "@/components/features/portal/PortalWorkspaceApp";
import { PortalProvider } from "@/lib/portal";
import {
  isPortalWorkspacePath,
  subscribePortalNavigate,
} from "@/lib/portal-routes";

/**
 * Static hosting serves 404.html for unknown slug paths. When the location is a
 * portal workspace URL, bootstrap the same SPA shell as /portal/*.
 */
export function PortalDeepLinkOrNotFound() {
  const [mode, setMode] = useState<"loading" | "workspace" | "missing">(
    "loading",
  );
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    function sync(path: string) {
      const next = path || window.location.pathname;
      setPathname(next);
      setMode(isPortalWorkspacePath(next) ? "workspace" : "missing");
    }
    sync(window.location.pathname);
    return subscribePortalNavigate(sync);
  }, []);

  if (mode === "loading") {
    return (
      <div className="mx-auto w-full max-w-screen-2xl flex-1 px-8 pt-16 pb-24">
        <PortalSkeleton />
      </div>
    );
  }

  if (mode === "missing") {
    return <NotFoundContent />;
  }

  return (
    <PortalProvider>
      <PortalHeader />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-8 pt-16 pb-24">
        <PortalWorkspaceApp pathname={pathname} />
      </main>
    </PortalProvider>
  );
}
