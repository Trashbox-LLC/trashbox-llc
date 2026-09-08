import { describe, expect, it } from "vitest";
import { settingsSectionPath } from "./portal-settings";
import {
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  PLATFORM_PATHS,
  PORTAL_PATHS,
  SERVICE_PATHS,
  isPlatformPath,
  isPortalPath,
} from "./sites";

describe("sites helpers", () => {
  it("exposes platform, portal, and service paths", () => {
    expect(CONTACT_EMAIL).toBe("contact@trashbox.io");
    expect(CONTACT_MAILTO).toBe("mailto:contact@trashbox.io");
    expect(CONTACT_PHONE_DISPLAY).toBe("714-586-1630");
    expect(CONTACT_PHONE_TEL).toBe("tel:+17145861630");
    expect(PLATFORM_PATHS.features).toBe("/platform/features/");
    expect(SERVICE_PATHS.hub).toBe("/services");
    expect(SERVICE_PATHS.websites).toBe("/services/websites");
    expect(SERVICE_PATHS.webApplications).toBe("/services/web-applications");
    expect(SERVICE_PATHS.systems).toBe("/services/systems");
    expect(SERVICE_PATHS.mobileApps).toBe("/services/mobile-apps");
    expect(SERVICE_PATHS.aiIntegration).toBe("/services/ai-integration");
    expect(SERVICE_PATHS.contact).toBe("/services#contact");
    expect(PORTAL_PATHS.orgs).toBe("/portal/orgs/");
    expect(PORTAL_PATHS.account).toBe("/portal/account/");
    expect(PORTAL_PATHS.home).toBe("/portal/");
    expect(PORTAL_PATHS.login).toBe("/portal/login/");
    expect(PORTAL_PATHS.signup).toBe("/portal/signup/");
    expect(PORTAL_PATHS.join).toBe("/portal/join/");
    expect(PORTAL_PATHS.confirm).toBe("/portal/confirm/");
    expect(PORTAL_PATHS.forgotPassword).toBe("/portal/forgot-password/");
    expect(PORTAL_PATHS.inbox).toBe("/portal/inbox/");
    expect(PORTAL_PATHS.apiKey).toBe("/portal/settings/api-keys/");
    expect(PORTAL_PATHS.membership).toBe("/portal/membership/");
    expect(PORTAL_PATHS.team).toBe("/portal/settings/members/");
    expect(PORTAL_PATHS.settings).toBe("/portal/settings/");
    expect(settingsSectionPath("email-accounts")).toBe(
      "/portal/settings/email-accounts/",
    );
  });

  it("detects platform vs portal paths", () => {
    expect(isPlatformPath("/platform/pricing/")).toBe(true);
    expect(isPortalPath("/portal/inbox/")).toBe(true);
    expect(isPortalPath("/platform")).toBe(false);
  });

  it("treats nullish pathnames as non-matching (Storybook/Chromatic)", () => {
    expect(isPlatformPath(null)).toBe(false);
    expect(isPortalPath(null)).toBe(false);
    expect(isPlatformPath(undefined)).toBe(false);
    expect(isPortalPath(undefined)).toBe(false);
  });
});
