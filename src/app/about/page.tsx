import type { Metadata } from "next";
import { AboutPage } from "@/components/features/marketing/AboutPage";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Software studio in Kingwood, TX",
  description:
    "Trashbox LLC was founded in 2025 in Kingwood, TX by Ezekiel Mohr to bring excellent software to businesses of every size.",
  path: "/about",
});

export default function Page() {
  return <AboutPage />;
}
