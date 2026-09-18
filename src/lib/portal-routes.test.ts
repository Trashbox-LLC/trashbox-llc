import { describe, expect, it } from "vitest";
import {
  RESERVED_ORG_SLUGS,
  parsePortalWorkspacePath,
  portalWorkspacePath,
  slugifyPortalSegment,
} from "./portal-routes";

describe("slugifyPortalSegment", () => {
  it("hyphenates names", () => {
    expect(slugifyPortalSegment("Digital GateKeepers")).toBe(
      "digital-gatekeepers",
    );
  });
});

describe("parsePortalWorkspacePath", () => {
  it("returns null for auth and org picker", () => {
    expect(parsePortalWorkspacePath("/portal/login/")).toBeNull();
    expect(parsePortalWorkspacePath("/portal/orgs/")).toBeNull();
    for (const reserved of RESERVED_ORG_SLUGS) {
      expect(parsePortalWorkspacePath(`/portal/${reserved}/`)).toBeNull();
    }
  });

  it("parses org home", () => {
    expect(parsePortalWorkspacePath("/portal/acme/")).toEqual({
      orgSlug: "acme",
      surface: "orgHome",
    });
  });

  it("parses org settings without a project", () => {
    expect(parsePortalWorkspacePath("/portal/acme/settings/")).toEqual({
      orgSlug: "acme",
      surface: "orgSettings",
      settingsRest: "",
    });
    expect(parsePortalWorkspacePath("/portal/acme/settings/general/")).toEqual({
      orgSlug: "acme",
      surface: "orgSettings",
      settingsRest: "general",
    });
  });

  it("parses project home and surfaces", () => {
    expect(parsePortalWorkspacePath("/portal/acme/site/")).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "projectHome",
    });
    expect(parsePortalWorkspacePath("/portal/acme/site/inbox/")).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "inbox",
    });
    expect(
      parsePortalWorkspacePath(
        "/portal/acme/site/inbox/?formId=3d7d2cddb3d65a370cee976eb94f951f",
      ),
    ).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "inbox",
    });
    expect(parsePortalWorkspacePath("/portal/acme/site/forms/")).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "forms",
    });
    expect(parsePortalWorkspacePath("/portal/acme/site/membership/")).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "membership",
    });
    expect(parsePortalWorkspacePath("/portal/acme/site/contacts/")).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "contacts",
    });
    expect(parsePortalWorkspacePath("/portal/acme/site/contacts/abc123/")).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "contacts",
      contactId: "abc123",
    });
    expect(parsePortalWorkspacePath("/portal/acme/site/settings/")).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "settings",
      settingsRest: "",
    });
    expect(
      parsePortalWorkspacePath("/portal/acme/site/settings/api-keys/"),
    ).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "settings",
      settingsRest: "api-keys",
    });
    expect(
      parsePortalWorkspacePath("/portal/acme/site/settings/templates/edit/"),
    ).toEqual({
      orgSlug: "acme",
      projectSlug: "site",
      surface: "settings",
      settingsRest: "templates/edit",
    });
  });

  it("returns null for bare /portal/", () => {
    expect(parsePortalWorkspacePath("/portal/")).toBeNull();
    expect(parsePortalWorkspacePath("/portal")).toBeNull();
  });
});

describe("portalWorkspacePath", () => {
  it("builds org and project paths", () => {
    expect(portalWorkspacePath({ orgSlug: "acme", surface: "orgHome" })).toBe(
      "/portal/acme/",
    );
    expect(
      portalWorkspacePath({
        orgSlug: "acme",
        projectSlug: "site",
        surface: "projectHome",
      }),
    ).toBe("/portal/acme/site/");
    expect(
      portalWorkspacePath({
        orgSlug: "acme",
        projectSlug: "site",
        surface: "inbox",
      }),
    ).toBe("/portal/acme/site/inbox/");
    expect(
      portalWorkspacePath({
        orgSlug: "acme",
        projectSlug: "site",
        surface: "forms",
      }),
    ).toBe("/portal/acme/site/forms/");
    expect(
      portalWorkspacePath({
        orgSlug: "acme",
        projectSlug: "site",
        surface: "contacts",
      }),
    ).toBe("/portal/acme/site/contacts/");
    expect(
      portalWorkspacePath({
        orgSlug: "acme",
        projectSlug: "site",
        surface: "contacts",
        contactId: "abc123",
      }),
    ).toBe("/portal/acme/site/contacts/abc123/");
    expect(
      portalWorkspacePath({
        orgSlug: "acme",
        projectSlug: "site",
        surface: "settings",
        settingsRest: "api-keys",
      }),
    ).toBe("/portal/acme/site/settings/api-keys/");
    expect(
      portalWorkspacePath({
        orgSlug: "acme",
        surface: "orgSettings",
      }),
    ).toBe("/portal/acme/settings/");
    expect(
      portalWorkspacePath({
        orgSlug: "acme",
        surface: "orgSettings",
        settingsRest: "general",
      }),
    ).toBe("/portal/acme/settings/general/");
  });
});
