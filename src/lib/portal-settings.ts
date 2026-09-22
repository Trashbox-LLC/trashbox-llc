import {
  parsePortalWorkspacePath,
  portalWorkspacePath,
} from "@/lib/portal-routes";
import { PORTAL_PATHS } from "@/lib/sites";

export type SettingsScope = "org" | "project";

function currentWorkspaceSlugs(): {
  orgSlug: string;
  projectSlug?: string;
} | null {
  if (typeof window === "undefined") return null;
  const parsed = parsePortalWorkspacePath(window.location.pathname);
  if (parsed?.orgSlug) {
    return { orgSlug: parsed.orgSlug, projectSlug: parsed.projectSlug };
  }
  return null;
}

export type SettingsGroupId =
  | "organization"
  | "workspace"
  | "team"
  | "communication"
  | "crm"
  | "automation"
  | "developers"
  | "billing"
  | "security";

export type SettingsSectionId =
  | "general"
  | "branding"
  | "business-information"
  | "members"
  | "roles-permissions"
  | "activity-log"
  | "email-accounts"
  | "text-messaging"
  | "notifications"
  | "templates"
  | "signatures"
  | "snippets"
  | "sending-preferences"
  | "custom-fields"
  | "tags"
  | "pipelines"
  | "workflows"
  | "webhooks"
  | "api-keys"
  | "api-documentation"
  | "current-plan"
  | "usage"
  | "password"
  | "two-factor"
  | "sessions"
  | "audit-log";

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  icon: string;
}

export interface SettingsNavGroup {
  id: SettingsGroupId;
  label: string;
  icon: string;
  items: SettingsNavItem[];
}

/** Default landing section when visiting settings. */
export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "general";

