import type { Metadata } from "next";
import { JsonLd } from "@/components/features/marketing/JsonLd";
import { PlatformOverview } from "@/components/features/marketing/PlatformOverview";
import { crmJsonLd, marketingMetadata } from "@/lib/seo";
import { PLATFORM_PATHS } from "@/lib/sites";

export const metadata: Metadata = marketingMetadata({
  title: "Trashbox CRM",
  description:
    "Trashbox CRM for customer retention and lead generation—email templates, messaging, lead management, and secure teams.",
  path: PLATFORM_PATHS.hub,
});

export default function PlatformHubPage() {
  return (
    <>
      <JsonLd data={crmJsonLd()} />
      <PlatformOverview />
    </>
  );
}
