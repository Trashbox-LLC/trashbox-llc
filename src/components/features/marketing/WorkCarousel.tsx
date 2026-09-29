"use client";

import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  INITIAL_PORTFOLIO_INDEX,
  PORTFOLIO_SITES,
  coverflowHitSpan,
  coverflowOffset,
  coverflowPose,
  portfolioPositionLabel,
  stepPortfolioIndex,
  type PortfolioSite,
} from "@/lib/portfolio";

const DRAG_THRESHOLD_PX = 48;
const AUTO_ADVANCE_MS = 6000;

const SIDE_DELTAS = [-2, -1, 1, 2] as const;

function sideBandStyle(delta: number): CSSProperties {
  const span = coverflowHitSpan(delta);
  if (!span) return {};
  const card = "min(78vw, calc((100dvh - 22rem) * 1.4))";
  const start = span.start.toFixed(3);
  const size = (span.end - span.start).toFixed(3);
  const edge = `calc(50% + ${start} * ${card})`;
  const width = `calc(${size} * ${card})`;
  return delta > 0 ? { left: edge, width } : { right: edge, width };
}

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
  const advanceTimer = useRef<number | null>(null);
  const startAdvanceRef = useRef<() => void>(() => {});
  const count = PORTFOLIO_SITES.length;
  const { active, previous } = position;
  const current = PORTFOLIO_SITES[active];

  function clearAdvance() {
    if (advanceTimer.current === null) return;
    window.clearInterval(advanceTimer.current);
    advanceTimer.current = null;
  }

  function startAdvance() {
    clearAdvance();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    advanceTimer.current = window.setInterval(() => {
      if (document.hidden) return;
      setPosition((currentPosition) => ({
        previous: currentPosition.active,
        active: stepPortfolioIndex(currentPosition.active, 1, count),
      }));
    }, AUTO_ADVANCE_MS);
  }

  useEffect(() => {
    startAdvanceRef.current = startAdvance;
  });

  function go(delta: number) {
    setPosition((currentPosition) => ({
      previous: currentPosition.active,
      active: stepPortfolioIndex(currentPosition.active, delta, count),
    }));
    startAdvance();
  }

  function select(index: number) {
    setPosition((currentPosition) => ({
      previous: currentPosition.active,
      active: index,
    }));
    startAdvance();
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
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const target = event.target;
      if (target instanceof Element && target.closest("[data-side-select]")) {
        return;
      }
      dragStart.current = event.clientX;
      stage.setPointerCapture(event.pointerId);
    };

    const finishSwipe = (event: PointerEvent) => {
      const start = dragStart.current;
      dragStart.current = null;
      if (stage.hasPointerCapture?.(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
      if (start === null) return;
      const deltaX = event.clientX - start;
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
      suppressClick.current = true;
      const delta = deltaX < 0 ? 1 : -1;
      setPosition((currentPosition) => ({
        previous: currentPosition.active,
        active: stepPortfolioIndex(currentPosition.active, delta, count),
      }));
      startAdvanceRef.current();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    startAdvanceRef.current();
    root.addEventListener("keydown", onKeyDown);
    stage.addEventListener("pointerdown", onPointerDown);
    const onPointerCancel = () => {
      dragStart.current = null;
    };

    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    stage.addEventListener("pointerup", finishSwipe);
    stage.addEventListener("pointercancel", onPointerCancel);
    stage.addEventListener("click", onClickCapture, true);
    stage.addEventListener("dragstart", onDragStart);
    return () => {
      clearAdvance();
      root.removeEventListener("keydown", onKeyDown);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", finishSwipe);
      stage.removeEventListener("pointercancel", onPointerCancel);
      stage.removeEventListener("click", onClickCapture, true);
      stage.removeEventListener("dragstart", onDragStart);
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
      <div className="relative min-h-[min(36vw,calc(100dvh-16rem))] w-full flex-1">
        <div
          ref={stageRef}
          className="absolute inset-0 touch-pan-y [transform-style:preserve-3d]"
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
                  "pointer-events-none absolute top-1/2 left-1/2 w-[min(78vw,calc((100dvh-22rem)*1.4))] origin-center [transform-style:preserve-3d]",
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
                    draggable={false}
                    aria-label={`Visit ${site.name}`}
                    className="pointer-events-auto absolute inset-0 select-none [-webkit-user-drag:none]"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0 z-20">
          {SIDE_DELTAS.map((delta) => {
            const index = stepPortfolioIndex(active, delta, count);
            const site = PORTFOLIO_SITES[index];
            if (!site) return null;
            return (
              <button
                key={delta}
                type="button"
                data-side-select=""
                aria-label={site.name}
                className="pointer-events-auto absolute inset-y-0 border-0 bg-transparent"
                style={sideBandStyle(delta)}
                onClick={() => select(index)}
              />
            );
          })}
        </div>
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
