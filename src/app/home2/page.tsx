import type { Metadata } from "next";
import { PublishedHomePage } from "@/components/features/marketing/PublishedHomePage";
import { marketingMetadata } from "@/lib/seo";

const TITLE = "Published homepage";
const DESCRIPTION =
  "The published Trashbox Studios homepage for businesses in Kingwood, Texas.";

export const metadata: Metadata = {
  ...marketingMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/home2",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PublishedHomePage />;
}
