"use client";

import Link from "next/link";
import { FadeIn } from "@/components/atoms/FadeIn";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Reveal } from "@/components/atoms/Reveal";
import { Button } from "@/components/ui/button";
import { SERVICE_PATHS } from "@/lib/sites";

const cards = [
  {
    span: "md:col-span-8",
    tag: "Utility / 01",
    icon: "token",
    iconBox: "bg-primary text-on-primary",
    title: "Vectra",
    body: "A high-fidelity motion design utility for real-time physics simulation on handheld devices.",
    large: true,
  },
  {
    span: "md:col-span-4",
    tag: "Experimental / 02",
    icon: "lens_blur",
    iconBox: "bg-surface-container-highest border border-white/10",
    title: "Aura",
    body: "Ambient light sequencing for creative workspaces and focus sessions.",
    large: false,
  },
  {
    span: "md:col-span-4",
    tag: "Audio / 03",
    icon: "graphic_eq",
    iconBox: "bg-surface-container-highest border border-white/10",
    title: "Oscil",
    body: "Granular synthesis engine optimized for mobile touch surfaces.",
    large: false,
  },
  {
    span: "md:col-span-4",
    tag: "Productivity / 04",
    icon: "grid_view",
    iconBox: "bg-surface-container-highest border border-white/10",
    title: "Monolith",
    body: "A spatial organization tool for complex project hierarchies.",
    large: false,
  },
  {
    span: "md:col-span-4",
    tag: "Haptics / 05",
    icon: "motion_sensor_active",
    iconBox: "bg-surface-container-highest border border-white/10",
    title: "Pulse",
    body: "Deep-layer haptic feedback testing and sequence design tool.",
    large: false,
  },
] as const;

export function AppsPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-8 pt-32 pb-24">
      <header className="mb-24">
        <FadeIn className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <span className="mb-6 block font-headline text-xs tracking-[0.3em] text-outline uppercase">
              Portfolio / 2024
            </span>
            <h1 className="font-headline text-6xl leading-[0.9] font-bold tracking-tighter text-primary md:text-8xl">
              Selected <br />
              Mobile Works.
            </h1>
          </div>
          <div className="flex items-center gap-4 font-headline text-xs tracking-widest text-outline uppercase">
            <span>Filter:</span>
            <Button
              type="button"
              variant="ghost"
              className="border-b border-primary pb-1 text-primary hover:text-primary"
            >
              All Projects
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-outline hover:text-primary"
            >
              iOS
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-outline hover:text-primary"
            >
              Android
            </Button>
          </div>
        </FadeIn>
      </header>

      <div className="grid grid-cols-1 gap-px bg-outline-variant/20 md:grid-cols-12">
        {cards.map((card, i) => (
          <Reveal
            key={card.title}
            className={`group cursor-pointer overflow-hidden border border-white/5 bg-surface-container-low transition-all duration-500 hover:border-white/20 ${card.span}`}
            delay={i * 0.05}
          >
            <div className="flex h-full flex-col p-12">
              <div
                className={`mb-12 flex ${card.large ? "items-start justify-between" : ""}`}
              >
                {card.large ? (
                  <>
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary">
                      <MaterialIcon name={card.icon} className="text-on-primary" />
                    </div>
                    <span className="rounded-full border border-outline-variant px-3 py-1 font-headline text-[10px] tracking-widest uppercase">
                      {card.tag}
                    </span>
                  </>
                ) : (
                  <div className={`flex h-16 w-16 items-center justify-center ${card.iconBox}`}>
                    <MaterialIcon name={card.icon} className="text-primary" />
                  </div>
                )}
              </div>

              <div className="mt-auto">
                {!card.large && (
                  <span className="mb-2 block font-headline text-[10px] tracking-widest text-outline uppercase">
                    {card.tag}
                  </span>
                )}
                <h2
                  className={`mb-4 font-headline font-bold tracking-tighter text-primary ${card.large ? "text-4xl" : "text-3xl"}`}
                >
                  {card.title}
                </h2>
                <p
                  className={`font-body leading-relaxed text-on-surface-variant ${card.large ? "max-w-md text-lg" : "text-sm"}`}
                >
                  {card.body}
                </p>
                {card.large && (
                  <div className="mt-8 flex items-center gap-2 font-headline text-sm font-bold tracking-tighter text-primary uppercase transition-all group-hover:gap-4">
                    Explore Project <MaterialIcon name="arrow_forward" />
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-48 mb-24 text-center">
        <h3 className="mb-8 font-headline text-4xl font-bold tracking-tighter text-primary md:text-5xl">
          Have a vision for a monolith?
        </h3>
        <p className="mx-auto mb-12 max-w-xl font-body text-lg text-outline">
          We partner with select founders to translate complex ideas into kinetic mobile experiences.
        </p>
        <div className="flex flex-col justify-center gap-4 md:flex-row">
          <Button asChild size="lg" className="active:scale-95">
            <Link href={SERVICE_PATHS.contact}>Start a Project</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/services">View Services</Link>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
