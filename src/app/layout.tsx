import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { JsonLd } from "@/components/features/marketing/JsonLd";
import { AuthProvider } from "@/lib/auth";
import { MarketingLayout } from "@/components/features/marketing/MarketingLayout";
import { Toaster } from "@/components/ui/sonner";
import { MATERIAL_SYMBOLS_STYLESHEET } from "@/lib/material-symbols";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_ORIGIN,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import "@/styles/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: HOME_TITLE,
    template: "%s — Trashbox Studios",
  },
  description: HOME_DESCRIPTION,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Trashbox Studios",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    statusBarStyle: "black",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* precedence="low" so globals.css (1.25rem) wins over Google's default 24px */}
        <link
          rel="stylesheet"
          href={MATERIAL_SYMBOLS_STYLESHEET}
          precedence="low"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${manrope.variable} font-body antialiased`}
      >
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[env(safe-area-inset-top)] bg-black"
        />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <AuthProvider>
          <MarketingLayout>{children}</MarketingLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
