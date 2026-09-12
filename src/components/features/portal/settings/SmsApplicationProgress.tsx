import { cn } from "@/lib/utils";
import type { SmsApplication } from "@/lib/api";
import { applicationProgress } from "./sms-application-progress";

export interface SmsApplicationProgressProps {
  application: SmsApplication;
}

export function SmsApplicationProgress({
  application,
}: SmsApplicationProgressProps) {
  const steps = applicationProgress(application);

  return (
    <ol className="grid gap-4 sm:grid-cols-4">
      {steps.map((step, index) => (
        <li key={step.id} className="min-w-0">
          <p
            className={cn(
              "font-label text-[10px] tracking-widest uppercase",
              step.state === "current" && "text-white",
              step.state === "done" && "text-outline",
              step.state === "upcoming" && "text-outline/50",
              step.state === "blocked" && "text-error",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </p>
          <p
            className={cn(
              "mt-2 text-sm",
              step.state === "current" && "text-white",
              step.state === "done" && "text-on-surface-variant",
              step.state === "upcoming" && "text-outline",
              step.state === "blocked" && "text-error",
            )}
          >
            {step.label}
          </p>
        </li>
      ))}
    </ol>
  );
}
