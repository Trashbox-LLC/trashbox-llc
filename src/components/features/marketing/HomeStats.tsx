"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { countUpFrame } from "@/lib/count-up";
import { gsap } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";

/** Uberall local-search survey, 2025. US, UK, France, and Germany. */
const HOME_STATS = [
  { value: 91, label: "search before they visit" },
  { value: 85, label: "visit within a week" },
  { value: 60, label: "likely to buy in person" },
] as const;

export function HomeStats() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const items = root.querySelectorAll<HTMLElement>("[data-stat]");
      items.forEach((item, index) => {
        const target = Number(item.dataset.stat);
        const valueEl = item.querySelector<HTMLElement>("[data-stat-value]");
        const ghostEl = item.querySelector<HTMLElement>("[data-stat-ghost]");
        if (!valueEl || !ghostEl || !Number.isFinite(target)) return;

        const state = { progress: 0 };

        const paint = () => {
          const frame = countUpFrame(state.progress, target);
          valueEl.textContent = `${frame.value}%`;
          if (frame.ghost == null) {
            ghostEl.textContent = "";
            gsap.set(ghostEl, { autoAlpha: 0 });
            return;
          }
          ghostEl.textContent = `${frame.ghost}%`;
          const fade = state.progress > 0.9 ? (1 - state.progress) / 0.1 : 1;
          gsap.set(ghostEl, { autoAlpha: 0.32 * fade });
        };

        paint();

        gsap.to(state, {
          progress: 1,
          duration: 1.7,
          delay: index * 0.1,
          ease: "power3.out",
          onUpdate: paint,
          scrollTrigger: {
            trigger: root,
            start: "top 78%",
            once: true,
          },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      aria-labelledby="home-stats-heading"
      className="bg-[#010101] px-5 py-28 sm:px-8 md:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <p
          id="home-stats-heading"
          className="text-center text-sm text-white/70 sm:text-base"
        >
          Customers already look online
        </p>
        <ul className="sr-only">
          {HOME_STATS.map((stat) => (
            <li key={stat.label}>
              {stat.value}% {stat.label}
            </li>
          ))}
        </ul>
        <div aria-hidden className="mt-16 grid sm:mt-24 sm:grid-cols-3">
          {HOME_STATS.map((stat, index) => (
            <div
              key={stat.label}
              data-stat={stat.value}
              className={cn(
                "px-4 py-10 text-center sm:py-4",
                index > 0 &&
                  "border-t border-white/15 sm:border-t-0 sm:border-l",
              )}
            >
              <div className="relative">
                <span
                  data-stat-ghost
                  className="font-headline pointer-events-none absolute inset-x-0 top-0 -translate-y-[68%] text-[clamp(3.25rem,7vw,6.25rem)] leading-none font-bold tracking-tight text-white tabular-nums opacity-0 blur-[0.8px] select-none"
                />
                <span
                  data-stat-value
                  className="font-headline relative text-[clamp(3.25rem,7vw,6.25rem)] leading-none font-bold tracking-tight text-white tabular-nums"
                >
                  {stat.value}%
                </span>
              </div>
              <p className="mt-5 text-sm text-balance text-white/65 sm:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
