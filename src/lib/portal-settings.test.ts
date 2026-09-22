import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS_SECTION,
  PORTAL_ORG_SETTINGS_NAV,
  PORTAL_PROJECT_SETTINGS_NAV,
  PORTAL_SETTINGS_NAV,
  getSettingsSection,
  isSettingsSectionId,
  orgSettingsSectionPath,
  resolveOrgSettingsSection,
  settingsSectionPath,
  signatureBuilderEditPath,
  signatureBuilderNewPath,
} from "./portal-settings";
import { PORTAL_PATHS } from "./sites";

describe("portal-settings", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("defines org and project settings groups", () => {
    expect(PORTAL_ORG_SETTINGS_NAV.map((g) => g.id)).toEqual([
      "organization",
      "team",
      "billing",
      "security",
    ]);
    expect(PORTAL_PROJECT_SETTINGS_NAV.map((g) => g.id)).toEqual([
      "workspace",
      "communication",
      "crm",
      "automation",
      "developers",
    ]);
    expect(PORTAL_SETTINGS_NAV).toEqual(PORTAL_PROJECT_SETTINGS_NAV);
  });

  it("keeps team and billing on the org nav only", () => {
    const orgSections = PORTAL_ORG_SETTINGS_NAV.flatMap((g) =>
      g.items.map((i) => i.id),
    );
    const projectSections = PORTAL_PROJECT_SETTINGS_NAV.flatMap((g) =>
      g.items.map((i) => i.id),
    );
    expect(orgSections).toContain("members");
    expect(orgSections).toContain("current-plan");
    expect(orgSections).toContain("usage");
    expect(orgSections).not.toContain("payment-methods");
    expect(orgSections).not.toContain("invoices");
    expect(orgSections).not.toContain("upgrade-cancel");
    expect(projectSections).not.toContain("members");
    expect(projectSections).not.toContain("current-plan");
    expect(projectSections).not.toContain("forms");
    expect(projectSections).toContain("api-keys");
    expect(projectSections).toContain("email-accounts");
  });

  it("redirects retired billing sections to current plan", () => {
    expect(resolveOrgSettingsSection("payment-methods")).toBe("current-plan");
    expect(resolveOrgSettingsSection("invoices")).toBe("current-plan");
    expect(resolveOrgSettingsSection("upgrade-cancel")).toBe("current-plan");
    expect(resolveOrgSettingsSection("usage")).toBe("usage");
  });

  it("builds legacy flat section paths under /portal/settings", () => {
    expect(settingsSectionPath("email-accounts")).toBe(
      "/portal/settings/email-accounts/",
    );
    expect(settingsSectionPath(DEFAULT_SETTINGS_SECTION)).toBe(
      `${PORTAL_PATHS.settings}${DEFAULT_SETTINGS_SECTION}/`,
    );
  });

  it("builds org settings paths from the current org slug", () => {
    window.history.replaceState({}, "", "/portal/acme/settings/general/");
    expect(settingsSectionPath("members", "org")).toBe(
      "/portal/acme/settings/members/",
    );
    expect(orgSettingsSectionPath("acme", "current-plan")).toBe(
      "/portal/acme/settings/current-plan/",
    );
  });

  it("builds project settings paths from the current workspace", () => {
    window.history.replaceState(
      {},
      "",
      "/portal/acme/site/settings/api-keys/",
    );
    expect(settingsSectionPath("email-accounts", "project")).toBe(
      "/portal/acme/site/settings/email-accounts/",
    );
  });

  it("routes exclusive sections to the correct settings home", () => {
    window.history.replaceState(
      {},
      "",
      "/portal/acme/site/settings/api-keys/",
    );
    expect(settingsSectionPath("members")).toBe(
      "/portal/acme/settings/members/",
    );
    window.history.replaceState({}, "", "/portal/acme/settings/members/");
    expect(settingsSectionPath("email-accounts")).toBe("/portal/acme/");
  });

  it("builds signature builder paths inside the current project", () => {
    window.history.replaceState(
      {},
      "",
      "/portal/acme/site/settings/signatures/",
    );
    expect(signatureBuilderNewPath()).toBe(
      "/portal/acme/site/settings/signatures/new/",
    );
    expect(signatureBuilderEditPath("g1")).toBe(
      "/portal/acme/site/settings/signatures/edit/?id=g1",
    );
  });

  it("resolves known sections and rejects unknown ones", () => {
    expect(isSettingsSectionId("general", "org")).toBe(true);
    expect(isSettingsSectionId("api-keys", "org")).toBe(false);
    expect(isSettingsSectionId("api-keys", "project")).toBe(true);
    expect(isSettingsSectionId("not-a-section", "project")).toBe(false);
    expect(getSettingsSection("email-accounts", "project")?.label).toBe(
      "Email Accounts",
    );
    expect(getSettingsSection("members", "org")?.label).toBe("Members");
    expect(getSettingsSection("missing", "project")).toBeUndefined();
  });

  it("lists unique section ids per scope", () => {
    for (const nav of [PORTAL_ORG_SETTINGS_NAV, PORTAL_PROJECT_SETTINGS_NAV]) {
      const sections = nav.flatMap((group) => group.items.map((item) => item.id));
      expect(new Set(sections).size).toBe(sections.length);
    }
  });
});
