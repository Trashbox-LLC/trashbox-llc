"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { HtmlEmailCard } from "@/components/shared/HtmlEmailCard";
import { Button } from "@/components/ui/button";
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
  onDuplicateSaved?: (template: EmailTemplateGallerySavedItem) => void;
  onDeleteSaved?: (template: EmailTemplateGallerySavedItem) => void;
  /** How long Delete stays disabled in the confirm dialog. */
  deleteConfirmDelayMs?: number;
  onInsertHtmlPlainText?: () => void;
  onClose?: () => void;
  className?: string;
}

const DEFAULT_DELETE_CONFIRM_DELAY_MS = 3000;

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
  onOpenOptions,
}: {
  title: string;
  subtitle?: string;
  html: string;
  onClick: () => void;
  onOpenOptions?: (point: { x: number; y: number }) => void;
}): ReactElement {
  return (
    <li
      className="relative"
      onContextMenu={(event) => {
        if (!onOpenOptions) return;
        event.preventDefault();
        onOpenOptions({ x: event.clientX, y: event.clientY });
      }}
    >
      <button
        type="button"
        aria-label={title}
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
      {onOpenOptions ? (
        <button
          type="button"
          aria-label={`Options for ${title}`}
          className="absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black"
          onClick={(event) => {
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            onOpenOptions({ x: rect.left, y: rect.bottom });
          }}
        >
          <MaterialIcon name="more_vert" className="text-base" />
        </button>
      ) : null}
    </li>
  );
}

function SavedTemplateMenu({
  template,
  point,
  onEdit,
  onCopy,
  onDelete,
  onClose,
}: {
  template: EmailTemplateGallerySavedItem;
  point: { x: number; y: number };
  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}): ReactElement | null {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        target instanceof Element &&
        target.closest("[data-saved-template-menu]")
      ) {
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const left = Math.min(point.x, window.innerWidth - 180);
  const top = Math.min(point.y, window.innerHeight - 140);

  return createPortal(
    <div
      role="menu"
      aria-label={`Options for ${template.name}`}
      data-saved-template-menu
      style={{ left, top }}
      className="fixed z-200 min-w-40 rounded-md border border-white/15 bg-surface-container-low p-1 shadow-lg"
    >
      {onEdit ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full rounded-sm px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          onClick={() => {
            onClose();
            onEdit();
          }}
        >
          Edit
        </button>
      ) : null}
      {onCopy ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full rounded-sm px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          onClick={() => {
            onClose();
            onCopy();
          }}
        >
          Create a copy
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full rounded-sm px-3 py-2 text-left text-sm text-error hover:bg-white/10"
          onClick={() => {
            onClose();
            onDelete();
          }}
        >
          Delete
        </button>
      ) : null}
    </div>,
    document.body,
  );
}

function DeleteSavedConfirm({
  name,
  delayMs,
  onConfirm,
  onCancel,
}: {
  name: string;
  delayMs: number;
  onConfirm: () => void;
  onCancel: () => void;
}): ReactElement | null {
  const [ready, setReady] = useState(false);
  const [remaining, setRemaining] = useState(Math.ceil(delayMs / 1000));

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), delayMs);
    const interval = window.setInterval(() => {
      setRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [delayMs]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-210 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Delete ${name}`}
        className="w-full max-w-sm rounded-lg border border-white/15 bg-surface-container-low p-5"
      >
        <p className="text-sm text-white">{name}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={!ready} onClick={onConfirm}>
            {ready ? "Delete" : `Delete (${remaining})`}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function EmailTemplateGallery({
  mode,
  starters = EMAIL_TEMPLATE_STARTERS,
  savedTemplates = [],
  onSelectStarter,
  onSelectSaved,
  onDuplicateSaved,
  onDeleteSaved,
  deleteConfirmDelayMs = DEFAULT_DELETE_CONFIRM_DELAY_MS,
  onInsertHtmlPlainText,
  onClose,
  className,
}: EmailTemplateGalleryProps): ReactElement {
  const [category, setCategory] = useState<GalleryCategory>("all");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{
    template: EmailTemplateGallerySavedItem;
    x: number;
    y: number;
  } | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<EmailTemplateGallerySavedItem | null>(null);
  const canManageSaved = Boolean(onDuplicateSaved || onDeleteSaved);

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
        "border-outline-variant/20 bg-surface-container-low flex max-h-[min(90vh,720px)] min-h-105 flex-col border",
        className,
      )}
    >
      <div className="border-outline-variant/15 flex items-center gap-3 border-b px-4 py-3 md:px-6">
        <p className="font-label shrink-0 text-[10px] tracking-widest text-white/70 uppercase">
          Templates
        </p>
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="flex h-9 items-center gap-2 rounded-md border border-white/15 px-3">
            <MaterialIcon
              name="search"
              className="shrink-0 text-base text-white/40"
            />
            <input
              type="search"
              aria-label="Search layouts"
              placeholder="Search layouts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="search-clear-muted h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
          </div>
        </form>
        <div className="flex shrink-0 items-center gap-1">
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
        className="border-outline-variant/15 flex gap-2 overflow-x-auto border-b px-4 py-3 md:px-6"
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
        {category === "saved" &&
        savedTemplates.length === 0 &&
        !query.trim() ? (
          <p className="text-on-surface-variant text-sm">
            No saved templates yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleSaved.map((template) => (
              <GalleryCard
                key={template.id}
                title={template.name}
                subtitle="Saved"
                html={template.bodyHtml?.trim() || "<p><br /></p>"}
                onClick={() => onSelectSaved?.(template)}
                onOpenOptions={
                  canManageSaved
                    ? (point) => setMenu({ template, ...point })
                    : undefined
                }
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
      {menu ? (
        <SavedTemplateMenu
          template={menu.template}
          point={menu}
          onEdit={
            onSelectSaved ? () => onSelectSaved(menu.template) : undefined
          }
          onCopy={
            onDuplicateSaved
              ? () => onDuplicateSaved(menu.template)
              : undefined
          }
          onDelete={
            onDeleteSaved ? () => setPendingDelete(menu.template) : undefined
          }
          onClose={() => setMenu(null)}
        />
      ) : null}
      {pendingDelete ? (
        <DeleteSavedConfirm
          name={pendingDelete.name}
          delayMs={deleteConfirmDelayMs}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const template = pendingDelete;
            setPendingDelete(null);
            onDeleteSaved?.(template);
          }}
        />
      ) : null}
    </div>
  );
}
