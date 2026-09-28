import type { Metadata } from "next";
import { listAppMarkdownPages } from "@/lib/apps/registry";
import { FORM_PLANS } from "@/lib/form-plans";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_TEL,
  PLATFORM_PATHS,
  SERVICE_PATHS,
} from "@/lib/sites";

/** Production canonical host. Apex trashbox.io redirects here. */
export const SITE_ORIGIN = "https://www.trashbox.io";

export const HOME_TITLE = "Trashbox LLC — Websites, apps, and systems";

export const HOME_DESCRIPTION =
  "Websites, apps, and systems for businesses of every size. Trashbox LLC is a software studio in Kingwood, Texas.";

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;

const MARKETING_PATHS = [
  "/",
  "/about/",
  "/work/",
  SERVICE_PATHS.hub,
  SERVICE_PATHS.websites,
  SERVICE_PATHS.webApplications,
  SERVICE_PATHS.systems,
  SERVICE_PATHS.mobileApps,
  SERVICE_PATHS.aiIntegration,
  "/apps/",
  PLATFORM_PATHS.hub,
  PLATFORM_PATHS.features,
  PLATFORM_PATHS.pricing,
  PLATFORM_PATHS.api,
  PLATFORM_PATHS.documentation,
] as const;

export function absoluteUrl(path: string): string {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  const withTrailingSlash = withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
  return new URL(withTrailingSlash, SITE_ORIGIN).href;
}

export function indexablePaths(): string[] {
  const appPaths = listAppMarkdownPages().map(
    (page) => `/apps/${page.appSlug}/${page.pageSlug}/`,
  );
  return [...MARKETING_PATHS.map((path) => absolutePath(path)), ...appPaths];
}

function absolutePath(path: string): string {
  return new URL(absoluteUrl(path)).pathname;
}

export function marketingMetadata(input: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "Trashbox LLC",
      type: "website",
      images: [
        {
          url: "/android-chrome-512x512.png",
          width: 512,
          height: 512,
          alt: "Trashbox LLC",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: input.title,
      description: input.description,
    },
  };
}

export function robotsPolicy(): {
  allow: string;
  disallow: string[];
  sitemap: string;
} {
  return {
    allow: "/",
    disallow: ["/portal"],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Trashbox LLC",
    url: absoluteUrl("/"),
    logo: `${SITE_ORIGIN}/android-chrome-512x512.png`,
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE_TEL.replace("tel:", ""),
    foundingDate: "2025",
    founder: {
      "@type": "Person",
      name: "Ezekiel Mohr",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kingwood",
      addressRegion: "TX",
      addressCountry: "US",
    },
    areaServed: "US",
    description: HOME_DESCRIPTION,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: "Trashbox LLC",
    url: absoluteUrl("/"),
    publisher: { "@id": ORGANIZATION_ID },
    description: HOME_DESCRIPTION,
  };
}

export function portfolioJsonLd(
  sites: readonly { name: string; href: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Work",
    description: "Websites built by Trashbox LLC.",
    url: absoluteUrl("/work"),
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: sites.map((site, index) => ({
        "@type": "ListItem" as const,
        position: index + 1,
        name: site.name,
        url: site.href,
      })),
    },
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { "@id": ORGANIZATION_ID },
    areaServed: "US",
  };
}

export function crmJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Trashbox CRM",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl(PLATFORM_PATHS.hub),
    provider: { "@id": ORGANIZATION_ID },
    offers: FORM_PLANS.map((plan) => ({
      "@type": "Offer" as const,
      name: `${plan.name} plan`,
      price: plan.price.toFixed(2),
      priceCurrency: "USD",
      url: absoluteUrl(PLATFORM_PATHS.pricing),
    })),
  };
}
