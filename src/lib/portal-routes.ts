import { PORTAL_BASE, PORTAL_PATHS } from "@/lib/sites";

/**
 * First path segment after `/portal/` reserved for auth, org picker, and
 * legacy flat product routes (so they are never treated as org slugs).
 */
export const RESERVED_ORG_SLUGS = new Set([
  "login",
  "signup",
  "confirm",
  "forgot-password",
  "orgs",
  "account",
  "inbox",
  "membership",
  "settings",
  "team",
  "api-key",
]);

export type PortalWorkspaceSurface =
  | "orgHome"
  | "orgSettings"
  | "projectHome"
  | "inbox"
  | "contacts"
  | "forms"
  | "settings"
  | "membership";

export type ParsedPortalWorkspacePath = {
  orgSlug: string;
  projectSlug?: string;
  surface: PortalWorkspaceSurface;
  /** Path under settings/ without leading/trailing slashes (e.g. `api-keys`). */
  settingsRest?: string;
  /** Present on a contact detail path (`contacts/{contactId}`). */
  contactId?: string;
};

const PORTAL_NAVIGATE_EVENT = "portal:navigate";

export function slugifyPortalSegment(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "item";
}

function normalizePathname(pathname: string): string {
  // Callers sometimes pass full hrefs from portalNavigate (`path?query`).
  const withoutQuery = pathname.trim().split(/[?#]/)[0] || "/";
  if (!withoutQuery || withoutQuery === "/") return "/";
  return withoutQuery.replace(/\/+$/, "") || "/";
}

function splitPortalSegments(pathname: string): string[] {
  const normalized = normalizePathname(pathname);
  const parts = normalized.split("/").filter(Boolean);
  if (parts[0] !== "portal") return [];
  return parts.slice(1);
}

export function isReservedOrgSlug(slug: string): boolean {
  return RESERVED_ORG_SLUGS.has(slug);
}

/** Parse GitHub-style workspace paths under `/portal/{org}/{project?}/…`. */
/** Org home / org settings — no project in chrome. */
export function isOrgScopedPortalPath(
  pathname: string | null | undefined,
): boolean {
  const surface = parsePortalWorkspacePath(pathname)?.surface;
  return surface === "orgHome" || surface === "orgSettings";
}

export function parsePortalWorkspacePath(
  pathname: string | null | undefined,
): ParsedPortalWorkspacePath | null {
  if (!pathname) return null;
  const segments = splitPortalSegments(pathname);
  if (segments.length === 0) return null;

  const [orgSlug, projectSlug, surfaceSeg, ...rest] = segments;
  if (!orgSlug || isReservedOrgSlug(orgSlug)) return null;

  if (!projectSlug) {
    return { orgSlug, surface: "orgHome" };
  }

  // `/portal/{org}/settings/…` — organization settings (no project).
  if (projectSlug === "settings") {
    const settingsRest = [surfaceSeg, ...rest].filter(Boolean).join("/");
    return {
      orgSlug,
      surface: "orgSettings",
      settingsRest,
    };
  }

  if (!surfaceSeg) {
    return { orgSlug, projectSlug, surface: "projectHome" };
  }

  if (surfaceSeg === "inbox" && rest.length === 0) {
    return { orgSlug, projectSlug, surface: "inbox" };
  }
  if (surfaceSeg === "forms" && rest.length === 0) {
    return { orgSlug, projectSlug, surface: "forms" };
  }
  if (surfaceSeg === "contacts" && rest.length <= 1) {
    const contactId = rest[0];
    return {
      orgSlug,
      projectSlug,
      surface: "contacts",
      ...(contactId ? { contactId } : {}),
    };
  }
  if (surfaceSeg === "membership" && rest.length === 0) {
    return { orgSlug, projectSlug, surface: "membership" };
  }
  if (surfaceSeg === "settings") {
    return {
      orgSlug,
      projectSlug,
      surface: "settings",
      settingsRest: rest.join("/"),
    };
  }

  return null;
}

export function portalWorkspacePath(input: {
  orgSlug: string;
  projectSlug?: string;
  surface: PortalWorkspaceSurface;
  settingsRest?: string;
  contactId?: string;
}): string {
  const org = encodeURIComponent(input.orgSlug);
  const base = `${PORTAL_BASE}/${org}`;
  if (input.surface === "orgHome") {
    return `${base}/`;
  }
  if (input.surface === "orgSettings") {
    const rest = (input.settingsRest || "").replace(/^\/+|\/+$/g, "");
    return rest ? `${base}/settings/${rest}/` : `${base}/settings/`;
  }
  if (!input.projectSlug) {
    return `${base}/`;
  }
  const project = encodeURIComponent(input.projectSlug);
  const projectBase = `${base}/${project}`;
  switch (input.surface) {
    case "projectHome":
      return `${projectBase}/`;
    case "inbox":
      return `${projectBase}/inbox/`;
    case "forms":
      return `${projectBase}/forms/`;
    case "contacts":
      return input.contactId
        ? `${projectBase}/contacts/${encodeURIComponent(input.contactId)}/`
        : `${projectBase}/contacts/`;
    case "membership":
      return `${projectBase}/membership/`;
    case "settings": {
      const rest = (input.settingsRest || "").replace(/^\/+|\/+$/g, "");
      return rest
        ? `${projectBase}/settings/${rest}/`
        : `${projectBase}/settings/`;
    }
    default:
      return `${projectBase}/`;
  }
}

/** True when pathname is a slug-scoped product workspace path. */
export function isPortalWorkspacePath(
  pathname: string | null | undefined,
): boolean {
  return parsePortalWorkspacePath(pathname) !== null;
}

/**
 * Legacy flat product paths that should redirect into slug URLs
 * (or the org picker when no workspace is selected).
 */
export function isLegacyPortalProductPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const path = normalizePathname(pathname);
  const home = normalizePathname(PORTAL_PATHS.home);
  const inbox = normalizePathname(PORTAL_PATHS.inbox);
  const membership = normalizePathname(PORTAL_PATHS.membership);
  const settings = normalizePathname(PORTAL_PATHS.settings);
  return (
    path === home ||
    path === inbox ||
    path === membership ||
    path === settings ||
    path.startsWith(`${settings}/`)
  );
}

export function portalNavigate(
  path: string,
  options?: { replace?: boolean },
): void {
  if (typeof window === "undefined") return;
  const next = path.startsWith("/") ? path : `/${path}`;
  const method = options?.replace ? "replaceState" : "pushState";
  window.history[method](null, "", next);
  window.dispatchEvent(
    new CustomEvent(PORTAL_NAVIGATE_EVENT, { detail: { path: next } }),
  );
}

export function subscribePortalNavigate(
  listener: (path: string) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  // Always report pathname only — query strings break workspace path parsing.
  const handler = () => {
    listener(window.location.pathname);
  };
  window.addEventListener(PORTAL_NAVIGATE_EVENT, handler);
  window.addEventListener("popstate", handler);
  return () => {
    window.removeEventListener(PORTAL_NAVIGATE_EVENT, handler);
    window.removeEventListener("popstate", handler);
  };
}
