import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingSignupPassword,
  emailFromSearchString,
  getPendingSignupPassword,
  isPortalAuthPath,
  isUsernameExistsError,
  pendingConfirmPath,
  portalJoinPath,
  portalLoginPath,
  portalSignupPath,
  setPendingSignupPassword,
} from "./portal-auth";

describe("isPortalAuthPath", () => {
  it("recognizes login, signup, confirm, and forgot-password", () => {
    expect(isPortalAuthPath("/portal/login")).toBe(true);
    expect(isPortalAuthPath("/portal/login/")).toBe(true);
    expect(isPortalAuthPath("/portal/signup/")).toBe(true);
    expect(isPortalAuthPath("/portal/confirm")).toBe(true);
    expect(isPortalAuthPath("/portal/forgot-password/")).toBe(true);
    expect(isPortalAuthPath("/portal/join/")).toBe(true);
  });

  it("rejects product routes and nullish values", () => {
    expect(isPortalAuthPath("/portal/")).toBe(false);
    expect(isPortalAuthPath("/portal/inbox/")).toBe(false);
    expect(isPortalAuthPath("/portal/settings/")).toBe(false);
    expect(isPortalAuthPath(null)).toBe(false);
    expect(isPortalAuthPath(undefined)).toBe(false);
  });
});

describe("pendingConfirmPath", () => {
  it("builds confirm URL with email query", () => {
    expect(pendingConfirmPath("Owner@Example.com")).toBe(
      "/portal/confirm/?email=owner%40example.com",
    );
  });
});

describe("emailFromSearchString", () => {
  it("reads a trimmed email query", () => {
    expect(emailFromSearchString("?email=Owner%40Example.com")).toBe(
      "Owner@Example.com",
    );
    expect(emailFromSearchString("")).toBe("");
  });
});

describe("portal auth paths with email", () => {
  it("appends email when present", () => {
    expect(portalSignupPath("Owner@Example.com")).toBe(
      "/portal/signup/?email=Owner%40Example.com",
    );
    expect(portalLoginPath("a@b.com")).toBe(
      "/portal/login/?email=a%40b.com",
    );
    expect(portalJoinPath("Owner@Example.com")).toBe(
      "/portal/join/?email=Owner%40Example.com",
    );
  });

  it("returns the bare path without an email", () => {
    expect(portalSignupPath()).toBe("/portal/signup/");
    expect(portalLoginPath("  ")).toBe("/portal/login/");
    expect(portalJoinPath()).toBe("/portal/join/");
  });
});

describe("isUsernameExistsError", () => {
  it("detects Cognito username-exists failures", () => {
    expect(
      isUsernameExistsError(Object.assign(new Error("User already exists"), {
        name: "UsernameExistsException",
      })),
    ).toBe(true);
    expect(isUsernameExistsError(new Error("User already exists"))).toBe(true);
    expect(isUsernameExistsError(new Error("Invalid password"))).toBe(false);
  });
});

describe("pending signup password storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores and clears password for post-confirm auto sign-in", () => {
    setPendingSignupPassword("Owner@Example.com", "secret-pass");
    expect(getPendingSignupPassword("owner@example.com")).toBe("secret-pass");
    expect(getPendingSignupPassword("other@example.com")).toBe(null);
    clearPendingSignupPassword();
    expect(getPendingSignupPassword("owner@example.com")).toBe(null);
  });
});
