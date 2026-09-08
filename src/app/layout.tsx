import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { MarketingLayout } from "@/components/features/marketing/MarketingLayout";
import { Toaster } from "@/components/ui/sonner";
import { MATERIAL_SYMBOLS_STYLESHEET } from "@/lib/material-symbols";
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

export const metadata: Metadata = {
  title: {
    default: "Trashbox LLC",
    template: "%s — Trashbox LLC",
  },
  description:
    "Trashbox LLC builds high-fidelity digital products through focused engineering, product strategy, and editorial design systems.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Trashbox LLC",
    type: "website",
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
        <AuthProvider>
          <MarketingLayout>{children}</MarketingLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
