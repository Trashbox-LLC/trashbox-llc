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
import { headerScrimOpacity } from "@/lib/site-header-scrim";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  SERVICE_PATHS,
} from "@/lib/sites";

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

/** Match FadeIn/HomeHero: hide before paint so the header doesn't flash then snap. */
const headerEnterStyle = {
  opacity: 0,
  transform: "translateY(-16px)",
} as const;

function navLinkClass(active: boolean) {
  return cn(
    "font-headline tracking-tight text-sm transition-colors",
    active
      ? "border-b-2 border-white pb-1 font-bold text-white"
      : "text-white/60 hover:text-white",
  );
}

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const navRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
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
    const bar = barRef.current;
    const scrim = scrimRef.current;
    if (!bar || !scrim) return;

    const update = () => {
      const rect = bar.getBoundingClientRect();
      const media = document.querySelector("[data-header-scrim-target]");
      const opacity = headerScrimOpacity({
        headerTop: rect.top,
        headerBottom: rect.bottom,
        mediaTop: media ? media.getBoundingClientRect().top : null,
        scrollY: window.scrollY,
      });
      scrim.style.opacity = String(opacity);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

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

  return (
    <nav className="fixed top-0 z-50 w-full">
      <div ref={navRef} style={headerEnterStyle}>
        <div
          ref={barRef}
          className={cn("relative", open && "bg-background")}
        >
          <div
            ref={scrimRef}
            data-header-scrim
            aria-hidden
            className="bg-background/75 pointer-events-none absolute inset-0 border-b border-white/10 backdrop-blur-xl"
            style={{ opacity: 0 }}
          />
          <div className="relative mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-2 md:px-8">
            <Link
              href="/"
              className="relative inline-flex h-[35.6px] w-[37.5px] shrink-0 md:h-[43.3px] md:w-[45.7px]"
              aria-label="Trashbox LLC home"
            >
              {/* The SVG canvas is padded. Size the drawn mark, not the empty canvas. */}
              <Image
                src="/images/trashbox-logo-colored.svg"
                alt="Trashbox LLC logo"
                width={1024}
                height={1024}
                className="absolute top-1/2 left-1/2 h-[46px] w-[46px] max-w-none -translate-x-1/2 -translate-y-1/2 md:h-14 md:w-14"
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
                        className="font-headline text-sm tracking-tight"
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

            <div className="flex items-center gap-5">
              <a
                href={CONTACT_PHONE_TEL}
                className="font-headline hidden text-sm tracking-tight text-white/60 transition-colors hover:text-white md:inline"
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
              <Button
                asChild
                className="hidden py-2 tracking-tight normal-case active:scale-95 md:inline-flex"
              >
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
                          className="font-headline text-sm tracking-tight text-white/60 transition-colors hover:text-white"
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

              <Button asChild className="mt-4 tracking-tight normal-case">
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
