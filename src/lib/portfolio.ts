export interface PortfolioSite {
  name: string;
  href: string;
  image: string;
  blurDataURL: string;
}

export const PORTFOLIO_SITES: readonly PortfolioSite[] = [
  {
    name: "Riley Musil",
    href: "https://rileymusil.com/",
    image: "/images/work/riley-musil.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAADwAwCdASogABQAPy1+uFOuqCWisAwB0CWJZwDI1CHfFOBQmDIcSkiAAN5lBgiyPve/gxNkz7WUOvpwXQux6mA0jdtD74AAAAA=",
  },
  {
    name: "Texas Covenant Home Inspections",
    href: "https://txcovenanthomeinspections.com/",
    image: "/images/work/texas-covenant.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAABwBACdASogABQAPzmGuVOvKSWisAgB4CcJYwDGQCKTrdjAmA/Dodz/frZYgAD+W+0kGrCrsILsyzmRVVW1c0kgFwLG992NCp1kiHmgty9x3uyReMNNqfvxw33SI3boyaIjoDhEtzkPBkPoAAA=",
  },
  {
    name: "Monarch Home Inspections",
    href: "https://www.monarchhomeinspectionstx.com/",
    image: "/images/work/monarch.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADQAwCdASogABQAPzmMtFOvKiSisBgMAeAnCWNpiFiiCTyboc0fjiAA/usk9G0mhr4jtjFlOv+FpQyzYlQ1kyKkuhlfjTtqCvAAB7s/y8kxX/NQ/2HD/YsicAA=",
  },
  {
    name: "Lacelle Pastries",
    href: "https://lacelle-pastries.vercel.app/",
    image: "/images/work/lacelle-pastries.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRqgAAABXRUJQVlA4IJwAAABQBQCdASogABQAPzmIu1YvKKWjsBgIAeAnCWwAnTKAAXwPzcXRKt7YjA1TaOzSMS1H5YAA/tXclzuxG10bFGsVSaTGEntZYTLM/1Tdj/YSyFC8Z9zDjPv5WfWSz7R0WfmhHYI4dp2e8MU15OWlMOyCqJIbxYnggpcYyVE6Ibst5EcorZ7Ij4WcUusdYp/jLYr8hotsHaP4JyIYAAA=",
  },
  {
    name: "RJ Inspections",
    href: "https://www.rjinspectionstexas.com/",
    image: "/images/work/rj-inspections.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADQAwCdASogABQAPzmEuFOvKKUkMAgB4CcJZQDM0CHK7pWglbdlApQA/uvajEbYmHug9Dt9InQQdEkgoh36Pi9nleyVFPyRC9yKNcFnxcMAAA==",
  },
  {
    name: "Salus Integrative Health",
    href: "https://salus-integrative-health.vercel.app/",
    image: "/images/work/salus.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAACwBACdASogABQAPzmOwFcvKacjqAqp4CcJZwDNhDTvwyIQ3bHBze3w5Q/121YAAP7VFjZXh0mNo2MHpwU429TTTHsNSVHm3Z6E68P/IxDPAd2z3MAdH/v4BPaWKHDPZqj2oFVAAAA=",
  },
] as const;

/** Lacelle sits in front on first paint, matching the coverflow composition. */
export const INITIAL_PORTFOLIO_INDEX = 3;

/**
 * Signed steps from the active card. Values wrap the long way around so the
 * fan stays centered, and an exact opposite card stays on the left.
 */
export function coverflowOffset(
  index: number,
  active: number,
  count: number,
): number {
  let delta = index - active;
  const half = count / 2;
  if (delta > half) delta -= count;
  if (delta < -half) delta += count;
  return delta;
}

export function stepPortfolioIndex(
  active: number,
  delta: number,
  count: number,
): number {
  return (active + delta + count) % count;
}

export interface CoverflowPose {
  /** Horizontal shift as a percent of the card width. Negative sits on the left. */
  shift: number;
  /** Depth in pixels. Positive is toward the viewer. */
  depth: number;
  /** Y rotation in degrees. The outer edge of a side card turns away. */
  rotate: number;
  scale: number;
  /** Cards opposite the active one stay out of the fan. */
  hidden: boolean;
}

const STEP_SHIFT = [0, 64, 116, 150] as const;
const STEP_TURN = [0, 38, 52, 58] as const;

/** Where a card sits relative to the one in front. */
export function coverflowPose(delta: number): CoverflowPose {
  const distance = Math.min(Math.abs(delta), STEP_SHIFT.length - 1);
  const direction = Math.sign(delta);

  return {
    shift: direction * STEP_SHIFT[distance],
    depth: delta === 0 ? 140 : -distance * 150,
    rotate: delta === 0 ? 0 : direction * -STEP_TURN[distance],
    scale: delta === 0 ? 1 : 1 - distance * 0.06,
    hidden: Math.abs(delta) > 2,
  };
}

export function portfolioPositionLabel(active: number, count: number): string {
  const current = String(active + 1).padStart(2, "0");
  const total = String(count).padStart(2, "0");
  return `${current} / ${total}`;
}
