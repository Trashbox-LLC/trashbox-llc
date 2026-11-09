import type { Metadata } from "next";
import { HomePage } from "@/components/features/marketing/HomePage";
import { marketingMetadata } from "@/lib/seo";

const TITLE = "White headline";
const DESCRIPTION =
  "Homepage preview for Trashbox Studios in Kingwood, Texas, with a white headline.";

export const metadata: Metadata = {
  ...marketingMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/home3",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HomePage headline="solid" />;
}
