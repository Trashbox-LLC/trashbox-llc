import type { Metadata } from "next";
import { JsonLd } from "@/components/features/marketing/JsonLd";
import { WorkPage } from "@/components/features/marketing/WorkPage";
import { PORTFOLIO_SITES } from "@/lib/portfolio";
import { marketingMetadata, portfolioJsonLd } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Work",
  description: "Websites built by Trashbox LLC.",
  path: "/work",
});

export default function Page() {
  return (
    <>
      <JsonLd data={portfolioJsonLd(PORTFOLIO_SITES)} />
      <WorkPage />
    </>
  );
}
