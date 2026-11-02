"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
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
  indicatorMoved,
  pageIndicatorTarget,
  type PageIndicatorFrame,
} from "@/lib/page-indicator";
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

function TabMark({ current }: { current: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -inset-x-1 bottom-0 h-px rounded-full bg-white",
        current ? "opacity-100" : "opacity-0",
        "group-data-[motion-indicator=ready]/nav:opacity-0",
      )}
    />
  );
}

function readPageIndicator(nav: HTMLElement): PageIndicatorFrame | null {
  const navBox = nav.getBoundingClientRect();
  const current = nav.querySelector<HTMLElement>(
    '[data-nav-tab][aria-current="page"]',
  );
  const linkBox = current?.getBoundingClientRect();
  const outset = 4;
  return pageIndicatorTarget({
    reducedMotion:
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    navLeft: navBox.left,
    navWidth: navBox.width,
    link: linkBox
      ? {
          left: linkBox.left - outset,
          width: linkBox.width + outset * 2,
        }
      : null,
  });
}

function navLinkClass(active: boolean) {
  return cn(
    "font-headline text-sm tracking-tight transition-colors md:pb-1",
    active
      ? "border-b-2 border-white pb-1 font-bold text-white md:border-b-0"
      : "text-white/60 hover:text-white",
  );
}

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const navRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const indicatorFrame = useRef<PageIndicatorFrame | null>(null);
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

  useGSAP(
    () => {
      const nav = navItemsRef.current;
      const indicator = indicatorRef.current;
      if (!nav || !indicator) return;

      let slide = 0;
      let slideTween: gsap.core.Tween | null = null;

      const place = (animate: boolean) => {
        const target = readPageIndicator(nav);
        if (!target) {
          cancelAnimationFrame(slide);
          slideTween?.kill();
          gsap.set(indicator, { autoAlpha: 0 });
          delete nav.dataset.motionIndicator;
          return;
        }
        nav.dataset.motionIndicator = "ready";
        const previous = indicatorFrame.current;
        const moved = indicatorMoved(previous, target);
        if (!animate && !moved) return;
        cancelAnimationFrame(slide);
        slideTween?.kill();
        if (animate && moved && previous) {
          gsap.set(indicator, {
            x: previous.x,
            width: previous.width,
            autoAlpha: 1,
          });
          slide = requestAnimationFrame(() => {
            slideTween = gsap.to(indicator, {
              x: target.x,
              width: target.width,
              autoAlpha: 1,
              duration: 0.55,
              ease: "power2.inOut",
              overwrite: "auto",
            });
          });
        } else {
          gsap.set(indicator, {
            x: target.x,
            width: target.width,
            autoAlpha: 1,
          });
        }
        indicatorFrame.current = target;
      };

      place(true);

      if (typeof ResizeObserver === "undefined") return;
      let listening = false;
      const observer = new ResizeObserver(() => {
        if (!listening) return;
        place(false);
      });
      for (const link of nav.querySelectorAll("[data-nav-tab]")) {
        observer.observe(link);
      }
      const frame = requestAnimationFrame(() => {
        listening = true;
      });
      return () => {
        cancelAnimationFrame(slide);
        cancelAnimationFrame(frame);
        slideTween?.kill();
        observer.disconnect();
      };
    },
    { scope: navItemsRef, dependencies: [pathname] },
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

  function onBarLeave(event: MouseEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    closeServices();
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
          onMouseLeave={onBarLeave}
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

            <div
              ref={navItemsRef}
              className="group/nav relative hidden items-center gap-10 md:flex md:gap-12"
            >
              <Link
                href="/"
                data-nav-tab
                aria-current={isActive("/", true) ? "page" : undefined}
                className={cn(navLinkClass(isActive("/", true)), "relative")}
              >
                Home
                <TabMark current={isActive("/", true)} />
              </Link>

              <div className="relative">
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
                  className={cn(
                    navLinkClass(servicesActive),
                    servicesOpen && !servicesActive && "text-white",
                    "relative",
                  )}
                >
                  Services
                  <TabMark current={servicesActive} />
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
                    "transition duration-200 ease-out motion-reduce:transition-none",
                    servicesOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0",
                  )}
                >
                  <ServicesMenu pathname={pathname} onNavigate={closeMenu} />
                </div>
              </div>

              <Link
                href="/work"
                data-nav-tab
                aria-current={isActive("/work") ? "page" : undefined}
                className={cn(navLinkClass(isActive("/work")), "relative")}
              >
                Work
                <TabMark current={isActive("/work")} />
              </Link>
              <Link
                href="/about"
                data-nav-tab
                aria-current={isActive("/about") ? "page" : undefined}
                className={cn(navLinkClass(isActive("/about")), "relative")}
              >
                About Us
                <TabMark current={isActive("/about")} />
              </Link>
              <Link
                href={SERVICE_PATHS.contact}
                data-nav-tab
                className={cn(navLinkClass(false), "relative")}
              >
                Contact
                <TabMark current={false} />
              </Link>
              <span
                ref={indicatorRef}
                aria-hidden
                data-page-indicator
                className="pointer-events-none absolute bottom-0 left-0 h-px w-0 rounded-full bg-white opacity-0"
              />
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
                aria-current={isActive("/", true) ? "page" : undefined}
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
                className={navLinkClass(isActive("/work"))}
                onClick={closeMenu}
              >
                Work
              </Link>
              <Link
                href="/about"
                aria-current={isActive("/about") ? "page" : undefined}
                tabIndex={open ? undefined : -1}
                className={navLinkClass(isActive("/about"))}
                onClick={closeMenu}
              >
                About Us
              </Link>
              <Link
                href={SERVICE_PATHS.contact}
                tabIndex={open ? undefined : -1}
                className={navLinkClass(false)}
                onClick={closeMenu}
              >
                Contact
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
