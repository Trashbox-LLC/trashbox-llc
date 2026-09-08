import { describe, expect, it } from "vitest";
import {
  portalSignedInAuthRedirect,
  portalSignedOutRedirect,
} from "./portal-redirects";

describe("portalSignedOutRedirect", () => {
  it("keeps users on auth routes", () => {
    expect(portalSignedOutRedirect("/portal/login/")).toBe(null);
    expect(portalSignedOutRedirect("/portal/signup")).toBe(null);
    expect(portalSignedOutRedirect("/portal/confirm/")).toBe(null);
    expect(portalSignedOutRedirect("/portal/forgot-password/")).toBe(null);
    expect(portalSignedOutRedirect("/portal/join/")).toBe(null);
  });

  it("sends product routes to login", () => {
    expect(portalSignedOutRedirect("/portal/")).toBe("/portal/login/");
    expect(portalSignedOutRedirect("/portal/inbox/")).toBe("/portal/login/");
    expect(portalSignedOutRedirect("/portal/settings/")).toBe(
      "/portal/login/",
    );
  });
});

describe("portalSignedInAuthRedirect", () => {
  it("sends signed-in users away from auth routes to the org picker", () => {
    expect(portalSignedInAuthRedirect("/portal/login/")).toBe("/portal/orgs/");
    expect(portalSignedInAuthRedirect("/portal/signup/")).toBe(
      "/portal/orgs/",
    );
  });

  it("leaves product routes alone", () => {
    expect(portalSignedInAuthRedirect("/portal/")).toBe(null);
    expect(portalSignedInAuthRedirect("/portal/inbox/")).toBe(null);
  });
});
