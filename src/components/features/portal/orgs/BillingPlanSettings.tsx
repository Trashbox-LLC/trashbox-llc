"use client";

import { EmailPlanTiers } from "@/components/features/email/EmailPlanTiers";
import { PlanComparisonTable } from "@/components/features/email/PlanComparisonTable";
import { PortalLink } from "@/components/features/portal/PortalLink";
import { SeatUsageMeter } from "@/components/features/portal/orgs/SeatUsageMeter";
import { SubmissionUsageMeter } from "@/components/features/portal/orgs/SubmissionUsageMeter";
import { Button } from "@/components/ui/button";
import type { OrgSummary } from "@/lib/api";
import {
  displayPlanTier,
  planDisplayName,
  seatsForPlanTier,
  showManageBilling,
  showStripeCheckout,
  showUpgradeToTeam,
  type PlanTier,
} from "@/lib/form-plans";
import { usePortal } from "@/lib/portal";
import { portalWorkspacePath } from "@/lib/portal-routes";

interface BillingPlanSettingsProps {
  org: OrgSummary;
  /** When true, show upgrade / manage actions. */
  showActions?: boolean;
}

function tierLabel(tier: PlanTier): string {
  return planDisplayName(tier);
}

/** Organization billing: current plan summary and Stripe checkout/portal actions. */
export function BillingPlanSettings({
  org,
  showActions = true,
}: BillingPlanSettingsProps) {
  const portal = usePortal();
  const isOwner = org.role === "owner";
  const hasProjects = org.projects.length > 0;
  const tier = displayPlanTier(
    portal.account?.orgId === org.orgId
      ? (portal.account.tier ?? org.tier)
      : org.tier,
  );
  const hasBilling =
    portal.account?.orgId === org.orgId
      ? (portal.account.hasBilling ?? org.hasBilling)
      : org.hasBilling;
  const submissionsUsed = portal.account?.submissionsUsed;
  const submissionLimit = portal.account?.submissionLimit;
  const effectiveTier: PlanTier = tier;
  const offerCheckout = showStripeCheckout(tier, hasBilling);
  const offerManage = showManageBilling(hasBilling);
  const offerTeamUpgrade = showUpgradeToTeam(tier, hasBilling);
  const memberCount = portal.account?.memberCount ?? 1;
  const memberLimit = Math.max(
    portal.account?.memberLimit ?? 0,
    seatsForPlanTier(effectiveTier),
  );

  if (!isOwner) {
    return (
      <p className="text-on-surface-variant">
        Only the organization owner can manage billing.
      </p>
    );
  }

  if (!hasProjects) {
    return (
      <div className="space-y-4">
        <p className="text-on-surface-variant">
          Create a project before starting a paid plan.
        </p>
        <Button asChild type="button" size="sm">
          <PortalLink
            href={portalWorkspacePath({
              orgSlug: org.orgSlug,
              surface: "orgHome",
            })}
          >
            Create project
          </PortalLink>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="border-outline-variant/10 bg-surface-container-low border p-6 md:p-8">
        <p className="font-label text-outline text-[10px] tracking-widest uppercase">
          Subscription
        </p>
        <h3 className="font-headline mt-3 text-2xl font-bold text-white md:text-3xl">
          {tierLabel(effectiveTier)}
        </h3>
        <p className="text-on-surface-variant mt-3 max-w-2xl text-sm leading-relaxed">
          {effectiveTier === "team"
            ? "Team includes up to 5 seats, 5,000 submissions / month, and submitter confirmations."
            : effectiveTier === "solo"
              ? "Solo includes 1 seat and 500 submissions / month. Upgrade to Team for more seats and confirmations."
              : "Free includes 10 submissions / month and 1 seat. Add Solo or Team when you need more."}
        </p>
        <div className="mt-6 space-y-6">
          {typeof submissionsUsed === "number" &&
          typeof submissionLimit === "number" ? (
            <SubmissionUsageMeter
              used={submissionsUsed}
              limit={submissionLimit}
            />
          ) : null}
          <SeatUsageMeter used={memberCount} limit={memberLimit} />
        </div>
        {showActions ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {offerCheckout && (
              <>
                <Button
                  type="button"
                  disabled={portal.billingBusy}
                  onClick={() => void portal.onUpgrade("team")}
                >
                  {portal.billingBusy ? "Redirecting…" : "Add Team plan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={portal.billingBusy}
                  onClick={() => void portal.onUpgrade("solo")}
                >
                  {portal.billingBusy ? "Redirecting…" : "Add Solo plan"}
                </Button>
              </>
            )}
            {offerTeamUpgrade && (
              <Button
                type="button"
                disabled={portal.billingBusy}
                onClick={() => void portal.onUpgrade("team")}
              >
                {portal.billingBusy ? "Redirecting…" : "Upgrade to Team"}
              </Button>
            )}
            {offerManage && (
              <Button
                type="button"
                variant="outline"
                disabled={portal.billingBusy}
                onClick={() => void portal.onManageBilling()}
              >
                {portal.billingBusy ? "Redirecting…" : "Manage billing"}
              </Button>
            )}
          </div>
        ) : null}
        {portal.billingError ? (
          <p className="mt-4 text-sm text-red-300">{portal.billingError}</p>
        ) : null}
      </section>

      <EmailPlanTiers
        currentPlan={effectiveTier}
        className="mt-0"
        busy={portal.billingBusy}
        onSelectPlan={(plan) => {
          if (plan === "free") {
            if (hasBilling) void portal.onManageBilling();
            return;
          }
          if (!hasBilling && (tier === "solo" || tier === "team")) return;
          void portal.onUpgrade(plan);
        }}
      />
      <PlanComparisonTable className="mt-0" />
    </div>
  );
}
