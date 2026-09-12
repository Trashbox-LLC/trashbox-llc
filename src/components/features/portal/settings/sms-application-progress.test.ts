import { describe, expect, it } from "vitest";
import { applicationProgress } from "./sms-application-progress";

describe("applicationProgress", () => {
  it("marks review as current right after they apply", () => {
    const steps = applicationProgress({
      status: "pending_review",
      carrierAttempts: 0,
    });

    expect(steps.map((step) => step.state)).toEqual([
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });

  it("marks the networks as current once the application is filed", () => {
    const steps = applicationProgress({
      status: "submitted",
      carrierAttempts: 1,
    });

    expect(steps.map((step) => step.state)).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
    ]);
  });

  it("marks every step done when the number is live", () => {
    const steps = applicationProgress({
      status: "approved",
      carrierAttempts: 1,
    });

    expect(steps.every((step) => step.state === "done")).toBe(true);
  });

  it("blocks review when we send the application back", () => {
    const steps = applicationProgress({
      status: "changes_requested",
      carrierAttempts: 0,
    });

    expect(steps[1]?.state).toBe("blocked");
    expect(steps[2]?.state).toBe("upcoming");
  });

  it("blocks the networks when the carriers ask for changes", () => {
    const steps = applicationProgress({
      status: "changes_requested",
      carrierAttempts: 1,
    });

    expect(steps[1]?.state).toBe("done");
    expect(steps[2]?.state).toBe("blocked");
  });
});
