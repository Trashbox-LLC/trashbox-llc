"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { useGSAP } from "@gsap/react";
import { MenuToggleIcon } from "@/components/atoms/MenuToggleIcon";
import {
  ServicesMenu,
  ServicesMenuList,
} from "@/components/features/marketing/ServicesMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gsap } from "@/lib/gsap-client";
import {
  DEFAULT_HOME_DEV_SETTINGS,
  HOME_DEV_CHANGE_EVENT,
  readHomeDevSettings,
  type HeaderTone,
} from "@/components/features/marketing/home-dev-settings";
import { headerScrimOpacity } from "@/lib/site-header-scrim";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  SERVICE_PATHS,
} from "@/lib/sites";

/** Match FadeIn/HomeHero: hide before paint so the header doesn't flash then snap. */
const headerEnterStyle = {
  opacity: 0,
  transform: "translateY(-16px)",
} as const;

function navLinkClass(tone: HeaderTone) {
  return cn(
    "nav-link-line inline-flex items-center font-headline text-sm leading-5 tracking-tight",
    tone === "white" ? "text-white" : "text-white/60",
  );
}

function useHeaderTone(): HeaderTone {
  const [tone, setTone] = useState<HeaderTone>(DEFAULT_HOME_DEV_SETTINGS.header);

  useEffect(() => {
    const sync = () => setTone(readHomeDevSettings(localStorage).header);
    sync();
    window.addEventListener(HOME_DEV_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HOME_DEV_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return tone;
}

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const navRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesButtonRef = useRef<HTMLButtonElement>(null);
  const servicesPanelRef = useRef<HTMLDivElement>(null);

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
      const text = document.querySelector("[data-header-scrim-target]");
      const opacity = headerScrimOpacity({
        headerTop: rect.top,
        headerBottom: rect.bottom,
        textTop: text ? text.getBoundingClientRect().top : null,
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

  useEffect(() => {
    setServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!servicesOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setServicesOpen(false);
      const button = servicesButtonRef.current;
      if (button && button.offsetParent !== null) button.focus();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (barRef.current?.contains(target)) return;
      setServicesOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [servicesOpen]);

  function closeMenu() {
    setOpen(false);
    setServicesOpen(false);
  }

  function openServices() {
    setServicesOpen(true);
  }

  function closeServices() {
    setServicesOpen(false);
  }

  function onServicesClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) {
      setServicesOpen((value) => !value);
      return;
    }
    openServices();
  }

  function onServicesBlur(event: FocusEvent) {
    const next = event.relatedTarget;
    if (!(next instanceof Node)) {
      closeServices();
      return;
    }
    if (servicesPanelRef.current?.contains(next)) return;
    if (servicesButtonRef.current?.contains(next)) return;
    closeServices();
  }

  function onServicesLeave(event: MouseEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    closeServices();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const servicesActive = pathname.startsWith("/services");
  const contactActive = isActive(SERVICE_PATHS.contact);
  const headerTone = useHeaderTone();
  const linkClass = navLinkClass(headerTone);

  return (
    <nav className="fixed top-0 z-50 w-full" data-header-tone={headerTone}>
      <div ref={navRef} style={headerEnterStyle}>
        <div
          ref={barRef}
          className={cn(
            "relative pt-[env(safe-area-inset-top)]",
            open && "bg-background",
          )}
        >
          <div
            ref={scrimRef}
            data-header-scrim
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-md"
            style={{ opacity: 0 }}
          />
          <div className="relative mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-2 md:px-8">
            <Link
              href="/"
              className="relative inline-flex h-[35.6px] w-[37.5px] shrink-0 md:h-[43.3px] md:w-[45.7px]"
              aria-label="Trashbox Studios home"
            >
              {/* The SVG canvas is padded. Size the drawn mark, not the empty canvas. */}
              <Image
                src="/images/trashbox-logo-colored.svg"
                alt="Trashbox Studios logo"
                width={1024}
                height={1024}
                className="absolute top-1/2 left-1/2 h-[46px] w-[46px] max-w-none -translate-x-1/2 -translate-y-1/2 md:h-14 md:w-14"
                priority
              />
            </Link>

            <div className="hidden items-center gap-10 md:flex md:gap-12">
              <Link
                href="/"
                data-nav-tab
                aria-current={isActive("/", true) ? "page" : undefined}
                className={linkClass}
              >
                Home
              </Link>

              <div
                className="relative flex items-center"
                onMouseLeave={onServicesLeave}
              >
                <button
                  ref={servicesButtonRef}
                  type="button"
                  data-nav-tab
                  aria-controls="services-menu"
                  aria-expanded={servicesOpen}
                  aria-current={servicesActive ? "page" : undefined}
                  onMouseEnter={openServices}
                  onClick={onServicesClick}
                  onBlur={onServicesBlur}
                  className={linkClass}
                >
                  Services
                </button>

                <div
                  ref={servicesPanelRef}
                  id="services-menu"
                  role="region"
                  aria-label="Services"
                  inert={servicesOpen ? undefined : true}
                  aria-hidden={servicesOpen ? undefined : true}
                  onMouseEnter={openServices}
                  onBlur={onServicesBlur}
                  className={cn(
                    "absolute top-full left-0 z-50 hidden pt-3 md:block",
                    servicesOpen
                      ? "pointer-events-auto"
                      : "pointer-events-none",
                  )}
                >
                  <ServicesMenu
                    pathname={pathname}
                    onNavigate={closeMenu}
                    open={servicesOpen}
                  />
                </div>
              </div>

              <Link
                href="/work"
                data-nav-tab
                aria-current={isActive("/work") ? "page" : undefined}
                className={linkClass}
              >
                Work
              </Link>
              <Link
                href="/about"
                data-nav-tab
                aria-current={isActive("/about") ? "page" : undefined}
                className={linkClass}
              >
                About Us
              </Link>
              <Link
                href={SERVICE_PATHS.contact}
                data-nav-tab
                aria-current={contactActive ? "page" : undefined}
                className={linkClass}
              >
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-5">
              <Button
                asChild
                className="hidden py-2 tracking-tight normal-case active:scale-95 md:inline-flex"
              >
                <a href={CONTACT_PHONE_TEL}>{CONTACT_PHONE_DISPLAY}</a>
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
                aria-current={isActive("/", true) ? "page" : undefined}
                tabIndex={open ? undefined : -1}
                className={linkClass}
                onClick={closeMenu}
              >
                Home
              </Link>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  tabIndex={open ? undefined : -1}
                  className={cn(linkClass, "text-left")}
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
                  <div
                    className="min-h-0 overflow-hidden"
                    inert={open && servicesOpen ? undefined : true}
                    aria-hidden={open && servicesOpen ? undefined : true}
                  >
                    <ServicesMenuList
                      pathname={pathname}
                      onNavigate={closeMenu}
                      tabIndex={open && servicesOpen ? undefined : -1}
                    />
                  </div>
                </div>
              </div>

              <Link
                href="/work"
                aria-current={isActive("/work") ? "page" : undefined}
                tabIndex={open ? undefined : -1}
                className={linkClass}
                onClick={closeMenu}
              >
                Work
              </Link>
              <Link
                href="/about"
                aria-current={isActive("/about") ? "page" : undefined}
                tabIndex={open ? undefined : -1}
                className={linkClass}
                onClick={closeMenu}
              >
                About Us
              </Link>
              <Link
                href={SERVICE_PATHS.contact}
                aria-current={contactActive ? "page" : undefined}
                tabIndex={open ? undefined : -1}
                className={linkClass}
                onClick={closeMenu}
              >
                Contact
              </Link>

              <Button asChild className="mt-4 tracking-tight normal-case">
                <a
                  href={CONTACT_PHONE_TEL}
                  tabIndex={open ? undefined : -1}
                >
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
