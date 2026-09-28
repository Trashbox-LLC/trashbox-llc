import type { Metadata } from "next";
import { AppsPage } from "@/components/features/marketing/AppsPage";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Mobile apps",
  description:
    "Browse selected mobile and experimental applications from Trashbox LLC.",
  path: "/apps",
});

export default function Page() {
  return <AppsPage />;
}
