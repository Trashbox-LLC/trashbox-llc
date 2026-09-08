import { PORTAL_PATHS } from "@/lib/sites";

const PENDING_SIGNUP_KEY = "portalPendingSignup";

interface PendingSignup {
  email: string;
  password: string;
}

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, "") || "/";
  return trimmed;
}

/** Public Cognito auth routes (no session required). */
export function isPortalAuthPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const path = normalizePath(pathname);
  return (
    path === normalizePath(PORTAL_PATHS.login) ||
    path === normalizePath(PORTAL_PATHS.signup) ||
    path === normalizePath(PORTAL_PATHS.confirm) ||
    path === normalizePath(PORTAL_PATHS.forgotPassword) ||
    path === normalizePath(PORTAL_PATHS.join)
  );
}

export function pendingConfirmPath(email: string): string {
  const normalized = email.trim().toLowerCase();
  return `${PORTAL_PATHS.confirm}?email=${encodeURIComponent(normalized)}`;
}

/** Read `email` from a location search string (`?email=` or raw query). */
export function emailFromSearchString(search: string): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).get("email")?.trim() ?? "";
}

function pathWithEmail(path: string, email?: string): string {
  const trimmed = email?.trim();
  if (!trimmed) return path;
  return `${path}?email=${encodeURIComponent(trimmed)}`;
}

export function portalSignupPath(email?: string): string {
  return pathWithEmail(PORTAL_PATHS.signup, email);
}

export function portalLoginPath(email?: string): string {
  return pathWithEmail(PORTAL_PATHS.login, email);
}

export function portalJoinPath(email?: string): string {
  return pathWithEmail(PORTAL_PATHS.join, email);
}

export function isUsernameExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message = error instanceof Error ? error.message : "";
  return (
    name === "UsernameExistsException" || /user already exists/i.test(message)
  );
}

export function setPendingSignupPassword(
  email: string,
  password: string,
): void {
  const payload: PendingSignup = {
    email: email.trim().toLowerCase(),
    password,
  };
  sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload));
}

export function getPendingSignupPassword(email: string): string | null {
  try {
    const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    if (parsed.email !== email.trim().toLowerCase()) return null;
    return typeof parsed.password === "string" ? parsed.password : null;
  } catch {
    return null;
  }
}

export function clearPendingSignupPassword(): void {
  sessionStorage.removeItem(PENDING_SIGNUP_KEY);
}
