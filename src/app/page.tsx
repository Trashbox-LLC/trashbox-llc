import type { Metadata } from "next";
import { HomePreview } from "@/components/features/marketing/HomePreview";
import { HOME_DESCRIPTION, HOME_TITLE, marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default function Page() {
  return <HomePreview />;
}
