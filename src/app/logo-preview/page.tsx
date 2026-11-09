import type { Metadata } from "next";
import { LogoPlugPreview } from "@/components/features/marketing/LogoPlugPreview";
import { marketingMetadata } from "@/lib/seo";

const TITLE = "Logo preview";
const DESCRIPTION = "Outline Trashbox logo plugging the keyboard into the box.";

export const metadata: Metadata = {
  ...marketingMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/logo-preview",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LogoPlugPreview />;
}
