"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HERO_COVERS } from "@/components/features/marketing/hero-covers";
import type {
  HomeDevSettings as HomeDevSettingsValue,
  HeaderTone,
  HomeHeadline,
  HomeKickerSettings,
  HomeLayout,
  KickerCase,
  KickerColor,
  KickerSize,
  KickerTracking,
  KickerWeight,
} from "@/components/features/marketing/home-dev-settings";
import { cn } from "@/lib/utils";

const HEADLINE_OPTIONS: { id: HomeHeadline; label: string }[] = [
  { id: "gradient", label: "Gradient" },
  { id: "solid", label: "White" },
];

const LAYOUT_OPTIONS: { id: HomeLayout; label: string }[] = [
  { id: "full", label: "Full" },
  { id: "published", label: "Published" },
];

const HEADER_OPTIONS: { id: HeaderTone; label: string }[] = [
  { id: "grey", label: "All grey" },
  { id: "white", label: "All white" },
];

const KICKER_SIZE_OPTIONS: { id: KickerSize; label: string; name: string }[] = [
  { id: "sm", label: "S", name: "Eyebrow small" },
  { id: "base", label: "M", name: "Eyebrow medium" },
  { id: "lg", label: "L", name: "Eyebrow large" },
  { id: "xl", label: "XL", name: "Eyebrow extra large" },
];

const KICKER_WEIGHT_OPTIONS: { id: KickerWeight; label: string }[] = [
  { id: "regular", label: "Regular" },
  { id: "bold", label: "Bold" },
];

const KICKER_COLOR_OPTIONS: {
  id: KickerColor;
  label: string;
  name: string;
}[] = [
  { id: "white", label: "White", name: "Eyebrow white" },
  { id: "soft", label: "Soft", name: "Eyebrow soft" },
  { id: "grey", label: "Grey", name: "Eyebrow grey" },
];

const KICKER_TRACKING_OPTIONS: { id: KickerTracking; label: string }[] = [
  { id: "tight", label: "Tight" },
  { id: "normal", label: "Normal" },
  { id: "wide", label: "Wide" },
];

const KICKER_CASE_OPTIONS: { id: KickerCase; label: string; name: string }[] = [
  { id: "text", label: "Aa", name: "Eyebrow sentence case" },
  { id: "caps", label: "AA", name: "Eyebrow uppercase" },
];

export function HomeDevSettings({
  value,
  onChange,
}: {
  value: HomeDevSettingsValue;
  onChange: (settings: HomeDevSettingsValue) => void;
}) {
  return (
    <div className="fixed bottom-[max(4.5rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-[70]">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Dev settings"
            className="rounded-full border border-white/25 bg-black/55 text-white shadow-lg backdrop-blur-md hover:bg-black/75 hover:text-white"
          >
            <Settings />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={10}
          className="z-[70] max-h-[70vh] overflow-y-auto border-white/15 bg-black/80 p-3 backdrop-blur-md"
        >
          <div className="grid gap-4">
            <SettingsSection title="Header">
              <OptionRow
                label="Header"
                showLabel={false}
                options={HEADER_OPTIONS}
                selected={value.header}
                onSelect={(header) => onChange({ ...value, header })}
              />
            </SettingsSection>

            <SettingsSection title="Hero Image">
              <div className="grid grid-cols-3 gap-2">
                {HERO_COVERS.map((cover) => {
                  const selected = cover.id === value.coverId;
                  return (
                    <button
                      key={cover.id}
                      type="button"
                      aria-label={cover.alt}
                      aria-pressed={selected}
                      onClick={() => onChange({ ...value, coverId: cover.id })}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white",
                        selected ? "ring-2 ring-white" : "ring-1 ring-white/25",
                      )}
                    >
                      <Image
                        src={cover.src}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </SettingsSection>

            <SettingsSection title="Hero Eyebrow">
              <OptionRow
                label="Size"
                options={KICKER_SIZE_OPTIONS}
                selected={value.kicker.size}
                onSelect={(size) => changeKicker(value, onChange, { size })}
              />
              <OptionRow
                label="Weight"
                options={KICKER_WEIGHT_OPTIONS}
                selected={value.kicker.weight}
                onSelect={(weight) => changeKicker(value, onChange, { weight })}
              />
              <OptionRow
                label="Color"
                options={KICKER_COLOR_OPTIONS}
                selected={value.kicker.color}
                onSelect={(color) => changeKicker(value, onChange, { color })}
              />
              <OptionRow
                label="Spacing"
                options={KICKER_TRACKING_OPTIONS}
                selected={value.kicker.tracking}
                onSelect={(tracking) =>
                  changeKicker(value, onChange, { tracking })
                }
              />
              <OptionRow
                label="Case"
                options={KICKER_CASE_OPTIONS}
                selected={value.kicker.case}
                onSelect={(nextCase) =>
                  changeKicker(value, onChange, { case: nextCase })
                }
              />
            </SettingsSection>

            <SettingsSection title="Hero Title">
              <OptionRow
                label="Hero Title"
                showLabel={false}
                options={HEADLINE_OPTIONS}
                selected={value.headline}
                onSelect={(headline) => onChange({ ...value, headline })}
              />
            </SettingsSection>

            <SettingsSection title="Page">
              <OptionRow
                label="Page"
                showLabel={false}
                options={LAYOUT_OPTIONS}
                selected={value.layout}
                onSelect={(layout) => onChange({ ...value, layout })}
              />
            </SettingsSection>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-2 border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
      <h2 className="text-xs font-medium text-white/70">{title}</h2>
      {children}
    </section>
  );
}

function changeKicker(
  value: HomeDevSettingsValue,
  onChange: (settings: HomeDevSettingsValue) => void,
  patch: Partial<HomeKickerSettings>,
) {
  onChange({ ...value, kicker: { ...value.kicker, ...patch } });
}

function OptionRow<T extends string>({
  label,
  showLabel = true,
  options,
  selected,
  onSelect,
}: {
  label: string;
  showLabel?: boolean;
  options: readonly { id: T; label: string; name?: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  const columns =
    options.length >= 4
      ? "grid-cols-4"
      : options.length === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <div className="grid gap-1.5">
      {showLabel ? (
        <p className="text-[11px] font-medium text-white/45">{label}</p>
      ) : null}
      <div role="group" aria-label={label} className={cn("grid gap-2", columns)}>
        {options.map((option) => (
          <OptionButton
            key={option.id}
            label={option.label}
            name={option.name}
            pressed={selected === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

function OptionButton({
  label,
  name,
  pressed,
  onClick,
}: {
  label: string;
  name?: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-white",
        pressed
          ? "bg-white text-black"
          : "bg-white/10 text-white hover:bg-white/20",
      )}
    >
      {label}
    </button>
  );
}
