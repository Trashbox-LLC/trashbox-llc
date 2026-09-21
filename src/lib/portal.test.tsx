import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/ui/sonner";
import { PortalProvider, usePortal } from "@/lib/portal";

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getAccount: vi.fn().mockResolvedValue({
      linked: true,
      email: "owner@example.com",
      clientName: "Acme",
      tier: "free",
      active: true,
      hasBilling: false,
      hasApiKey: true,
      role: "owner",
    }),
    getMailbox: vi.fn().mockResolvedValue({ connected: false }),
    listOrgs: vi.fn().mockResolvedValue({ orgs: [] }),
    listForms: vi.fn().mockResolvedValue({ forms: [], canManage: false }),
    getTeam: vi.fn().mockResolvedValue({
      clientId: "c1",
      clientName: "Test",
      role: "owner",
      permissions: [],
      roles: [],
      members: [],
      invites: [],
      memberLimit: 1,
      memberCount: 1,
    }),
    listSubmissions: vi.fn().mockResolvedValue({
      clientId: "c1",
      clientName: "Acme",
      items: [],
    }),
    listLeadMessages: vi
      .fn()
      .mockResolvedValue({ submissionId: "", items: [] }),
    getSmsStatus: vi.fn().mockResolvedValue(null),
    acceptTeamInvite: vi.fn(),
  };
});

import {
  getAccount,
  getMailbox,
  getSmsStatus,
  getTeam,
  listForms,
  listLeadMessages,
  listOrgs,
  listSubmissions,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

function PortalReadyProbe() {
  const portal = usePortal();
  return (
    <div>
      <span>{portal.ready ? "orgs-ready" : "orgs-pending"}</span>
      <span>{portal.listBusy ? "inbox-busy" : "inbox-idle"}</span>
      <span>{`org-count:${portal.orgs.length}`}</span>
    </div>
  );
}

describe("PortalProvider notice toasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/portal/");
    vi.mocked(useAuth).mockReturnValue({
      configured: true,
      status: "signedIn",
      email: "owner@example.com",
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      confirmSignUpCode: vi.fn(),
      resendCode: vi.fn(),
      requestPasswordReset: vi.fn(),
      confirmForgotPassword: vi.fn(),
      signOutUser: vi.fn(),
      refresh: vi.fn(),
    } as ReturnType<typeof useAuth>);
  });

  it("toasts when mailbox connects via URL flash", async () => {
    window.history.replaceState({}, "", "/portal/?mailbox=connected");

    render(
      <PortalProvider disableAuthRedirect>
        <div />
      </PortalProvider>,
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Mailbox connected successfully.",
      );
    });
    expect(window.location.search).not.toContain("mailbox=");
  });

  it("toasts billing cancel via URL flash as a message", async () => {
    window.history.replaceState({}, "", "/portal/?billing=cancel");

    render(
      <PortalProvider disableAuthRedirect>
        <div />
      </PortalProvider>,
    );

    await waitFor(() => {
      expect(toast.message).toHaveBeenCalledWith(
        "Checkout canceled. Your plan was not changed.",
      );
    });
  });

  it("toasts billing success via URL flash", async () => {
    window.history.replaceState({}, "", "/portal/?billing=success");

    render(
      <PortalProvider disableAuthRedirect>
        <div />
      </PortalProvider>,
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Billing updated. Plan status refreshes after Stripe confirms payment.",
      );
    });
  });
});

describe("PortalProvider bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/portal/orgs/");
    vi.mocked(useAuth).mockReturnValue({
      configured: true,
      status: "signedIn",
      email: "owner@example.com",
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      confirmSignUpCode: vi.fn(),
      resendCode: vi.fn(),
      requestPasswordReset: vi.fn(),
      confirmForgotPassword: vi.fn(),
      signOutUser: vi.fn(),
      refresh: vi.fn(),
    } as ReturnType<typeof useAuth>);
    vi.mocked(listOrgs).mockResolvedValue({
      orgs: [
        {
          orgId: "o1",
          orgName: "Acme Co",
          orgSlug: "acme-co",
          role: "owner",
          tier: "free",
          active: true,
          hasBilling: false,
          projects: [],
        },
      ],
    });
    vi.mocked(getAccount).mockResolvedValue({
      linked: true,
      email: "owner@example.com",
      clientName: "Acme",
      tier: "free",
      active: true,
      hasBilling: false,
      hasApiKey: true,
      role: "owner",
    });
    vi.mocked(getMailbox).mockResolvedValue({ connected: false });
    vi.mocked(listForms).mockResolvedValue({ forms: [], canManage: false });
    vi.mocked(getTeam).mockResolvedValue({
      clientId: "c1",
      clientName: "Test",
      role: "owner",
      permissions: [],
      roles: [],
      members: [],
      invites: [],
      memberLimit: 1,
      memberCount: 1,
    });
    vi.mocked(getSmsStatus).mockResolvedValue({
      enabled: false,
      availableOnPlan: false,
      canManage: false,
    });
    vi.mocked(listLeadMessages).mockResolvedValue({
      submissionId: "",
      items: [],
    });
    vi.mocked(listSubmissions).mockResolvedValue({
      clientId: "c1",
      clientName: "Acme",
      items: [],
    });
  });

  it("marks orgs ready on the picker without loading inbox or per-lead threads", async () => {
    render(
      <PortalProvider disableAuthRedirect>
        <PortalReadyProbe />
      </PortalProvider>,
    );

    expect(await screen.findByText("orgs-ready")).toBeInTheDocument();
    expect(screen.getByText("org-count:1")).toBeInTheDocument();
    expect(listSubmissions).not.toHaveBeenCalled();
    expect(listLeadMessages).not.toHaveBeenCalled();
    expect(getTeam).not.toHaveBeenCalled();
    expect(getMailbox).not.toHaveBeenCalled();
    expect(listForms).not.toHaveBeenCalled();
  });

  it("loads the inbox after entering a workspace route", async () => {
    window.history.replaceState({}, "", "/portal/acme-co/site/inbox/");

    render(
      <PortalProvider disableAuthRedirect>
        <PortalReadyProbe />
      </PortalProvider>,
    );

    expect(await screen.findByText("orgs-ready")).toBeInTheDocument();
    await waitFor(() => {
      expect(listSubmissions).toHaveBeenCalledTimes(1);
    });
  });
});
