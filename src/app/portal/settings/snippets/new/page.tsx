import type { Metadata } from "next";
import { SnippetBuilderCreatePage } from "@/components/features/portal/settings/snippet-builder/SnippetBuilderCreatePage";

export const metadata: Metadata = {
  title: "Settings · New snippet",
  description: "Create an email snippet.",
};

export default function PortalSnippetNewPage() {
  return <SnippetBuilderCreatePage />;
}
