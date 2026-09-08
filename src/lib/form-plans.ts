/** Marketing + portal plan catalog (submission-first). */
export type PlanTier = "free" | "solo" | "team";
export type PaidPlan = "solo" | "team";

export function normalizePlanTier(raw: unknown): PlanTier {
  if (raw === "free" || raw === "solo" || raw === "team") return raw;
  if (raw === "basic") return "solo";
  if (raw === "premium") return "team";
  return "free";
}

export const FORM_PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    submissionsPerMonth: 10,
    seats: 1,
    formsPerProject: 1,
    projects: "1",
    submitterConfirmation: false,
    blurb: "Capture leads and try the CRM inbox with a light monthly allowance.",
    features: [
      "10 form submissions / month",
      "1 team seat",
      "1 project",
      "1 form",
      "Lead inbox & notifications",
    ],
  },
  {
    id: "solo" as const,
    name: "Solo",
    price: 10,
    submissionsPerMonth: 500,
    seats: 1,
    formsPerProject: 10,
    projects: "Unlimited",
    submitterConfirmation: false,
    blurb:
      "Run lead capture, messaging, and email templates yourself—built for a growing business.",
    features: [
      "500 form submissions / month",
      "1 team seat",
      "10 forms per project",
      "Unlimited projects",
      "CRM inbox, templates & messaging",
    ],
  },
  {
    id: "team" as const,
    name: "Team",
    price: 20,
    submissionsPerMonth: 5_000,
    seats: 5,
    formsPerProject: 100,
    projects: "Unlimited",
    submitterConfirmation: true,
    featured: true,
    blurb:
      "Share the CRM with your crew, handle more leads, and keep response rates high together.",
    features: [
      "5,000 form submissions / month",
      "Up to 5 team seats",
      "100 forms per project",
      "Unlimited projects",
      "Secure team management",
    ],
  },
] as const;

export type FormPlan = (typeof FORM_PLANS)[number];

export function planDisplayName(tier: PlanTier): string {
  return FORM_PLANS.find((p) => p.id === tier)?.name ?? tier;
}

/** Seat allowance for a plan tier (members + pending invites). */
export function seatsForPlanTier(tier: PlanTier): number {
  return FORM_PLANS.find((p) => p.id === normalizePlanTier(tier))?.seats ?? 1;
}

/** Stored tier is the plan, including agency-granted Solo/Team without Stripe. */
export function displayPlanTier(tier: PlanTier | string | undefined): PlanTier {
  return normalizePlanTier(tier);
}

/** Stripe checkout is only for orgs that are still on unpaid Free. */
export function showStripeCheckout(
  tier: PlanTier | string | undefined,
  hasBilling: boolean,
): boolean {
  return !hasBilling && displayPlanTier(tier) === "free";
}

export function showManageBilling(hasBilling: boolean): boolean {
  return hasBilling;
}

export function showUpgradeToTeam(
  tier: PlanTier | string | undefined,
  hasBilling: boolean,
): boolean {
  return hasBilling && displayPlanTier(tier) === "solo";
}
