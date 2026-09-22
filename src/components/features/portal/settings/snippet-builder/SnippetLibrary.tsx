"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SettingsHeaderAction,
  useHasSettingsHeader,
} from "@/components/features/portal/settings/SettingsShell";
import { SnippetReplyPreview } from "@/components/features/portal/settings/snippet-builder/SnippetReplyPreview";
import {
  EMAIL_CONTENT_LIMITS,
  plainTextToHtml,
  type TemplateVariableContext,
} from "@/lib/email-content";
import {
  snippetBuilderEditPath,
  snippetBuilderNewPath,
} from "@/lib/portal-settings";
import { cn } from "@/lib/utils";
import type {
  EmailContentDraft,
  EmailContentEntry,
} from "@/components/features/portal/settings/EmailContentSettings";

interface SnippetLibraryProps {
  items: EmailContentEntry[];
  canManage?: boolean;
  busy?: boolean;
  error?: string | null;
  previewContext?: TemplateVariableContext;
  onCreate: (draft: EmailContentDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SnippetLibrary({
  items,
  canManage = false,
  busy = false,
  error,
  previewContext,
  onCreate,
  onDelete,
}: SnippetLibraryProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const selected =
    items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const inSettingsHeader = useHasSettingsHeader();
  const newHref = snippetBuilderNewPath();
  const newButton = useMemo(() => {
    if (!canManage) return null;
    return (
      <Button type="button" variant="outline" disabled={busy} asChild>
        <a href={newHref}>New snippet</a>
      </Button>
    );
  }, [busy, canManage, newHref]);

  function confirmDelete(entry: EmailContentEntry) {
    const ok = window.confirm(
      `Delete the snippet “${entry.name}”? This cannot be undone.`,
    );
    if (!ok) return;
    void onDelete(entry.id);
  }

  function duplicate(entry: EmailContentEntry) {
    void onCreate({
      name: `${entry.name} (copy)`.slice(0, EMAIL_CONTENT_LIMITS.name),
      subject: "",
      shortcut: "",
      bodyText: entry.bodyText,
      bodyHtml: entry.bodyHtml?.trim()
        ? entry.bodyHtml
        : plainTextToHtml(entry.bodyText),
      isDefault: false,
    });
  }

  return (
    <>
      {inSettingsHeader ? (
        <SettingsHeaderAction>{newButton}</SettingsHeaderAction>
      ) : (
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-headline text-2xl font-bold tracking-tight text-white md:text-3xl">
            Snippets
          </h2>
          {newButton}
        </div>
      )}

      {error && (
        <p className="mb-4 border border-error/40 bg-error/10 p-4 text-sm text-error">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No snippets yet.</p>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)]">
          <ul className="space-y-1">
            {items.map((entry) => {
              const isSelected = entry.id === selected?.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    disabled={busy}
                    onClick={() => setSelectedId(entry.id)}
                    className={cn(
                      "flex w-full items-baseline gap-2 px-3 py-2.5 text-left text-sm text-white",
                      isSelected ? "bg-white/10" : "hover:bg-white/5",
                    )}
                  >
                    <span className="font-medium">{entry.name}</span>
                    {entry.shortcut ? (
                      <span className="font-mono text-xs text-outline">
                        /{entry.shortcut}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <div className="space-y-4">
              <SnippetReplyPreview
                bodyText={selected.bodyText}
                bodyHtml={selected.bodyHtml}
                previewContext={previewContext}
                inserted
              />
              {canManage && (
                <div className="flex flex-wrap gap-4">
                  <Button
                    type="button"
                    variant="link"
                    disabled={busy}
                    asChild
                    className="h-auto px-0"
                  >
                    <a href={snippetBuilderEditPath(selected.id)}>Edit</a>
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    disabled={busy}
                    onClick={() => duplicate(selected)}
                    className="h-auto px-0"
                  >
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    disabled={busy}
                    onClick={() => confirmDelete(selected)}
                    className="h-auto px-0 text-error hover:text-error"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!canManage && (
        <p className="mt-4 text-sm text-on-surface-variant">
          You need Manage Email Templates, Signatures And Snippets to add or
          change saved snippets.
        </p>
      )}
    </>
  );
}
