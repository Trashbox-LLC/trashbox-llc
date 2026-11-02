import type { Metadata } from "next";
import { PortalDeepLinkOrNotFound } from "@/components/features/portal/PortalDeepLinkOrNotFound";

export const metadata: Metadata = {
  title: "404",
  description: "This page could not be found.",
  robots: { index: false },
  openGraph: {
    title: "404 — Trashbox Studios",
  },
};

export default function NotFound() {
  return <PortalDeepLinkOrNotFound />;
}
