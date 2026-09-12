import type { SmsApplicationStatus } from "@/lib/api";

export type ApplicationStepState = "done" | "current" | "upcoming" | "blocked";

export interface ApplicationStep {
  id: "applied" | "review" | "networks" | "live";
  label: string;
  state: ApplicationStepState;
}

export const APPLICATION_STEPS = [
  { id: "applied", label: "Applied" },
  { id: "review", label: "We look it over" },
  { id: "networks", label: "Networks verify" },
  { id: "live", label: "Live" },
] as const;

export function applicationProgress(input: {
  status: SmsApplicationStatus;
  carrierAttempts: number;
}): ApplicationStep[] {
  const states: ApplicationStepState[] = (() => {
    switch (input.status) {
      case "pending_review":
        return ["done", "current", "upcoming", "upcoming"];
      case "submitted":
        return ["done", "done", "current", "upcoming"];
      case "approved":
        return ["done", "done", "done", "done"];
      case "changes_requested":
        return input.carrierAttempts > 0
          ? ["done", "done", "blocked", "upcoming"]
          : ["done", "blocked", "upcoming", "upcoming"];
      case "closed":
        return input.carrierAttempts > 0
          ? ["done", "done", "blocked", "upcoming"]
          : ["done", "blocked", "upcoming", "upcoming"];
    }
  })();

  return APPLICATION_STEPS.map((step, index) => ({
    ...step,
    state: states[index] ?? "upcoming",
  }));
}
