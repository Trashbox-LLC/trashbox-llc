"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";

export function HomeStatement() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const content = contentRef.current;
      if (!section || !content) return;

      gsap.fromTo(
        content,
        { y: 80, opacity: 0.15, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "center center",
            scrub: 0.8,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-8 py-40 md:py-56"
    >
      <div
        ref={contentRef}
        className="relative mx-auto flex max-w-5xl flex-col items-center text-center"
        style={{ opacity: 0.15, transform: "translateY(80px) scale(0.94)" }}
      >
        <Image
          src="/images/trashbox-logo-colored.svg"
          alt="Trashbox Studios"
          width={1024}
          height={1024}
          className="mb-10 size-36 md:mb-12 md:size-48 lg:size-56"
        />
        <h2 className="font-headline text-5xl font-bold leading-tight tracking-tighter text-white md:text-7xl lg:text-8xl">
          Hire us for a single project.
          <span className="mt-4 block text-outline-variant md:mt-6">
            Or keep us on as you grow.
          </span>
        </h2>
      </div>
    </section>
  );
}
