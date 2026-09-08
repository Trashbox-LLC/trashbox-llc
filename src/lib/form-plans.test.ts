import { describe, expect, it } from "vitest";
import {
  FORM_PLANS,
  displayPlanTier,
  normalizePlanTier,
  planDisplayName,
  seatsForPlanTier,
  showManageBilling,
  showStripeCheckout,
  showUpgradeToTeam,
} from "./form-plans";

describe("form-plans", () => {
  it("defines Free, Solo, and Team with submission caps", () => {
    expect(FORM_PLANS.map((p) => p.id)).toEqual(["free", "solo", "team"]);
    expect(FORM_PLANS[0]?.submissionsPerMonth).toBe(10);
    expect(FORM_PLANS[1]?.price).toBe(10);
    expect(FORM_PLANS[2]?.price).toBe(20);
    expect(FORM_PLANS[2]?.submissionsPerMonth).toBe(5000);
  });

  it("normalizes legacy tiers", () => {
    expect(normalizePlanTier("basic")).toBe("solo");
    expect(normalizePlanTier("premium")).toBe("team");
    expect(planDisplayName("team")).toBe("Team");
  });

  it("maps seat limits by tier", () => {
    expect(seatsForPlanTier("free")).toBe(1);
    expect(seatsForPlanTier("solo")).toBe(1);
    expect(seatsForPlanTier("team")).toBe(5);
  });

  it("trusts a stored Solo plan even without Stripe", () => {
    expect(displayPlanTier("solo")).toBe("solo");
    expect(displayPlanTier("team")).toBe("team");
    expect(showStripeCheckout("solo", false)).toBe(false);
    expect(showManageBilling(false)).toBe(false);
    expect(showUpgradeToTeam("solo", false)).toBe(false);
  });

  it("offers Stripe checkout only for unpaid Free", () => {
    expect(showStripeCheckout("free", false)).toBe(true);
    expect(showStripeCheckout("free", true)).toBe(false);
    expect(showManageBilling(true)).toBe(true);
    expect(showUpgradeToTeam("solo", true)).toBe(true);
  });
});
