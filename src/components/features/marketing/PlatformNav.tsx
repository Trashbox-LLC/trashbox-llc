"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuToggleIcon } from "@/components/atoms/MenuToggleIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLATFORM_BASE, PLATFORM_PATHS, PORTAL_PATHS } from "@/lib/sites";

const platformLinks = [
  { href: PLATFORM_PATHS.hub, label: "Overview", exact: true },
  { href: PLATFORM_PATHS.features, label: "Features" },
  { href: PLATFORM_PATHS.pricing, label: "Pricing" },
  { href: PLATFORM_PATHS.api, label: "API" },
  { href: PLATFORM_PATHS.documentation, label: "Documentation" },
] as const;

function linkClass(active: boolean) {
  return cn(
    "font-headline tracking-tight text-sm uppercase transition-colors",
    active
      ? "border-b-2 border-white pb-1 font-bold text-white"
      : "text-white/60 hover:text-white",
  );
}

function isLinkActive(pathname: string, href: string, exact?: boolean) {
  const normalizedHref = href.replace(/\/$/, "") || "/";
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  if (exact) {
    return (
      normalizedPath === normalizedHref ||
      normalizedPath === PLATFORM_BASE ||
      pathname === PLATFORM_PATHS.hub
    );
  }
  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(`${normalizedHref}/`)
  );
}

export function PlatformNav() {
  const pathname = usePathname() ?? "";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className="fixed top-0 z-50 w-full" aria-label="Trashbox CRM">
      <div
        className={cn(
          "border-b pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-colors duration-300",
          scrolled && !open
            ? "bg-background/75 border-white/10"
            : "border-transparent bg-transparent",
          open && "bg-background",
        )}
      >
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-5 md:px-8 md:py-6">
          <Link
            href="/"
            className="inline-flex items-center"
            aria-label="Trashbox Studios home"
          >
            <Image
              src="/images/trashbox-logo-colored.svg"
              alt="Trashbox Studios logo"
              width={1024}
              height={1024}
              className="size-16 md:size-20"
              priority
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex lg:gap-10">
            {platformLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={linkClass(
                  isLinkActive(
                    pathname,
                    item.href,
                    "exact" in item ? item.exact : false,
                  ),
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button asChild className="hidden active:scale-95 md:inline-flex">
              <Link href={PORTAL_PATHS.login}>Login</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <MenuToggleIcon open={open} />
            </Button>
          </div>
        </div>
      </div>

      <div
        data-mobile-menu
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
        className={cn(
          "grid bg-background transition-[grid-template-rows] duration-300 ease-out md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div
          className={cn(
            "min-h-0 overflow-hidden transition-opacity duration-300 ease-out",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-6 px-6 py-6 transition-transform duration-300 ease-out",
              open ? "translate-y-0" : "-translate-y-2",
            )}
          >
            {platformLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                tabIndex={open ? undefined : -1}
                className={linkClass(
                  isLinkActive(
                    pathname,
                    item.href,
                    "exact" in item ? item.exact : false,
                  ),
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mt-4">
              <Link
                href={PORTAL_PATHS.login}
                tabIndex={open ? undefined : -1}
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
