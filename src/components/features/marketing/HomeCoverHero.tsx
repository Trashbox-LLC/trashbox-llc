"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { SERVICE_PATHS } from "@/lib/sites";
import { cn } from "@/lib/utils";

/** Match Reveal: hide before paint so client navigations don't flash then snap. */
const heroItemStyle = {
  opacity: 0,
  transform: "translateY(28px)",
} as const;

const COVER = {
  src: "/images/home/skyline-cover.webp",
  alt: "City skyline at dusk",
  blurDataURL:
    "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADQAwCdASoUAA4APzmGuVOvKSWisAgB4CcJbACdH8ADBsmfbMk3vdgA/j8r4/Prcul/Yt+3eIh/KiPVYw1vrSQ3PqUzzJcp2/0mAbs9xc3SyjxE+zXB8AAA",
} as const;

export function HomeCoverHero({
  headline = "gradient",
}: {
  headline?: "gradient" | "solid";
} = {}) {
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
    <section className="relative flex h-lvh touch-manipulation flex-col overflow-hidden px-6 pt-[calc(4rem+env(safe-area-inset-top))] pb-12 sm:px-8 sm:pt-20 sm:pb-20">
      <Image
        src={COVER.src}
        alt={COVER.alt}
        fill
        sizes="100vw"
        placeholder="blur"
        blurDataURL={COVER.blurDataURL}
        priority
        loading="eager"
        fetchPriority="high"
        draggable={false}
        className="pointer-events-none object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-black/70 via-black/30 to-black/60"
      />

      <div
        ref={heroRef}
        className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-center text-center"
      >
        <p
          data-hero-item
          data-header-scrim-target
          style={heroItemStyle}
          className="shrink-0 text-balance text-base text-white/80"
        >
          Website Design, Creation, & Digital Marketing
        </p>
        <h1
          data-hero-item
          style={heroItemStyle}
          className="font-headline mt-3 shrink-0 text-[clamp(2.75rem,6.6vw,6.5rem)] leading-[1.02] font-bold tracking-tight text-balance text-white"
        >
          <span className="block">Made for professionals.</span>
          <span
            className={cn("block", headline === "gradient" && "headline-shader")}
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
