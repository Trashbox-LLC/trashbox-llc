"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  DEFAULT_HERO_COVER_ID,
  heroCoverFromId,
} from "@/components/features/marketing/hero-covers";
import {
  DEFAULT_KICKER_SETTINGS,
  kickerClassName,
  type HomeHeadline,
  type HomeKickerSettings,
} from "@/components/features/marketing/home-dev-settings";
import { gsap } from "@/lib/gsap-client";
import { SERVICE_PATHS } from "@/lib/sites";
import { cn } from "@/lib/utils";

/** Match Reveal: hide before paint so client navigations don't flash then snap. */
const heroItemStyle = {
  opacity: 0,
  transform: "translateY(28px)",
} as const;

export function HomeCoverHero({
  headline = "gradient",
  coverId = DEFAULT_HERO_COVER_ID,
  kicker = DEFAULT_KICKER_SETTINGS,
}: {
  headline?: HomeHeadline;
  coverId?: string;
  kicker?: HomeKickerSettings;
} = {}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const cover = heroCoverFromId(coverId);

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
    <section className="relative flex h-lvh touch-manipulation flex-col overflow-hidden px-6 pt-[calc(4rem+env(safe-area-inset-top))] pb-12 sm:px-8 sm:pt-20 sm:pb-20">
      <picture key={cover.id} className="pointer-events-none absolute inset-0">
        {cover.mobileSrc ? (
          <source
            media="(max-width: 767px)"
            srcSet={cover.mobileSrc}
            type="image/webp"
          />
        ) : null}
        <Image
          src={cover.src}
          alt={cover.alt}
          fill
          sizes="100vw"
          placeholder="blur"
          blurDataURL={cover.blurDataURL}
          priority
          loading="eager"
          fetchPriority="high"
          draggable={false}
          className="object-cover object-center"
        />
      </picture>
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-black/70 via-black/30 to-black/60"
      />

      <div
        ref={heroRef}
        className="@container relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-center text-center"
      >
        <p
          data-hero-item
          data-header-scrim-target
          data-kicker-size={kicker.size}
          data-kicker-weight={kicker.weight}
          data-kicker-color={kicker.color}
          data-kicker-tracking={kicker.tracking}
          data-kicker-case={kicker.case}
          style={heroItemStyle}
          className={kickerClassName(kicker)}
        >
          Website Design, Creation, & Digital Marketing
        </p>
        <h1
          data-hero-item
          style={heroItemStyle}
          className="font-headline mt-3 shrink-0 text-[min(clamp(2.75rem,6.6vw,6.5rem),9.4cqw)] leading-[1.02] font-bold tracking-tight text-white"
        >
          <span className="block whitespace-nowrap">
            Made for professionals.
          </span>
          <span
            data-headline={headline}
            className={cn(
              "block whitespace-nowrap",
              headline === "gradient" && "headline-shader",
            )}
          >
            Built by professionals.
          </span>
        </h1>

        <div className="mt-8 flex justify-center">
          <div data-hero-item style={heroItemStyle}>
            <Link
              href={SERVICE_PATHS.contact}
              className="font-headline inline-flex rounded-md bg-white px-7 py-3.5 text-base font-medium tracking-tight text-black transition-transform hover:scale-[1.02] active:scale-95 sm:px-8 sm:py-3.5 sm:text-base"
            >
              Let's Connect
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