/** Organization-scoped settings: company identity, team, billing, account security. */
export const PORTAL_ORG_SETTINGS_NAV: SettingsNavGroup[] = [
  {
    id: "organization",
    label: "Organization",
    icon: "corporate_fare",
    items: [
      { id: "general", label: "General", icon: "settings" },
      { id: "branding", label: "Branding", icon: "palette" },
      {
        id: "business-information",
        label: "Business Information",
        icon: "storefront",
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: "group",
    items: [
      { id: "members", label: "Members", icon: "person" },
      {
        id: "roles-permissions",
        label: "Roles & Permissions",
        icon: "admin_panel_settings",
      },
      { id: "activity-log", label: "Activity Log", icon: "history" },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: "credit_card",
    items: [
      { id: "current-plan", label: "Current Plan", icon: "workspace_premium" },
      { id: "usage", label: "Usage", icon: "bar_chart" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: "lock",
    items: [
      { id: "password", label: "Password", icon: "password" },
      {
        id: "two-factor",
        label: "Two-Factor Authentication",
        icon: "phonelink_lock",
      },
      { id: "sessions", label: "Sessions", icon: "devices" },
      { id: "audit-log", label: "Audit Log", icon: "policy" },
    ],
  },
];

/** Project-scoped settings: site/inbox/API configuration. */
export const PORTAL_PROJECT_SETTINGS_NAV: SettingsNavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    icon: "folder",
    items: [
      { id: "general", label: "General", icon: "settings" },
      { id: "branding", label: "Branding", icon: "palette" },
      {
        id: "business-information",
        label: "Business Information",
        icon: "storefront",
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: "mail",
    items: [
      { id: "email-accounts", label: "Email Accounts", icon: "inbox" },
      { id: "text-messaging", label: "Text Messaging", icon: "sms" },
      { id: "notifications", label: "Notifications", icon: "notifications" },
      { id: "templates", label: "Templates", icon: "description" },
      { id: "signatures", label: "Signatures", icon: "draw" },
      { id: "snippets", label: "Snippets", icon: "data_object" },
      {
        id: "sending-preferences",
        label: "Sending Preferences",
        icon: "tune",
      },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: "handshake",
    items: [
      { id: "custom-fields", label: "Custom Fields", icon: "view_column" },
      { id: "tags", label: "Tags", icon: "sell" },
      { id: "pipelines", label: "Pipelines", icon: "view_kanban" },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    icon: "bolt",
    items: [
      { id: "workflows", label: "Workflows", icon: "account_tree" },
      { id: "webhooks", label: "Webhooks", icon: "webhook" },
    ],
  },
  {
    id: "developers",
    label: "Developers",
    icon: "code",
    items: [
      { id: "api-keys", label: "API Keys", icon: "key" },
      {
        id: "api-documentation",
        label: "API Documentation",
        icon: "menu_book",
      },
    ],
  },
];

/** @deprecated Prefer PORTAL_PROJECT_SETTINGS_NAV or PORTAL_ORG_SETTINGS_NAV. */
export const PORTAL_SETTINGS_NAV = PORTAL_PROJECT_SETTINGS_NAV;

function sectionMapFor(nav: SettingsNavGroup[]) {
  return new Map(
    nav.flatMap((group) =>
      group.items.map(
        (item) =>
          [
            item.id,
            { ...item, groupId: group.id, groupLabel: group.label },
          ] as const,
      ),
    ),
  );
}

const ORG_SECTION_BY_ID = sectionMapFor(PORTAL_ORG_SETTINGS_NAV);
const PROJECT_SECTION_BY_ID = sectionMapFor(PORTAL_PROJECT_SETTINGS_NAV);

/** Old billing nav items that now live in Stripe Customer Portal / Current Plan. */
const LEGACY_ORG_BILLING_SECTIONS: Record<string, SettingsSectionId> = {
  "payment-methods": "current-plan",
  invoices: "current-plan",
  "upgrade-cancel": "current-plan",
};

/** Map removed org settings slugs to their replacement section. */
export function resolveOrgSettingsSection(section: string): SettingsSectionId {
  const legacy = LEGACY_ORG_BILLING_SECTIONS[section];
  if (legacy) return legacy;
  return isSettingsSectionId(section, "org")
    ? section
    : DEFAULT_SETTINGS_SECTION;
}

export function settingsNavForScope(scope: SettingsScope): SettingsNavGroup[] {
  return scope === "org" ? PORTAL_ORG_SETTINGS_NAV : PORTAL_PROJECT_SETTINGS_NAV;
}

export function isSettingsSectionId(
  value: string,
  scope: SettingsScope = "project",
): value is SettingsSectionId {
  const map = scope === "org" ? ORG_SECTION_BY_ID : PROJECT_SECTION_BY_ID;
  return map.has(value as SettingsSectionId);
}

export function getSettingsSection(id: string, scope: SettingsScope = "project") {
  const map = scope === "org" ? ORG_SECTION_BY_ID : PROJECT_SECTION_BY_ID;
  return map.get(id as SettingsSectionId);
}

/** Infer settings scope from a portal pathname. */
export function settingsScopeFromPath(
  pathname: string | null | undefined,
): SettingsScope {
  const parsed = parsePortalWorkspacePath(pathname);
  if (parsed?.surface === "orgSettings") return "org";
  return "project";
}

function resolveSettingsScope(
  section: SettingsSectionId,
  scope?: SettingsScope,
): SettingsScope {
  if (scope) return scope;
  const inOrg = ORG_SECTION_BY_ID.has(section);
  const inProject = PROJECT_SECTION_BY_ID.has(section);
  // Sections that exist in only one nav always target that scope.
  if (inOrg && !inProject) return "org";
  if (inProject && !inOrg) return "project";
  if (typeof window !== "undefined") {
    return settingsScopeFromPath(window.location.pathname);
  }
  return "project";
}

export function settingsSectionPath(
  section: SettingsSectionId,
  scope?: SettingsScope,
): string {
  const ws = currentWorkspaceSlugs();
  const resolvedScope = resolveSettingsScope(section, scope);

  if (ws?.orgSlug && resolvedScope === "org") {
    return portalWorkspacePath({
      orgSlug: ws.orgSlug,
      surface: "orgSettings",
      settingsRest: section,
    });
  }

  if (ws?.orgSlug && ws.projectSlug && resolvedScope === "project") {
    return portalWorkspacePath({
      orgSlug: ws.orgSlug,
      projectSlug: ws.projectSlug,
      surface: "settings",
      settingsRest: section,
    });
  }

  // Project section while on org settings (no project in URL): stay under org
  // home so the user can open a project — avoid inventing a bad settings URL.
  if (ws?.orgSlug && resolvedScope === "project" && !ws.projectSlug) {
    return portalWorkspacePath({
      orgSlug: ws.orgSlug,
      surface: "orgHome",
    });
  }

  return `${PORTAL_PATHS.settings}${section}/`;
}

export function orgSettingsSectionPath(
  orgSlug: string,
  section: SettingsSectionId = DEFAULT_SETTINGS_SECTION,
): string {
  return portalWorkspacePath({
    orgSlug,
    surface: "orgSettings",
    settingsRest: section,
  });
}

/** Gallery / starter picker before opening the full-page builder. */
export function templateBuilderNewPath(): string {
  const ws = currentWorkspaceSlugs();
  if (ws?.orgSlug && ws.projectSlug) {
    return portalWorkspacePath({
      orgSlug: ws.orgSlug,
      projectSlug: ws.projectSlug,
      surface: "settings",
      settingsRest: "templates/new",
    });
  }
  return `${PORTAL_PATHS.settings}templates/new/`;
}

/** Full-page create builder. Pass a catalog starter id, or `draft=1` after HTML paste. */
export function templateBuilderCreatePath(options?: {
  starterId?: string;
  draft?: boolean;
}): string {
  const ws = currentWorkspaceSlugs();
  const base =
    ws?.orgSlug && ws.projectSlug
      ? portalWorkspacePath({
          orgSlug: ws.orgSlug,
          projectSlug: ws.projectSlug,
          surface: "settings",
          settingsRest: "templates/builder",
        })
      : `${PORTAL_PATHS.settings}templates/builder/`;
  const params = new URLSearchParams();
  if (options?.starterId) params.set("starter", options.starterId);
  if (options?.draft) params.set("draft", "1");
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function signatureBuilderNewPath(): string {
  const ws = currentWorkspaceSlugs();
  if (ws?.orgSlug && ws.projectSlug) {
    return portalWorkspacePath({
      orgSlug: ws.orgSlug,
      projectSlug: ws.projectSlug,
      surface: "settings",
      settingsRest: "signatures/new",
    });
  }
  return `${PORTAL_PATHS.settings}signatures/new/`;
}

export function snippetBuilderNewPath(): string {
  const ws = currentWorkspaceSlugs();
  if (ws?.orgSlug && ws.projectSlug) {
    return portalWorkspacePath({
      orgSlug: ws.orgSlug,
      projectSlug: ws.projectSlug,
      surface: "settings",
      settingsRest: "snippets/new",
    });
  }
  return `${PORTAL_PATHS.settings}snippets/new/`;
}

export function snippetBuilderEditPath(id: string): string {
  const ws = currentWorkspaceSlugs();
  const base =
    ws?.orgSlug && ws.projectSlug
      ? portalWorkspacePath({
          orgSlug: ws.orgSlug,
          projectSlug: ws.projectSlug,
          surface: "settings",
          settingsRest: "snippets/edit",
        })
      : `${PORTAL_PATHS.settings}snippets/edit/`;
  return `${base}?id=${encodeURIComponent(id)}`;
}

/** Snippet builder keeps the settings sidebar and the group label. */
export function isSnippetBuilderPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/$/, "");
  return (
    normalized.endsWith("/snippets/new") ||
    normalized.endsWith("/snippets/edit")
  );
}

export function signatureBuilderEditPath(id: string): string {
  const ws = currentWorkspaceSlugs();
  const base =
    ws?.orgSlug && ws.projectSlug
      ? portalWorkspacePath({
          orgSlug: ws.orgSlug,
          projectSlug: ws.projectSlug,
          surface: "settings",
          settingsRest: "signatures/edit",
        })
      : `${PORTAL_PATHS.settings}signatures/edit/`;
  return `${base}?id=${encodeURIComponent(id)}`;
}

export function templateBuilderEditPath(id: string): string {
  const ws = currentWorkspaceSlugs();
  const base =
    ws?.orgSlug && ws.projectSlug
      ? portalWorkspacePath({
          orgSlug: ws.orgSlug,
          projectSlug: ws.projectSlug,
          surface: "settings",
          settingsRest: "templates/edit",
        })
      : `${PORTAL_PATHS.settings}templates/edit/`;
  return `${base}?id=${encodeURIComponent(id)}`;
}

/** Signature builder keeps the settings sidebar; only the section title is replaced. */
export function isSignatureBuilderPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/$/, "");
  return (
    normalized.endsWith("/signatures/new") ||
    normalized.endsWith("/signatures/edit")
  );
}

/** True when Settings chrome should hide for a Zoho-style full-page builder. */
export function isTemplateBuilderImmersivePath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/$/, "");
  return (
    normalized.endsWith("/templates/builder") ||
    normalized.endsWith("/templates/edit") ||
    normalized.endsWith("/templates/new")
  );
}

export const TEMPLATE_BUILDER_DRAFT_STORAGE_KEY =
  "trashbox.emailTemplateBuilderDraft";

export interface TemplateBuilderDraftPayload {
  name: string;
  subject: string;
  document: unknown;
}

export function settingsGroupForSection(
  section: SettingsSectionId,
  scope: SettingsScope = "project",
) {
  return settingsNavForScope(scope).find((group) =>
    group.items.some((item) => item.id === section),
  );
}
