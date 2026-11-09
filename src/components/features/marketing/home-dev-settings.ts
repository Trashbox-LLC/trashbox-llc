import {
  DEFAULT_HERO_COVER_ID,
  HERO_COVER_STORAGE_KEY,
  heroCoverFromId,
} from "@/components/features/marketing/hero-covers";
import { cn } from "@/lib/utils";

export const HOME_DEV_STORAGE_KEY = "trashbox-home-dev";
export const HOME_DEV_CHANGE_EVENT = "trashbox-home-dev-change";

export const HOME_HEADLINES = ["gradient", "solid"] as const;
export const HOME_LAYOUTS = ["full", "published"] as const;
export const KICKER_SIZES = ["sm", "base", "lg", "xl"] as const;
export const KICKER_WEIGHTS = ["regular", "bold"] as const;
export const KICKER_COLORS = ["white", "soft", "grey"] as const;
export const KICKER_TRACKING = ["tight", "normal", "wide"] as const;
export const KICKER_CASES = ["text", "caps"] as const;
export const HEADER_TONES = ["grey", "white"] as const;

export type HomeHeadline = (typeof HOME_HEADLINES)[number];
export type HomeLayout = (typeof HOME_LAYOUTS)[number];
export type KickerSize = (typeof KICKER_SIZES)[number];
export type KickerWeight = (typeof KICKER_WEIGHTS)[number];
export type KickerColor = (typeof KICKER_COLORS)[number];
export type KickerTracking = (typeof KICKER_TRACKING)[number];
export type KickerCase = (typeof KICKER_CASES)[number];
export type HeaderTone = (typeof HEADER_TONES)[number];

export interface HomeKickerSettings {
  size: KickerSize;
  weight: KickerWeight;
  color: KickerColor;
  tracking: KickerTracking;
  case: KickerCase;
}

export interface HomeDevSettings {
  coverId: string;
  headline: HomeHeadline;
  layout: HomeLayout;
  kicker: HomeKickerSettings;
  header: HeaderTone;
}

export const DEFAULT_KICKER_SETTINGS: HomeKickerSettings = {
  size: "base",
  weight: "regular",
  color: "soft",
  tracking: "normal",
  case: "text",
};

export const DEFAULT_HOME_DEV_SETTINGS: HomeDevSettings = {
  coverId: DEFAULT_HERO_COVER_ID,
  headline: "gradient",
  layout: "full",
  kicker: DEFAULT_KICKER_SETTINGS,
  header: "grey",
};

const KICKER_SIZE_CLASS: Record<KickerSize, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

const KICKER_WEIGHT_CLASS: Record<KickerWeight, string> = {
  regular: "font-normal",
  bold: "font-bold",
};

const KICKER_COLOR_CLASS: Record<KickerColor, string> = {
  white: "text-white",
  soft: "text-white/80",
  grey: "text-white/50",
};

const KICKER_TRACKING_CLASS: Record<KickerTracking, string> = {
  tight: "tracking-tight",
  normal: "tracking-normal",
  wide: "tracking-widest",
};

const KICKER_CASE_CLASS: Record<KickerCase, string> = {
  text: "normal-case",
  caps: "uppercase",
};

export function kickerClassName(kicker: HomeKickerSettings): string {
  return cn(
    "shrink-0 text-balance",
    KICKER_SIZE_CLASS[kicker.size],
    KICKER_WEIGHT_CLASS[kicker.weight],
    KICKER_COLOR_CLASS[kicker.color],
    KICKER_TRACKING_CLASS[kicker.tracking],
    KICKER_CASE_CLASS[kicker.case],
  );
}

function isHeadline(value: unknown): value is HomeHeadline {
  return HOME_HEADLINES.some((headline) => headline === value);
}

function isLayout(value: unknown): value is HomeLayout {
  return HOME_LAYOUTS.some((layout) => layout === value);
}

function oneOf<T extends string>(
  options: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return options.some((option) => option === value) ? (value as T) : fallback;
}

function kickerFrom(value: unknown): HomeKickerSettings {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    size: oneOf(KICKER_SIZES, record.size, DEFAULT_KICKER_SETTINGS.size),
    weight: oneOf(
      KICKER_WEIGHTS,
      record.weight,
      DEFAULT_KICKER_SETTINGS.weight,
    ),
    color: oneOf(KICKER_COLORS, record.color, DEFAULT_KICKER_SETTINGS.color),
    tracking: oneOf(
      KICKER_TRACKING,
      record.tracking,
      DEFAULT_KICKER_SETTINGS.tracking,
    ),
    case: oneOf(KICKER_CASES, record.case, DEFAULT_KICKER_SETTINGS.case),
  };
}

export function parseHomeDevSettings(
  raw: string | null,
  legacyCoverId?: string | null,
): HomeDevSettings {
  let record: Record<string, unknown> = {};
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        record = parsed as Record<string, unknown>;
      }
    } catch {
      record = {};
    }
  }

  const storedCover =
    typeof record.coverId === "string" ? record.coverId : legacyCoverId;

  return {
    coverId: heroCoverFromId(storedCover).id,
    headline: isHeadline(record.headline)
      ? record.headline
      : DEFAULT_HOME_DEV_SETTINGS.headline,
    layout: isLayout(record.layout)
      ? record.layout
      : DEFAULT_HOME_DEV_SETTINGS.layout,
    kicker: kickerFrom(record.kicker),
    header: oneOf(HEADER_TONES, record.header, DEFAULT_HOME_DEV_SETTINGS.header),
  };
}

export function readHomeDevSettings(
  storage: Pick<Storage, "getItem">,
): HomeDevSettings {
  return parseHomeDevSettings(
    storage.getItem(HOME_DEV_STORAGE_KEY),
    storage.getItem(HERO_COVER_STORAGE_KEY),
  );
}

export function writeHomeDevSettings(
  storage: Pick<Storage, "setItem">,
  settings: HomeDevSettings,
): void {
  storage.setItem(HOME_DEV_STORAGE_KEY, JSON.stringify(settings));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(HOME_DEV_CHANGE_EVENT));
  }
}
