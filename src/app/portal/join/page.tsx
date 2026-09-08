import type { Metadata } from "next";
import { JoinForm } from "@/components/features/portal/auth/JoinForm";

export const metadata: Metadata = {
  title: "Portal",
  description: "Continue to your Trashbox Form API portal.",
};

export default function Page() {
  return <JoinForm />;
}
