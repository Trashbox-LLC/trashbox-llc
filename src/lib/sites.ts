/** Marketing Platform + signed-in Portal path helpers. */

export const API_DOCS_URL = "https://api.trashbox.io/docs";

/** Production base URL for the Form API (matches the OpenAPI `servers` entry). */
export const API_BASE_URL = "https://api.trashbox.io";

export const CONTACT_EMAIL = "contact@trashbox.io";
export const CONTACT_PHONE_DISPLAY = "714-586-1630";
export const CONTACT_PHONE_TEL = "tel:+17145861630";
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

export const PLATFORM_BASE = "/platform";
export const PORTAL_BASE = "/portal";
export const SERVICES_BASE = "/services";

export const PLATFORM_PATHS = {
  hub: "/platform/",
  features: "/platform/features/",
  pricing: "/platform/pricing/",
  api: "/platform/api/",
  documentation: "/platform/documentation/",
} as const;

export const SERVICE_PATHS = {
  hub: "/services",
  websites: "/services/websites",
  webApplications: "/services/web-applications",
  systems: "/services/systems",
  mobileApps: "/services/mobile-apps",
  aiIntegration: "/services/ai-integration",
  contact: "/services#contact",
} as const;

export const PORTAL_PATHS = {
  root: "/portal/",
  /** Org picker — select or create an organization before product surfaces. */
  orgs: "/portal/orgs/",
  /** Personal account settings (global profile, leave/transfer, delete). */
  account: "/portal/account/",
  /** Workspace home for the selected organization (projects). */
  home: "/portal/",
  login: "/portal/login/",
  signup: "/portal/signup/",
  join: "/portal/join/",
  confirm: "/portal/confirm/",
  forgotPassword: "/portal/forgot-password/",
  inbox: "/portal/inbox/",
  apiKey: "/portal/settings/api-keys/",
  membership: "/portal/membership/",
  team: "/portal/settings/members/",
  settings: "/portal/settings/",
} as const;

export function isPlatformPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === PLATFORM_BASE || pathname.startsWith(`${PLATFORM_BASE}/`);
}

export function isPortalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === PORTAL_BASE || pathname.startsWith(`${PORTAL_BASE}/`);
}
