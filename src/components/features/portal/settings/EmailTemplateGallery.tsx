"use client";

import { useMemo, useState, type ReactElement } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { HtmlEmailCard } from "@/components/shared/HtmlEmailCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EMAIL_TEMPLATE_STARTERS,
  EMAIL_TEMPLATE_STARTER_CATEGORIES,
  type EmailTemplateStarter,
  type EmailTemplateStarterCategory,
} from "@/lib/email-template-starters";

export interface EmailTemplateGallerySavedItem {
  id: string;
  name: string;
  subject?: string;
  bodyHtml?: string | null;
}

export interface EmailTemplateGalleryProps {
  mode: "create" | "compose";
  starters?: readonly EmailTemplateStarter[];
  savedTemplates?: readonly EmailTemplateGallerySavedItem[];
  onSelectStarter: (starter: EmailTemplateStarter) => void;
  onSelectSaved?: (template: EmailTemplateGallerySavedItem) => void;
  onInsertHtmlPlainText?: () => void;
  onClose?: () => void;
  className?: string;
}

type GalleryCategory = "all" | "saved" | EmailTemplateStarterCategory;

const GALLERY_CATEGORIES: readonly { id: GalleryCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "saved", label: "Saved" },
  ...EMAIL_TEMPLATE_STARTER_CATEGORIES.filter((item) => item.id !== "all"),
];

function categoryLabel(id: EmailTemplateStarterCategory): string {
  return (
    EMAIL_TEMPLATE_STARTER_CATEGORIES.find((item) => item.id === id)?.label ??
    id
  );
}

function matchesQuery(
  name: string,
  subject: string | undefined,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    name.toLowerCase().includes(needle) ||
    (subject ?? "").toLowerCase().includes(needle)
  );
}

function GalleryCard({
  title,
  subtitle,
  html,
  onClick,
}: {
  title: string;
  subtitle?: string;
  html: string;
  onClick: () => void;
}): ReactElement {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group w-full rounded-lg border border-white/10 bg-black/20 p-3 text-left transition-colors hover:border-white/40 focus-visible:border-white"
      >
        <div className="relative">
          <HtmlEmailCard title={title} html={html} />
          <span
            aria-hidden
            className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-white px-2 py-1 text-xs font-medium text-black opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            Use
          </span>
        </div>
        <p className="mt-3 text-sm text-white">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-white/45">{subtitle}</p>
        ) : null}
      </button>
    </li>
  );
}

export function EmailTemplateGallery({
  mode,
  starters = EMAIL_TEMPLATE_STARTERS,
  savedTemplates = [],
  onSelectStarter,
  onSelectSaved,
  onInsertHtmlPlainText,
  onClose,
  className,
}: EmailTemplateGalleryProps): ReactElement {
  const [category, setCategory] = useState<GalleryCategory>("all");
  const [query, setQuery] = useState("");

  const visibleStarters = useMemo(() => {
    if (category === "saved") return [];
    const inCategory =
      category === "all"
        ? starters
        : starters.filter((starter) => starter.category === category);
    return inCategory.filter((starter) =>
      matchesQuery(starter.name, starter.subject, query),
    );
  }, [category, query, starters]);

  const visibleSaved = useMemo(() => {
    if (category !== "all" && category !== "saved") return [];
    return savedTemplates.filter((template) =>
      matchesQuery(template.name, template.subject, query),
    );
  }, [category, query, savedTemplates]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Template Gallery"
      className={cn(
        "flex max-h-[min(90vh,720px)] min-h-105 flex-col border border-outline-variant/20 bg-surface-container-low",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant/15 px-4 py-3 md:px-6">
        <p className="font-label shrink-0 text-[10px] tracking-widest text-white/70 uppercase">
          Templates
        </p>
        <form
          className="mx-auto w-full max-w-md min-w-48 flex-1"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="flex h-9 items-center gap-2 rounded-md border border-white/15 px-3">
            <MaterialIcon name="search" className="text-base text-white/40" />
            <Input
              type="search"
              aria-label="Search layouts"
              placeholder="Search layouts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-full border-0 bg-transparent px-0 py-0 placeholder:text-white/40 focus-visible:border-transparent"
            />
          </div>
        </form>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {mode === "create" && onInsertHtmlPlainText && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Insert HTML / Plain Text"
              onClick={onInsertHtmlPlainText}
            >
              HTML
            </Button>
          )}
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={onClose}
            >
              <MaterialIcon name="close" className="text-base" />
            </Button>
          )}
        </div>
      </div>

      <div
        role="group"
        aria-label="Template categories"
        className="flex gap-2 overflow-x-auto border-b border-outline-variant/15 px-4 py-3 md:px-6"
      >
        {GALLERY_CATEGORIES.map((item) => {
          const selected = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(item.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-sm",
                selected
                  ? "border-white bg-white text-black"
                  : "border-white/20 text-white/80 hover:border-white/40",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        {category === "saved" && savedTemplates.length === 0 && !query.trim() ? (
          <p className="text-sm text-on-surface-variant">No saved templates yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleSaved.map((template) => (
              <GalleryCard
                key={template.id}
                title={template.name}
                subtitle="Saved"
                html={template.bodyHtml?.trim() || "<p><br /></p>"}
                onClick={() => onSelectSaved?.(template)}
              />
            ))}
            {visibleStarters.map((starter) => (
              <GalleryCard
                key={starter.id}
                title={starter.name}
                subtitle={categoryLabel(starter.category)}
                html={starter.bodyHtml}
                onClick={() => onSelectStarter(starter)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
