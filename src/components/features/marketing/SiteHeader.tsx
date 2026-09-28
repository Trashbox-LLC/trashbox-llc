"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { MenuToggleIcon } from "@/components/atoms/MenuToggleIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/gsap-client";
import { SERVICE_PATHS } from "@/lib/sites";
import {
  getForceHideSiteHeader,
  subscribeForceHideSiteHeader,
} from "@/lib/site-header-visibility";

const serviceItems = [
  { href: SERVICE_PATHS.websites, label: "Websites" },
  { href: SERVICE_PATHS.webApplications, label: "Web Applications" },
  { href: SERVICE_PATHS.systems, label: "Systems" },
  { href: SERVICE_PATHS.mobileApps, label: "Mobile Apps" },
  { href: SERVICE_PATHS.aiIntegration, label: "AI Integration" },
  {
    href: "/platform",
    label: "Customer Relationship Management",
  },
] as const;

const SCROLL_TOP_THRESHOLD = 12;
const SCROLL_DELTA_THRESHOLD = 8;

/** Match FadeIn/HomeHero: hide before paint so the header doesn't flash then snap. */
const headerEnterStyle = {
  opacity: 0,
  transform: "translateY(-16px)",
} as const;

function navLinkClass(active: boolean) {
  return cn(
    "font-headline tracking-tight text-sm uppercase transition-colors",
    active
      ? "border-b-2 border-white pb-1 font-bold text-white"
      : "text-white/60 hover:text-white",
  );
}

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const navRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [forceHidden, setForceHidden] = useState(getForceHideSiteHeader);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useGSAP(
    () => {
      if (!navRef.current) return;
      gsap.fromTo(
        navRef.current,
        { y: -16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power3.out",
          // First paint already matches the "from" state (inline style below).
          immediateRender: false,
        },
      );
    },
    { scope: navRef },
  );

  useEffect(() => {
    return subscribeForceHideSiteHeader(() => {
      setForceHidden(getForceHideSiteHeader());
    });
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > SCROLL_TOP_THRESHOLD);

      if (open || y <= SCROLL_TOP_THRESHOLD) {
        setHidden(false);
        lastY = y;
        return;
      }

      const delta = y - lastY;
      if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) return;

      setHidden(delta > 0);
      lastY = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setServicesOpen(false);
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const servicesActive = pathname.startsWith("/services");
  const headerHidden = (hidden || forceHidden) && !open;

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-transform duration-300 ease-out",
        headerHidden ? "-translate-y-full" : "translate-y-0",
      )}
      data-hidden={headerHidden ? "true" : "false"}
    >
      <div ref={navRef} style={headerEnterStyle}>
        <div
          className={cn(
            "border-b backdrop-blur-xl transition-colors duration-300",
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
              aria-label="Trashbox LLC home"
            >
              <Image
                src="/images/trashbox-logo-white.png"
                alt="Trashbox LLC logo"
                width={160}
                height={40}
                className="h-9 md:h-10"
                style={{ width: "auto" }}
                priority
              />
            </Link>

            <div className="hidden items-center gap-10 md:flex md:gap-12">
              <Link href="/" className={navLinkClass(isActive("/", true))}>
                Home
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(navLinkClass(servicesActive), "outline-none")}
                >
                  Services
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="bg-surface-container-low min-w-64 border-white/10"
                >
                  {serviceItems.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                      <Link
                        href={item.href}
                        className="font-headline text-sm tracking-tight uppercase"
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/work" className={navLinkClass(isActive("/work"))}>
                Work
              </Link>
              <Link href="/about" className={navLinkClass(isActive("/about"))}>
                About
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild className="hidden active:scale-95 md:inline-flex">
                <Link href={SERVICE_PATHS.contact}>Contact</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white md:hidden"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => {
                  setOpen((value) => !value);
                  setServicesOpen(false);
                }}
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
            "bg-background grid transition-[grid-template-rows] duration-300 ease-out md:hidden",
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
              <Link
                href="/"
                tabIndex={open ? undefined : -1}
                className={navLinkClass(isActive("/", true))}
                onClick={closeMenu}
              >
                Home
              </Link>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  tabIndex={open ? undefined : -1}
                  className={cn(navLinkClass(servicesActive), "text-left")}
                  aria-expanded={servicesOpen}
                  onClick={() => setServicesOpen((v) => !v)}
                >
                  Services
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    servicesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="flex flex-col gap-3 pl-4">
                      {serviceItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          tabIndex={open && servicesOpen ? undefined : -1}
                          className="font-headline text-sm tracking-tight text-white/60 uppercase transition-colors hover:text-white"
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/work"
                tabIndex={open ? undefined : -1}
                className={navLinkClass(isActive("/work"))}
                onClick={closeMenu}
              >
                Work
              </Link>
              <Link
                href="/about"
                tabIndex={open ? undefined : -1}
                className={navLinkClass(isActive("/about"))}
                onClick={closeMenu}
              >
                About
              </Link>

              <Button asChild className="mt-4">
                <Link
                  href={SERVICE_PATHS.contact}
                  tabIndex={open ? undefined : -1}
                  onClick={closeMenu}
                >
                  Contact
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
