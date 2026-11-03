import type { Metadata } from "next";
import { HomePage } from "@/components/features/marketing/HomePage";
import { marketingMetadata } from "@/lib/seo";

const TITLE = "Skyline cover";
const DESCRIPTION =
  "Alternate homepage for Trashbox Studios in Kingwood, Texas.";

export const metadata: Metadata = {
  ...marketingMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/home2",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HomePage hero="cover" />;
}
