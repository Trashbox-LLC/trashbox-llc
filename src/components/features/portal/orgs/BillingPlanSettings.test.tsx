import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StubAuthProvider } from "@/lib/auth";
import { StubPortalProvider } from "@/lib/portal";
import { BillingPlanSettings } from "./BillingPlanSettings";

const org = {
  orgId: "o1",
  orgName: "Acme Co",
  orgSlug: "acme-co",
  role: "owner" as const,
  tier: "team" as const,
  active: true,
  hasBilling: true,
  projects: [
    {
      projectId: "p1",
      projectName: "Marketing",
      projectSlug: "marketing",
    },
  ],
};

describe("BillingPlanSettings", () => {
  it("shows submission and seat progress bars", () => {
    render(
      <StubAuthProvider
        value={{
          status: "signedIn",
          configured: true,
          email: "owner@example.com",
        }}
      >
        <StubPortalProvider
          value={{
            ready: true,
            account: {
              linked: true,
              email: "owner@example.com",
              orgId: "o1",
              tier: "team",
              hasBilling: true,
              role: "owner",
              submissionsUsed: 120,
              submissionLimit: 5000,
              memberCount: 2,
              memberLimit: 5,
            },
            billingBusy: false,
            onUpgrade: async () => undefined,
            onManageBilling: async () => undefined,
          }}
        >
          <BillingPlanSettings org={org} />
        </StubPortalProvider>
      </StubAuthProvider>,
    );

    expect(
      screen.getByRole("progressbar", { name: /monthly form submissions/i }),
    ).toHaveAttribute("aria-valuenow", "120");
    expect(
      screen.getByRole("progressbar", { name: /team member seats/i }),
    ).toHaveAttribute("aria-valuenow", "2");
    expect(
      screen.getByRole("progressbar", { name: /team member seats/i }),
    ).toHaveAttribute("aria-valuemax", "5");
  });

  it("shows agency-granted Solo without Stripe checkout", () => {
    render(
      <StubAuthProvider
        value={{
          status: "signedIn",
          configured: true,
          email: "owner@example.com",
        }}
      >
        <StubPortalProvider
          value={{
            ready: true,
            account: {
              linked: true,
              email: "owner@example.com",
              orgId: "o1",
              tier: "solo",
              hasBilling: false,
              role: "owner",
              submissionsUsed: 3,
              submissionLimit: 500,
              memberCount: 1,
              memberLimit: 1,
            },
            billingBusy: false,
            onUpgrade: async () => undefined,
            onManageBilling: async () => undefined,
          }}
        >
          <BillingPlanSettings
            org={{ ...org, tier: "solo", hasBilling: false }}
          />
        </StubPortalProvider>
      </StubAuthProvider>,
    );

    expect(
      screen.getAllByRole("heading", { name: /^Solo$/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /add solo plan/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /manage billing/i }),
    ).not.toBeInTheDocument();
  });
});
