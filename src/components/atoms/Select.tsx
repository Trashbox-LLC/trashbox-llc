"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  /** Label shown on the closed trigger. */
  label: string;
  /** Optional label for listbox rows; falls back to `label`. */
  menuLabel?: string;
  /** Optional Tailwind class for a colored indicator dot. */
  indicatorClassName?: string;
}

export type SelectVariant = "underline" | "soft" | "field" | "inline";

interface SelectProps {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  /** `underline` for filter fields; `soft` for pills; `field` for boxed dropdowns. */
  variant?: SelectVariant;
  /** Horizontal anchor for the listbox. Defaults to `start`. */
  listboxAlign?: "start" | "end";
  /** Show the expand icon. Defaults to true. */
  caret?: boolean;
  /** Secondary text inside the trigger, after the selected label. */
  hint?: string;
  /** Open the listbox on mount. */
  initialOpen?: boolean;
  "aria-label"?: string;
}

const triggerVariantClass: Record<SelectVariant, string> = {
  underline:
    "h-auto w-full justify-between gap-2 rounded-none border-0 border-b border-outline-variant bg-transparent py-2 pl-1 font-body text-sm font-normal tracking-normal text-white normal-case hover:bg-transparent hover:text-white focus-visible:border-primary focus-visible:ring-0",
  soft: "h-auto w-full justify-between gap-2 rounded-full border border-outline-variant/25 bg-surface-container-highest/70 px-3 py-1.5 font-body text-sm font-normal tracking-normal text-white normal-case shadow-none hover:bg-surface-container-highest hover:text-white focus-visible:border-outline-variant/50 focus-visible:ring-0",
  field:
    "h-auto w-full justify-between gap-2 rounded-md border border-outline-variant/30 bg-transparent px-3 py-2.5 font-body text-sm font-normal tracking-normal text-white normal-case shadow-none hover:bg-white/5 hover:text-white focus-visible:border-outline-variant/60 focus-visible:ring-0",
  inline:
    "h-auto min-h-0 w-auto shrink-0 justify-start gap-1.5 rounded-none border-0 bg-transparent p-0 font-body text-sm leading-5 font-normal tracking-normal text-white normal-case shadow-none hover:bg-transparent hover:text-white focus-visible:ring-0",
};

const listboxVariantClass: Record<SelectVariant, string> = {
  underline:
    "absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-outline-variant/40 bg-surface-container-high py-1 shadow-lg focus:outline-none",
  soft: "absolute z-50 mt-1.5 max-h-60 overflow-auto rounded-2xl border border-outline-variant/30 bg-surface-container-high py-1.5 shadow-lg focus:outline-none",
  field:
    "absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-md border border-outline-variant/30 bg-surface-container-high py-1.5 shadow-lg focus:outline-none",
  inline:
    "absolute z-50 mt-1.5 max-h-60 w-max min-w-full overflow-auto rounded-md border border-outline-variant/30 bg-surface-container-high py-1.5 shadow-lg focus:outline-none",
};

export function Select({
  id,
  value,
  options,
  onChange,
  disabled = false,
  className,
  triggerClassName,
  variant = "underline",
  listboxAlign = "start",
  caret = true,
  hint,
  initialOpen = false,
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(initialOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex);
    }
  }, [open, selectedIndex]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(options.length - 1, index + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option.value);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        id={id}
        type="button"
        variant="ghost"
        size="default"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          if (!disabled) setOpen((next) => !next);
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          triggerVariantClass[variant],
          triggerClassName,
          hint && "max-w-full",
          disabled && "cursor-not-allowed opacity-40",
        )}
      >
        <span
          className={cn(
            "flex min-w-0 items-baseline",
            hint ? "gap-3" : "gap-2",
          )}
        >
          {selected?.indicatorClassName && (
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0 rounded-full",
                selected.indicatorClassName,
              )}
            />
          )}
          <span className={hint ? "shrink-0" : "truncate"}>
            {selected?.label ?? ""}
          </span>
          {hint ? (
            <span className="text-outline min-w-0 truncate font-normal">
              {hint}
            </span>
          ) : null}
        </span>
        {caret ? (
          <MaterialIcon
            name="expand_more"
            className={cn(
              "text-outline shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        ) : null}
      </Button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listboxId}-option-${activeIndex}`}
          onKeyDown={onListKeyDown}
          ref={(node) => node?.focus()}
          className={cn(
            listboxVariantClass[variant],
            (variant === "soft" || variant === "field") &&
              (listboxAlign === "end"
                ? "right-0 left-auto min-w-full w-max max-w-[14rem]"
                : "w-full"),
            variant === "inline" &&
              listboxAlign === "end" &&
              "right-0 left-auto max-w-[min(18rem,calc(100vw-1.5rem))]",
            variant === "underline" &&
              listboxAlign === "end" &&
              "right-0 left-auto",
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={`${option.value}-${option.label}`}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option.value)}
                className={cn(
                  "flex min-w-0 cursor-pointer items-center gap-2 py-2 pl-4 pr-3 text-sm text-on-surface",
                  variant === "soft" && "mx-1 rounded-full px-3",
                  variant === "field" && "mx-1 rounded-md px-3",
                  isActive && "bg-surface-bright text-white",
                  isSelected && "font-medium text-white",
                )}
              >
                {option.indicatorClassName && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      option.indicatorClassName,
                    )}
                  />
                )}
                <span className="truncate">
                  {option.menuLabel ?? option.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
