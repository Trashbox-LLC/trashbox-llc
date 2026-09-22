import type { Metadata } from "next";
import { SignatureBuilderCreatePage } from "@/components/features/portal/settings/signature-builder/SignatureBuilderCreatePage";

export const metadata: Metadata = {
  title: "Settings · New signature",
  description: "Create an email signature.",
};

export default function PortalSignatureNewPage() {
  return <SignatureBuilderCreatePage />;
}
