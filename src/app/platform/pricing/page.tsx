import type { Metadata } from "next";
import { FadeIn } from "@/components/atoms/FadeIn";
import { EmailPlanTiers } from "@/components/features/email/EmailPlanTiers";
import { PlanComparisonTable } from "@/components/features/email/PlanComparisonTable";
import { marketingMetadata } from "@/lib/seo";
import { PLATFORM_PATHS } from "@/lib/sites";

export const metadata: Metadata = marketingMetadata({
  title: "Trashbox CRM Pricing",
  description:
    "Free, Solo, and Team Trashbox CRM plans for lead generation, retention, and growing teams.",
  path: PLATFORM_PATHS.pricing,
});

export default function PortalPricingPage() {
  return (
    <div>
      <FadeIn>
        <p className="font-label text-outline mb-6 text-xs tracking-[0.4em] uppercase">
          Pricing
        </p>
        <h1 className="font-headline max-w-3xl text-4xl font-bold tracking-tighter text-white md:text-6xl">
          Simple plans. Free to start.
        </h1>
        <p className="text-on-surface-variant mt-6 max-w-xl text-lg">
          Choose a plan that fits how many leads you handle each month. Start
          free, then move to Solo or Team when you need more volume, templates,
          or seats.
        </p>
      </FadeIn>

      <EmailPlanTiers className="mt-12" />
      <PlanComparisonTable className="mt-16" />
    </div>
  );
}
