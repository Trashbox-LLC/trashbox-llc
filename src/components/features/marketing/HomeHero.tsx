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
  width: 2462,
  height: 2413,
  blurDataURL:
    "data:image/webp;base64,UklGRoAAAABXRUJQVlA4IHQAAAAwBACdASoUABQAPu1mqk8ppaOiKA1RMB2JZwAALgmdVvo35Nm7gdQwEAAA/u0mtuaF292ICs8hW9bwuwx1EFd0Qs1RJMZxzW5195So3Osgec5UgJcysTSZhOiWoxn03bY55XBOnO+qnZNGOVNp/Az7FTKQAA==",
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
    <section className="relative min-h-dvh px-5 pt-24 pb-28 sm:px-8 sm:pt-20 md:pb-48 lg:pb-72">
      <div className="absolute inset-0 z-0 bg-[#010101]" />
      <div
        ref={heroRef}
        className="relative z-10 mx-auto w-full max-w-7xl text-center"
      >
        <p
          data-hero-item
          style={heroItemStyle}
          className="text-sm text-white/80 sm:text-base"
        >
          Websites, apps, and systems for local businesses in Kingwood, TX.
        </p>
        <h1
          data-hero-item
          style={heroItemStyle}
          className="font-headline mt-2 text-[clamp(1.7rem,4.6vw,4.75rem)] leading-[1.05] font-bold tracking-tight text-balance text-white sm:mt-3"
        >
          <span className="block">Made for professionals.</span>
          <span className="block">Built by professionals.</span>
        </h1>

        <div
          data-hero-item
          data-header-scrim-target
          style={heroItemStyle}
          className="relative mx-auto mt-1 w-[min(100%,56rem)] sm:mt-2"
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
          className="text-on-surface-variant relative z-10 mx-auto -mt-28 max-w-2xl text-base leading-relaxed font-light sm:-mt-56 md:-mt-72 lg:-mt-96 sm:text-lg"
        >
          Websites, apps, and systems for businesses of every size—built to look
          sharp, work hard, and grow with you.
        </p>
        <div
          data-hero-item
          style={heroItemStyle}
          className="relative z-10 mt-6"
        >
          <Link
            href="/services#contact"
            className="font-headline inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-medium tracking-tight text-black transition-transform hover:scale-[1.02] active:scale-95"
          >
            Work with us
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
