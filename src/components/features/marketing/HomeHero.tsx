"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";

/** Match Reveal: hide before paint so client navigations don't flash then snap. */
const heroItemStyle = {
  opacity: 0,
  transform: "translateY(28px)",
} as const;

const DEVICES = {
  src: "/images/home/devices-hero.webp",
  alt: "Texas Covenant Home Inspections website on a laptop beside the Calorie & Protein Tracker",
  width: 2000,
  height: 1960,
  blurDataURL:
    "data:image/webp;base64,UklGRpAAAABXRUJQVlA4IIQAAAAQBACdASoYABAAPu1iqU2ppaOiMAgBMB2JZwAAUpHt/C1GFPvcghYwAAD+8ZyyUID1dfDZ2kZTFykdxHHllARTkxwp9ncCwJThN7Tso4vJtVPcmaEFIC32PWujKHtTtALvq7z2EvTZ9d5/XHTsWlzv108muBadtEacUV6l7xEAcs2wAAA=",
} as const;

export function HomeHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollLineRef = useRef<HTMLDivElement>(null);

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

  useGSAP(
    () => {
      if (!scrollLineRef.current) return;
      gsap.to(scrollLineRef.current, {
        scaleY: 0.6,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "top center",
      });
    },
    { scope: scrollLineRef },
  );

  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 pt-36 pb-28 sm:px-8">
      <div className="absolute inset-0 z-0 bg-[#050505]" />
      <div
        ref={heroRef}
        className="relative z-10 mx-auto w-full max-w-7xl text-center"
      >
        <h1
          data-hero-item
          style={heroItemStyle}
          className="font-headline text-xs font-bold tracking-[0.42em] text-white uppercase sm:text-sm"
        >
          Trashbox Studios
        </h1>

        <div
          data-hero-item
          style={heroItemStyle}
          className="relative mx-auto mt-3 w-[min(100%,64rem)] sm:mt-4"
        >
          <Image
            src={DEVICES.src}
            alt={DEVICES.alt}
            width={DEVICES.width}
            height={DEVICES.height}
            placeholder="blur"
            blurDataURL={DEVICES.blurDataURL}
            priority
            loading="eager"
            fetchPriority="high"
            className="h-auto w-full"
            style={{ height: "auto" }}
          />
        </div>

        <p
          data-hero-item
          style={heroItemStyle}
          className="text-on-surface-variant relative z-10 mx-auto -mt-8 max-w-2xl text-base leading-relaxed font-light sm:-mt-48 sm:text-lg"
        >
          Websites, apps, and systems for businesses of every size—built to look
          sharp, work hard, and grow with you.
        </p>
        <div
          data-hero-item
          style={heroItemStyle}
          className="relative z-10 mt-6 flex flex-col items-center justify-center gap-4 sm:mt-7 sm:flex-row sm:gap-6"
        >
          <Link
            href="/services#contact"
            className="kinetic-gradient monolith-shadow font-headline text-on-primary-container px-8 py-4 text-xs font-bold tracking-widest uppercase transition-transform hover:scale-[1.02] active:scale-95 sm:px-10 sm:py-5 sm:text-sm"
          >
            Work With Us
          </Link>
          <Link
            href="/about"
            className="border-outline-variant/30 font-headline hover:bg-surface-container-low border px-8 py-4 text-xs font-bold tracking-widest text-white uppercase transition-colors sm:px-10 sm:py-5 sm:text-sm"
          >
            About Us
          </Link>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4">
        <span className="font-label text-outline text-[10px] tracking-widest uppercase">
          Explore
        </span>
        <div
          ref={scrollLineRef}
          className="from-primary h-12 w-px bg-gradient-to-b to-transparent"
        />
      </div>
    </section>
  );
}
