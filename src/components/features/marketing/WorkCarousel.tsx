"use client";

import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  INITIAL_PORTFOLIO_INDEX,
  PORTFOLIO_SITES,
  coverflowOffset,
  coverflowPose,
  portfolioPositionLabel,
  stepPortfolioIndex,
  type PortfolioSite,
} from "@/lib/portfolio";

const DRAG_THRESHOLD_PX = 48;

function SiteShot({ site, eager }: { site: PortfolioSite; eager: boolean }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[#111] shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
      <Image
        src={site.image}
        alt=""
        fill
        sizes="(max-width: 768px) 78vw, 60vw"
        className="object-cover object-top"
        placeholder="blur"
        blurDataURL={site.blurDataURL}
        priority={eager}
        fetchPriority={eager ? "high" : "auto"}
      />
    </div>
  );
}

export function WorkCarousel() {
  const [position, setPosition] = useState({
    active: INITIAL_PORTFOLIO_INDEX,
    previous: INITIAL_PORTFOLIO_INDEX,
  });
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const dragStart = useRef<number | null>(null);
  const count = PORTFOLIO_SITES.length;
  const { active, previous } = position;
  const current = PORTFOLIO_SITES[active];

  function go(delta: number) {
    setPosition((currentPosition) => ({
      previous: currentPosition.active,
      active: stepPortfolioIndex(currentPosition.active, delta, count),
    }));
  }

  function select(index: number) {
    setPosition((currentPosition) => ({
      previous: currentPosition.active,
      active: index,
    }));
  }

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      setPosition((currentPosition) => ({
        previous: currentPosition.active,
        active: stepPortfolioIndex(currentPosition.active, delta, count),
      }));
    };

    const onPointerDown = (event: PointerEvent) => {
      dragStart.current = event.clientX;
    };

    const onPointerUp = (event: PointerEvent) => {
      const start = dragStart.current;
      dragStart.current = null;
      if (start === null) return;
      const deltaX = event.clientX - start;
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
      suppressClick.current = true;
      const delta = deltaX < 0 ? 1 : -1;
      setPosition((currentPosition) => ({
        previous: currentPosition.active,
        active: stepPortfolioIndex(currentPosition.active, delta, count),
      }));
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener("keydown", onKeyDown);
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("click", onClickCapture, true);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("click", onClickCapture, true);
    };
  }, [count]);

  if (!current) return null;

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Websites"
      className="relative flex w-full flex-1 flex-col"
    >
      <div
        ref={stageRef}
        className="relative min-h-[min(36vw,calc(100dvh-16rem))] w-full flex-1 [transform-style:preserve-3d]"
        style={{ perspective: "120vw", perspectiveOrigin: "50% 46%" }}
      >
        {PORTFOLIO_SITES.map((site, index) => {
          const delta = coverflowOffset(index, active, count);
          const pose = coverflowPose(delta);
          const selected = delta === 0;
          const previousDelta = coverflowOffset(index, previous, count);
          const jumps = Math.abs(delta - previousDelta) > 2;

          return (
            <div
              key={site.href}
              className={cn(
                "absolute top-1/2 left-1/2 w-[min(78vw,calc((100dvh-22rem)*1.4))] origin-center [transform-style:preserve-3d]",
                jumps
                  ? "transition-none"
                  : "motion-safe:transition-[translate,rotate,scale] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
              )}
              style={{
                translate: `calc(-50% + ${pose.shift}%) -50% ${pose.depth * 0.055}vw`,
                rotate: `y ${pose.rotate}deg`,
                scale: String(pose.scale),
                visibility: pose.hidden ? "hidden" : "visible",
                pointerEvents: pose.hidden ? "none" : "auto",
              }}
            >
              <div className={cn(!selected && "brightness-[0.78]")}>
                <SiteShot
                  site={site}
                  eager={index === INITIAL_PORTFOLIO_INDEX}
                />
              </div>
              {selected ? (
                <a
                  href={site.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${site.name}`}
                  className="absolute inset-0"
                />
              ) : pose.hidden ? null : (
                <button
                  type="button"
                  aria-label={site.name}
                  className="absolute inset-0 border-0 bg-transparent"
                  onClick={() => select(index)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center md:mt-10" aria-live="polite">
        <p className="font-headline px-4 text-[clamp(2rem,6.5vw,7.5rem)] leading-[0.92] font-bold tracking-tight text-balance text-white uppercase">
          {current.name}
        </p>
        <div className="mt-5 flex items-center justify-center gap-8 md:mt-6 md:gap-10">
          <button
            type="button"
            aria-label="Previous website"
            className="flex size-12 items-center justify-center text-white/70 transition-colors hover:text-white md:size-14"
            onClick={() => go(-1)}
          >
            <ChevronLeftIcon aria-hidden="true" className="size-8 md:size-10" />
          </button>
          <p className="font-label text-outline text-[clamp(0.75rem,1.5vw,1.25rem)] tracking-[0.45em] uppercase">
            {portfolioPositionLabel(active, count)}
          </p>
          <button
            type="button"
            aria-label="Next website"
            className="flex size-12 items-center justify-center text-white/70 transition-colors hover:text-white md:size-14"
            onClick={() => go(1)}
          >
            <ChevronRightIcon
              aria-hidden="true"
              className="size-8 md:size-10"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
