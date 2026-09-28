import type { Metadata } from "next";
import { PortalHeader } from "@/components/features/portal/PortalHeader";
import { PortalRouteOutlet } from "@/components/features/portal/PortalRouteOutlet";
import { PortalProvider } from "@/lib/portal";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PortalProvider>
      <PortalHeader />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-8 pt-16 pb-24">
        <PortalRouteOutlet>{children}</PortalRouteOutlet>
      </main>
    </PortalProvider>
  );
}
