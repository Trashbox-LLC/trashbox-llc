import type { Metadata } from "next";
import { HomePage } from "@/components/features/marketing/HomePage";
import { HOME_DESCRIPTION, HOME_TITLE, marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default function Page() {
  return <HomePage />;
}
