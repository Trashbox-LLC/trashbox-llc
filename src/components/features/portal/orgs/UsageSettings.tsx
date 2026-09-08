"use client";

import { PortalLink } from "@/components/features/portal/PortalLink";
import { SeatUsageMeter } from "@/components/features/portal/orgs/SeatUsageMeter";
import { SubmissionUsageMeter } from "@/components/features/portal/orgs/SubmissionUsageMeter";
import { Button } from "@/components/ui/button";
import type { OrgSummary } from "@/lib/api";
import {
  displayPlanTier,
  planDisplayName,
  seatsForPlanTier,
  type PlanTier,
} from "@/lib/form-plans";
import { usePortal } from "@/lib/portal";
import { orgSettingsSectionPath } from "@/lib/portal-settings";

interface UsageSettingsProps {
  org: OrgSummary;
}

function resolveTier(tier: PlanTier): PlanTier {
  return displayPlanTier(tier);
}

/** Organization usage: monthly submission meter and plan context. */
export function UsageSettings({ org }: UsageSettingsProps) {
  const portal = usePortal();
  const isOwner = org.role === "owner";
  const tier = resolveTier(portal.account?.tier ?? org.tier);
  const submissionsUsed = portal.account?.submissionsUsed ?? 0;
  const submissionLimit = portal.account?.submissionLimit;
  const hasSubmissionLimit =
    typeof submissionLimit === "number" && submissionLimit > 0;
  const memberCount = portal.account?.memberCount ?? 1;
  const memberLimit = Math.max(
    portal.account?.memberLimit ?? 0,
    seatsForPlanTier(tier),
  );

  if (!isOwner) {
    return (
      <p className="text-on-surface-variant">
        Only the organization owner can view usage.
      </p>
    );
  }

  return (
    <section className="border-outline-variant/10 bg-surface-container-low space-y-6 border p-6 md:p-8">
      <div>
        <p className="font-label text-outline text-[10px] tracking-widest uppercase">
          Usage
        </p>
        <h3 className="font-headline mt-3 text-2xl font-bold text-white md:text-3xl">
          {planDisplayName(tier)}
        </h3>
      </div>

      <div className="space-y-6">
        {hasSubmissionLimit ? (
          <SubmissionUsageMeter used={submissionsUsed} limit={submissionLimit} />
        ) : (
          <p className="text-on-surface-variant text-sm">
            Submission usage will appear once this organization has billing data
            loaded.
          </p>
        )}
        <SeatUsageMeter used={memberCount} limit={memberLimit} />
      </div>

      <Button asChild type="button" size="sm" variant="outline">
        <PortalLink href={orgSettingsSectionPath(org.orgSlug, "current-plan")}>
          View plans
        </PortalLink>
      </Button>
    </section>
  );
}
