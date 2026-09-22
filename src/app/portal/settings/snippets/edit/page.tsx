import type { Metadata } from "next";
import { SnippetBuilderEditPage } from "@/components/features/portal/settings/snippet-builder/SnippetBuilderEditPage";

export const metadata: Metadata = {
  title: "Settings · Edit snippet",
  description: "Edit an email snippet.",
};

export default function PortalSnippetEditPage() {
  return <SnippetBuilderEditPage />;
}
