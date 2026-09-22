import type { Metadata } from "next";
import { SignatureBuilderEditPage } from "@/components/features/portal/settings/signature-builder/SignatureBuilderEditPage";

export const metadata: Metadata = {
  title: "Settings · Edit signature",
  description: "Edit an email signature.",
};

export default function PortalSignatureEditPage() {
  return <SignatureBuilderEditPage />;
}
