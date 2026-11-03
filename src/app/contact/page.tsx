import type { Metadata } from "next";
import { ContactPage } from "@/components/features/marketing/ContactPage";
import { JsonLd } from "@/components/features/marketing/JsonLd";
import { contactPageJsonLd, marketingMetadata } from "@/lib/seo";
import { SERVICE_PATHS } from "@/lib/sites";

export const metadata: Metadata = marketingMetadata({
  title: "Contact",
  description:
    "Start a website, app, or systems project with Trashbox Studios in Kingwood, Texas.",
  path: SERVICE_PATHS.contact,
});

export default function Page() {
  return (
    <>
      <JsonLd data={contactPageJsonLd()} />
      <ContactPage />
    </>
  );
}
