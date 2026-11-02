import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { SERVICE_OFFERINGS } from "@/components/features/marketing/service-offerings";
import {
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  PLATFORM_PATHS,
  PORTAL_PATHS,
  SERVICE_PATHS,
} from "@/lib/sites";

type FooterLink = {
  href: string;
  label: string;
};

const companyLinks: FooterLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/apps", label: "Apps" },
  { href: SERVICE_PATHS.contact, label: "Contact" },
];

const serviceLinks: FooterLink[] = [
  { href: SERVICE_PATHS.hub, label: "All services" },
  ...SERVICE_OFFERINGS.map((offering) => ({
    href: SERVICE_PATHS[offering.slug],
    label: offering.title,
  })),
];

const platformLinks: FooterLink[] = [
  { href: PLATFORM_PATHS.hub, label: "Overview" },
  { href: PLATFORM_PATHS.features, label: "Features" },
  { href: PLATFORM_PATHS.pricing, label: "Pricing" },
  { href: PLATFORM_PATHS.api, label: "API" },
  { href: PLATFORM_PATHS.documentation, label: "Documentation" },
  { href: PORTAL_PATHS.login, label: "Client portal" },
];

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: readonly FooterLink[];
  className?: string;
}): ReactElement {
  return (
    <div className={className}>
      <h2 className="font-label text-xs tracking-[0.28em] text-white/40 uppercase">
        {title}
      </h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-headline text-sm tracking-tight text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter(): ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 bg-surface-container-lowest">
      <div className="mx-auto max-w-screen-2xl px-6 py-16 md:px-8 md:py-20">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Trashbox Studios home"
            >
              <Image
                src="/images/trashbox-logo-colored.svg"
                alt=""
                width={1024}
                height={1024}
                className="size-12"
              />
              <span className="font-headline text-lg font-bold tracking-tight text-white">
                Trashbox Studios
              </span>
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/55">
              Websites, apps, and systems for businesses in Kingwood, Texas.
            </p>
            <address className="mt-6 space-y-2 text-sm not-italic">
              <a
                className="block text-white/70 transition-colors hover:text-white"
                href={CONTACT_MAILTO}
              >
                {CONTACT_EMAIL}
              </a>
              <a
                className="block text-white/70 transition-colors hover:text-white"
                href={CONTACT_PHONE_TEL}
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
              <p className="text-white/45">Kingwood, TX</p>
            </address>
          </div>

          <nav
            aria-label="Sitemap"
            className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8"
          >
            <FooterColumn title="Company" links={companyLinks} />
            <FooterColumn title="Services" links={serviceLinks} />
            <FooterColumn
              title="Platform"
              links={platformLinks}
              className="col-span-2 sm:col-span-1"
            />
          </nav>
        </div>

        <p className="mt-16 border-t border-white/10 pt-8 font-body text-xs text-white/45">
          © {year} Trashbox Studios
        </p>
      </div>
    </footer>
  );
}
