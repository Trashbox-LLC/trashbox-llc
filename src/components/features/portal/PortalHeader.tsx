"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Skeleton } from "@/components/atoms/Skeleton";
import { PortalLink } from "@/components/features/portal/PortalLink";
import { PortalUserMenu } from "@/components/features/portal/PortalUserMenu";
import { WorkspaceBreadcrumb } from "@/components/features/portal/WorkspaceBreadcrumb";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getAccountProfile, teamMemberDisplayName } from "@/lib/api";
import { usePortal } from "@/lib/portal";
import { isPortalProductPath } from "@/lib/portal-org-gate";
import {
  isOrgScopedPortalPath,
  parsePortalWorkspacePath,
  portalWorkspacePath,
  subscribePortalNavigate,
} from "@/lib/portal-routes";
import { getSelectedOrgId, getSelectedProjectId } from "@/lib/portal-selection";
import {
  DEFAULT_SETTINGS_SECTION,
  orgSettingsSectionPath,
} from "@/lib/portal-settings";
import { PORTAL_PATHS } from "@/lib/sites";
import { cn } from "@/lib/utils";

function linkClass(active: boolean) {
  return cn(
    "inline-flex items-center justify-center transition-colors",
    active ? "text-white" : "text-outline hover:text-white",
  );
}

function isPortalNavActive(pathname: string, href: string): boolean {
  const normalizedHref = href.replace(/\/$/, "") || "/";
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(`${normalizedHref}/`)
  );
}

const SCROLL_TOP_THRESHOLD = 12;
const SCROLL_DELTA_THRESHOLD = 8;

