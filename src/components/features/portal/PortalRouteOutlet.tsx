"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PortalWorkspaceApp } from "@/components/features/portal/PortalWorkspaceApp";
import { OrgPicker } from "@/components/features/portal/orgs/OrgPicker";
import { isPortalOrgPickerPath } from "@/lib/portal-org-gate";
import {
  isPortalWorkspacePath,
  subscribePortalNavigate,
} from "@/lib/portal-routes";

/**
 * Soft-route GitHub-style workspace URLs and the org picker inside the portal
 * shell so logo / breadcrumb navigation does not full-reload the app.
 */
export function PortalRouteOutlet({ children }: { children: ReactNode }) {
  const nextPath = usePathname() ?? "";
  const [path, setPath] = useState(nextPath);

  useEffect(() => {
    const win = window.location.pathname;
    if (win.startsWith("/portal/")) setPath(win);
    else setPath(nextPath || win);
    return subscribePortalNavigate(setPath);
  }, [nextPath]);

  if (isPortalOrgPickerPath(path)) {
    return <OrgPicker />;
  }

  if (isPortalWorkspacePath(path)) {
    return <PortalWorkspaceApp pathname={path} />;
  }

  return children;
}
