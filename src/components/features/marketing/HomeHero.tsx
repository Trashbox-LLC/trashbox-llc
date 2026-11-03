"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { SERVICE_PATHS } from "@/lib/sites";

/** Match Reveal: hide before paint so client navigations don't flash then snap. */
const heroItemStyle = {
  opacity: 0,
  transform: "translateY(28px)",
} as const;

const DEVICES = {
  src: "/images/home/devices-hero.webp",
  alt: "Texas Covenant Home Inspections website on a laptop beside the Calorie & Protein Tracker",
  blurDataURL:
    "data:image/webp;base64,UklGRoAAAABXRUJQVlA4IHQAAAAwBACdASoUABQAPu1mqk8ppaOiKA1RMB2JZwAALgmdVpo35Nm7gdQwEAAA/u0mtuaF292ICs8hW9bwuwx1EFd0Qs1RJMZxzW5195So3Osgec5UgJcysTSZhOiWoxn03bY55XBOnO+qnZNGOVNp/Az7FTKQAA==",
} as const;

export function HomeHero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!heroRef.current) return;
      const items = heroRef.current.querySelectorAll("[data-hero-item]");
      gsap.fromTo(
        items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.09,
          delay: 0.12,
          ease: "power3.out",
          immediateRender: true,
        },
      );
    },
    { scope: heroRef },
  );

  return (
    <section className="relative flex h-dvh flex-col overflow-hidden px-5 pt-24 pb-8 sm:px-8 sm:pt-20 sm:pb-10">
      <div className="absolute inset-0 z-0 bg-[#010101]" />
      <div
        ref={heroRef}
        className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col text-center"
      >
        <p
          data-hero-item
          data-header-scrim-target
          style={heroItemStyle}
          className="shrink-0 text-sm text-white/80 sm:text-base"
        >
          Website Design, Creation, & Digital Marketing
        </p>
        <h1
          data-hero-item
          style={heroItemStyle}
          className="font-headline mt-2 shrink-0 text-[clamp(1.7rem,4.6vw,4.75rem)] leading-[1.05] font-bold tracking-tight text-balance text-white sm:mt-3"
        >
          <span className="block">Made for professionals.</span>
          <span className="headline-shader block">Built by professionals.</span>
        </h1>

        <div className="relative mx-auto mt-1 min-h-0 w-[min(100%,56rem)] flex-1 sm:mt-2">
          <div
            data-hero-item
            style={heroItemStyle}
            className="absolute inset-0 z-0"
          >
            <Image
              src={DEVICES.src}
              alt={DEVICES.alt}
              fill
              sizes="(max-width: 896px) 100vw, 56rem"
              placeholder="blur"
              blurDataURL={DEVICES.blurDataURL}
              priority
              loading="eager"
              fetchPriority="high"
              className="object-contain object-top"
            />
          </div>

          <div className="absolute inset-0 z-20 flex justify-center max-sm:items-center sm:items-end">
            <div data-hero-item style={heroItemStyle}>
              <Link
                href={SERVICE_PATHS.contact}
                className="font-headline inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-medium tracking-tight text-black transition-transform hover:scale-[1.02] active:scale-95"
              >
                Let's Connect
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