/** Standalone chrome for /portal — separate from marketing SiteHeader. */
export function PortalHeader() {
  const nextPath = usePathname() ?? "";
  const [pathname, setPathname] = useState(nextPath);
  const auth = useAuth();
  const portal = usePortal();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [storedOrgId, setStoredOrgId] = useState<string | null>(null);
  const [storedProjectId, setStoredProjectId] = useState<string | null>(null);

  useEffect(() => {
    const win = window.location.pathname;
    if (win.startsWith("/portal/")) setPathname(win);
    else setPathname(nextPath || win);
    return subscribePortalNavigate(setPathname);
  }, [nextPath]);

  useEffect(() => {
    setStoredOrgId(getSelectedOrgId());
    setStoredProjectId(getSelectedProjectId());
  }, [pathname, portal.orgs, portal.account]);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > SCROLL_TOP_THRESHOLD);

      if (y <= SCROLL_TOP_THRESHOLD) {
        setHidden(false);
        lastY = y;
        return;
      }

      const delta = y - lastY;
      if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) return;

      setHidden(delta > 0);
      lastY = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const selectedOrgId = storedOrgId || portal.account?.orgId || null;
  const selectedOrg = portal.orgs.find((org) => org.orgId === selectedOrgId);
  const orgScoped = isOrgScopedPortalPath(pathname);
  const parsedPath = parsePortalWorkspacePath(pathname);
  const selectedProjectId = orgScoped
    ? null
    : (parsedPath?.projectSlug
        ? selectedOrg?.projects.find(
            (p) => p.projectSlug === parsedPath.projectSlug,
          )?.projectId
        : null) ||
      storedProjectId ||
      null;
  const selectedProject =
    selectedOrg?.projects.find((p) => p.projectId === selectedProjectId) ||
    null;

  const workspaceLinks = useMemo(() => {
    if (!selectedOrg?.orgSlug) return [];
    const orgSlug = selectedOrg.orgSlug;
    const projectsHref = portalWorkspacePath({
      orgSlug,
      surface: "orgHome",
    });

    if (orgScoped || !selectedProject?.projectSlug) {
      return [
        { href: projectsHref, label: "Projects", icon: "home" as const },
        {
          href: orgSettingsSectionPath(orgSlug, "members"),
          label: "Members",
          icon: "group" as const,
        },
        {
          href: orgSettingsSectionPath(orgSlug, DEFAULT_SETTINGS_SECTION),
          label: "Settings",
          icon: "settings" as const,
        },
      ];
    }

    const projectSlug = selectedProject.projectSlug;
    return [
      { href: projectsHref, label: "Projects", icon: "home" as const },
      {
        href: portalWorkspacePath({
          orgSlug,
          projectSlug,
          surface: "inbox",
        }),
        label: "Inbox",
        icon: "inbox" as const,
      },
      {
        href: portalWorkspacePath({
          orgSlug,
          projectSlug,
          surface: "contacts",
        }),
        label: "Contacts",
        icon: "contacts" as const,
      },
      {
        href: portalWorkspacePath({
          orgSlug,
          projectSlug,
          surface: "forms",
        }),
        label: "Forms",
        icon: "dynamic_form" as const,
      },
      {
        href: portalWorkspacePath({
          orgSlug,
          projectSlug,
          surface: "settings",
          settingsRest: DEFAULT_SETTINGS_SECTION,
        }),
        label: "Settings",
        icon: "tune" as const,
      },
    ];
  }, [selectedOrg, selectedProject, orgScoped]);

  const signedIn = auth.status === "signedIn";
  const authLoading = auth.status === "loading";
  const headerHidden = hidden && !open;
  const inWorkspace =
    signedIn && Boolean(selectedOrgId) && isPortalProductPath(pathname);
  const signedInLinks = inWorkspace ? workspaceLinks : [];
  const showBreadcrumb = signedIn && !authLoading;
  const [profileName, setProfileName] = useState<string | null>(null);
  const currentMember = auth.email
    ? portal.members.find(
        (member) => member.email.toLowerCase() === auth.email!.toLowerCase(),
      )
    : undefined;
  const membershipName = currentMember
    ? teamMemberDisplayName(currentMember)
    : null;
  const userName = profileName || membershipName;

  useEffect(() => {
    if (!signedIn || !auth.email) {
      setProfileName(null);
      return;
    }
    let cancelled = false;
    void getAccountProfile()
      .then((res) => {
        if (cancelled) return;
        const composed = [res.profile.firstName, res.profile.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        setProfileName(composed || null);
      })
      .catch(() => {
        if (!cancelled) setProfileName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, auth.email, pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-transform duration-300 ease-out",
        headerHidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <div
        className={cn(
          "border-b backdrop-blur-xl transition-colors duration-300",
          scrolled
            ? "bg-background/90 border-white/10"
            : "border-outline-variant/10 bg-background/80",
        )}
      >
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3 px-6 py-2 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
            {signedIn ? (
              <PortalLink
                href={PORTAL_PATHS.orgs}
                className="inline-flex shrink-0 items-center gap-2.5"
                aria-label="Trashbox home"
              >
                <Image
                  src="/images/trashbox-logo-white.png"
                  alt=""
                  width={96}
                  height={24}
                  className="h-5"
                  style={{ width: "auto" }}
                  priority
                />
              </PortalLink>
            ) : (
              <Link
                href="/"
                className="inline-flex shrink-0 items-center gap-2.5"
                aria-label="Trashbox home"
              >
                <Image
                  src="/images/trashbox-logo-white.png"
                  alt=""
                  width={96}
                  height={24}
                  className="h-5"
                  style={{ width: "auto" }}
                  priority
                />
              </Link>
            )}
            {showBreadcrumb ? <WorkspaceBreadcrumb /> : null}
          </div>

          {inWorkspace && (
            <nav
              className="hidden items-center gap-5 md:flex"
              aria-label="Portal"
              aria-busy={authLoading}
            >
              {signedInLinks.map((item) => (
                <PortalLink
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={linkClass(isPortalNavActive(pathname, item.href))}
                >
                  <MaterialIcon name={item.icon} className="text-[1.15rem]!" />
                </PortalLink>
              ))}
            </nav>
          )}

          <div className="flex min-w-26 shrink-0 items-center justify-end gap-2">
            {authLoading ? (
              <Skeleton className="size-8 rounded-full" />
            ) : signedIn && auth.email ? (
              <PortalUserMenu
                email={auth.email}
                name={userName}
                settingsHref={PORTAL_PATHS.account}
                onSignOut={() => auth.signOutUser()}
              />
            ) : (
              <Button asChild size="sm">
                <Link href={PORTAL_PATHS.login}>Login</Link>
              </Button>
            )}
            {signedIn && inWorkspace && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-white md:hidden"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((v) => !v)}
              >
                <MaterialIcon
                  name={open ? "close" : "menu"}
                  className="text-[1.25rem]!"
                />
              </Button>
            )}
          </div>
        </div>
      </div>

      {open && signedIn && inWorkspace && (
        <div className="bg-background/95 fixed inset-0 top-11 z-40 px-6 pt-6 pb-10 md:hidden">
          <div className="flex flex-col gap-6">
            {signedInLinks.map((item) => (
              <PortalLink
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  linkClass(isPortalNavActive(pathname, item.href)),
                  "font-label gap-3 text-[10px] tracking-widest uppercase",
                )}
                onClick={() => setOpen(false)}
              >
                <MaterialIcon name={item.icon} className="text-[1.35rem]!" />
                <span>{item.label}</span>
              </PortalLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
