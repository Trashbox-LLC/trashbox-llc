"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { TiltMedia } from "@/components/atoms/TiltMedia";
import { SERVICE_OFFERINGS } from "@/components/features/marketing/service-offerings";
import { gsap } from "@/lib/gsap-client";
import { SERVICE_PATHS } from "@/lib/sites";

const panels = SERVICE_OFFERINGS.map((offering) => ({
  href: SERVICE_PATHS[offering.slug],
  title: offering.title,
  eyebrow: offering.eyebrow,
  blurb: offering.intro,
  image: offering.image,
}));

export function HomeScrollShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      const progress = progressRef.current;
      if (!section || !track) return;

      const getScrollDistance = () =>
        Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          pin: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progress) {
              gsap.set(progress, { scaleX: self.progress });
            }
          },
        },
      });

      const panelsEl = track.querySelectorAll<HTMLElement>("[data-panel]");
      panelsEl.forEach((panel, index) => {
        // First panel is already on-screen when the pin starts, so horizontal
        // "left 75%" never crosses — reveal it as the section enters instead.
        const scrollTrigger =
          index === 0
            ? {
                trigger: section,
                start: "top 75%",
                once: true,
              }
            : {
                trigger: panel,
                containerAnimation: tween,
                start: "left 75%",
                once: true,
              };

        gsap.fromTo(
          panel.querySelectorAll("[data-panel-item]"),
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "reveal",
            scrollTrigger,
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background"
      aria-label="What we build"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-8 pt-20 md:px-12 md:pt-24">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center gap-6">
          <h2 className="text-center font-headline text-3xl font-bold tracking-tight text-white md:text-5xl">
            What we build
          </h2>
          <div className="hidden h-px w-40 overflow-hidden bg-outline-variant/30 md:block">
            <div
              ref={progressRef}
              className="h-full origin-left bg-primary"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex h-dvh w-max items-stretch will-change-transform"
      >
        {panels.map((panel, index) => (
          <article
            key={panel.href}
            data-panel
            className="flex h-full w-screen shrink-0 items-center px-8 pt-16 md:px-16 md:pt-20 lg:px-24"
          >
            <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <p
                  data-panel-item
                  className="mb-4 font-label text-[10px] tracking-[0.35em] text-outline uppercase"
                  style={{ opacity: 0, transform: "translateY(36px)" }}
                >
                  {String(index + 1).padStart(2, "0")} · {panel.eyebrow}
                </p>
                <h3
                  data-panel-item
                  className="font-headline text-4xl font-bold tracking-tight text-white md:text-6xl"
                  style={{ opacity: 0, transform: "translateY(36px)" }}
                >
                  <Link
                    href={panel.href}
                    className="transition-colors hover:text-outline"
                  >
                    {panel.title}
                  </Link>
                </h3>
                <p
                  data-panel-item
                  className="mt-6 max-w-md text-base leading-relaxed text-on-surface-variant md:text-lg"
                  style={{ opacity: 0, transform: "translateY(36px)" }}
                >
                  {panel.blurb}
                </p>
                <Link
                  data-panel-item
                  href={panel.href}
                  className="mt-8 inline-block font-headline text-xs font-bold tracking-widest text-primary uppercase transition-opacity hover:opacity-80"
                  style={{ opacity: 0, transform: "translateY(36px)" }}
                >
                  Explore {panel.title}
                </Link>
              </div>
              <div
                data-panel-item
                className="px-1 lg:col-span-7 lg:px-3"
                style={{ opacity: 0, transform: "translateY(36px)" }}
              >
                <TiltMedia className="relative aspect-[16/11]">
                  <Image
                    src={panel.image.src}
                    alt={panel.image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                </TiltMedia>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
