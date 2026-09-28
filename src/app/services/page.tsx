import type { Metadata } from "next";
import { ServicesPage } from "@/components/features/marketing/ServicesPage";
import { marketingMetadata } from "@/lib/seo";
import { SERVICE_PATHS } from "@/lib/sites";

export const metadata: Metadata = marketingMetadata({
  title: "Websites, apps, and systems",
  description:
    "Websites, web applications, systems, mobile apps, and AI integration—one-off builds and ongoing development from Trashbox LLC.",
  path: SERVICE_PATHS.hub,
});

export default function Page() {
  return <ServicesPage />;
}
