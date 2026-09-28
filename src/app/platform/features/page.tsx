import type { Metadata } from "next";
import { PlatformFeatures } from "@/components/features/marketing/PlatformFeatures";
import { marketingMetadata } from "@/lib/seo";
import { PLATFORM_PATHS } from "@/lib/sites";

export const metadata: Metadata = marketingMetadata({
  title: "Trashbox CRM Features",
  description:
    "Lead management, email templates, messaging, and secure team access in Trashbox CRM.",
  path: PLATFORM_PATHS.features,
});

export default function PortalFeaturesPage() {
  return <PlatformFeatures />;
}
