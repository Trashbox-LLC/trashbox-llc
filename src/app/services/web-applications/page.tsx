import type { Metadata } from "next";
import { JsonLd } from "@/components/features/marketing/JsonLd";
import { ServiceOfferingPage } from "@/components/features/marketing/ServiceOfferingPage";
import { getServiceOffering } from "@/components/features/marketing/service-offerings";
import { marketingMetadata, serviceJsonLd } from "@/lib/seo";
import { SERVICE_PATHS } from "@/lib/sites";

const offering = getServiceOffering("webApplications");

export const metadata: Metadata = marketingMetadata({
  title: offering.title,
  description: offering.intro,
  path: SERVICE_PATHS.webApplications,
});

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          name: offering.title,
          description: offering.intro,
          path: SERVICE_PATHS.webApplications,
        })}
      />
      <ServiceOfferingPage offering={offering} />
    </>
  );
}
