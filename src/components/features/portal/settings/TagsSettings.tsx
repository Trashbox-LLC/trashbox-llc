"use client";

import { useCallback, useEffect, useState } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ApiError,
  createProjectTag,
  deleteProjectTag,
  LEAD_STATUS_LABELS,
  LEAD_TAG_PALETTE,
  leadStatusOf,
  leadTagColor,
  leadTagLabel,
  leadTagsOf,
  listProjectTags,
  recolorProjectTag,
  renameProjectTag,
  type Submission,
} from "@/lib/api";
import { usePortal } from "@/lib/portal";
import { cn } from "@/lib/utils";

/** Newest lead that already has tags, for the settings preview. */
export function tagPreviewLead(
  items: readonly Submission[],
): Submission | null {
  const tagged = items.filter((item) => leadTagsOf(item).length > 0);
  if (tagged.length === 0) return null;
  return [...tagged].sort((left, right) => {
    const leftAt = left.updatedAt ?? left.submittedAt;
    const rightAt = right.updatedAt ?? right.submittedAt;
    return rightAt.localeCompare(leftAt);
  })[0];
}

export type TagUsageExample = {
  name: string;
  email: string;
  tags: string[];
  source?: string;
  stage: string;
};

const SAMPLE_USAGE: Omit<TagUsageExample, "tags"> = {
  name: "Jordan Hale",
  email: "jordan@northline.co",
  source: "Website",
  stage: "Proposal",
};

const SAMPLE_TAGS = ["hot lead", "quote sent"];

/** A real tagged lead when one is loaded, otherwise a sample. Empty catalogs still wear demo tags. */
export function tagUsageExample(
  tags: readonly string[],
  items: readonly Submission[],
): TagUsageExample {
  const lead = tagPreviewLead(items);
  if (tags.length === 0 || !lead) {
    const worn = tags.length > 0 ? tags.slice(0, 2) : SAMPLE_TAGS;
    return { ...SAMPLE_USAGE, tags: worn };
  }
  const source = lead.formName?.trim();
  return {
    name: lead.senderName.trim() || lead.senderEmail,
    email: lead.senderEmail,
    tags: leadTagsOf(lead),
    source: source || undefined,
    stage: LEAD_STATUS_LABELS[leadStatusOf(lead)],
  };
}

export type TagsSettingsInitialState = {
  tags: string[];
  colors?: Record<string, string>;
};

interface TagsSettingsProps {
  /** When set, skip the network load (Storybook and tests). */
  initialState?: TagsSettingsInitialState;
}

type TagCatalogResult = {
  tags: string[];
  colors?: Record<string, string>;
};

export function TagsSettings({ initialState }: TagsSettingsProps) {
  const portal = usePortal();
  const [tags, setTags] = useState<string[]>(initialState?.tags ?? []);
  const [colors, setColors] = useState<Record<string, string>>(
    initialState?.colors ?? {},
  );
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(Boolean(initialState));
  const [error, setError] = useState<string | null>(null);
  const [openColor, setOpenColor] = useState<string | null>(null);

  const setLeadTags = portal.setLeadTags;
  const setLeadTagColors = portal.setLeadTagColors;
  const rewriteLeadTag = portal.rewriteLeadTag;
  const publish = useCallback(
    (catalog: TagCatalogResult) => {
      const nextColors = catalog.colors ?? {};
      setTags(catalog.tags);
      setColors(nextColors);
      setLeadTags(catalog.tags);
      setLeadTagColors(nextColors);
    },
    [setLeadTagColors, setLeadTags],
  );

  useEffect(() => {
    if (initialState) return;
    let cancelled = false;
    async function run() {
      setReady(false);
      setError(null);
      try {
        const data = await listProjectTags();
        if (!cancelled) publish(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load tags");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [initialState, publish]);

  async function onAdd() {
    const name = draft.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const result = await createProjectTag(name, leadTagColor(name).id);
      publish(result);
      setDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add tag");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(tag: string) {
    setEditing(tag);
    setEditDraft(tag);
    setError(null);
  }

  async function onRename(from: string) {
    const to = editDraft.trim();
    if (!to || to.toLowerCase() === from.toLowerCase()) {
      setEditing(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await renameProjectTag(from, to);
      publish(result);
      rewriteLeadTag(from, to);
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not rename tag");
    } finally {
      setBusy(false);
    }
  }

  async function onRecolor(tag: string, color: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await recolorProjectTag(tag, color);
      publish(result);
      setOpenColor(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change color");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(tag: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await deleteProjectTag(tag);
      publish(result);
      rewriteLeadTag(tag, null);
      if (editing === tag) setEditing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove tag");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <p className="text-on-surface-variant text-sm" role="status">
        Loading
      </p>
    );
  }

  const example = tagUsageExample(tags, portal.items);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
      <div className="rounded-lg border border-white/10 bg-[#141414] p-4">
        <form
          className="flex items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onAdd();
          }}
        >
          <input
            aria-label="Tag name"
            placeholder="Add a tag"
            value={draft}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-md border border-white/15 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/30 focus-visible:border-white/40 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="h-10 shrink-0 rounded-md bg-white/10 px-4 text-xs font-semibold tracking-wide text-white/80 uppercase hover:bg-white/20 disabled:opacity-40"
          >
            Add
          </button>
        </form>
        {error ? <p className="text-error mt-3 text-sm">{error}</p> : null}
        <ul className="mt-2 divide-y divide-white/10">
          {tags.map((tag) => {
            const label = leadTagLabel(tag);
            const color = leadTagColor(tag, colors[tag]);
            const open = editing === tag;
            return (
              <li key={tag} className="flex items-center gap-3 py-3">
                {open ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void onRename(tag);
                    }}
                  >
                    <Input
                      aria-label={`Rename ${label}`}
                      value={editDraft}
                      disabled={busy}
                      onChange={(event) => setEditDraft(event.target.value)}
                      className="h-10 rounded-md border border-white/15 px-3 py-2"
                    />
                    <Button type="submit" size="sm" disabled={busy}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <Popover
                      open={openColor === tag}
                      onOpenChange={(next) => setOpenColor(next ? tag : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Color for ${label}`}
                          disabled={busy}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md disabled:opacity-60"
                        >
                          <span
                            aria-hidden
                            className={cn("size-2.5 rounded-full", color.dot)}
                          />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="border-white/10 bg-[#1c1c1c] w-auto p-2"
                      >
                        <div
                          role="group"
                          aria-label={`${label} colors`}
                          className="flex gap-1.5"
                        >
                          {LEAD_TAG_PALETTE.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              aria-label={entry.label}
                              aria-pressed={color.id === entry.id}
                              disabled={busy}
                              onClick={() => void onRecolor(tag, entry.id)}
                              className="inline-flex size-7 items-center justify-center rounded-md"
                            >
                              <span
                                aria-hidden
                                className={cn("size-3.5 rounded-full", entry.dot)}
                              />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <span className="min-w-0 flex-1 text-sm text-white">
                      {label}
                    </span>
                    <button
                      type="button"
                      aria-label={`Rename ${label}`}
                      disabled={busy}
                      onClick={() => startEdit(tag)}
                      className="text-white/35 hover:text-white inline-flex size-8 items-center justify-center rounded-md disabled:opacity-60"
                    >
                      <MaterialIcon name="edit" className="text-lg" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${label}`}
                      disabled={busy}
                      onClick={() => void onRemove(tag)}
                      className="text-white/35 hover:text-white inline-flex size-8 items-center justify-center rounded-md disabled:opacity-60"
                    >
                      <MaterialIcon name="delete" className="text-lg" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <TagUsageExampleCard example={example} colors={colors} />
    </div>
  );
}

function TagUsageExampleCard({
  example,
  colors,
}: {
  example: TagUsageExample;
  colors: Record<string, string>;
}) {
  return (
    <aside
      aria-label="Lead"
      className="rounded-lg border border-white/10 bg-[#141414] p-5"
    >
      <p className="text-[10px] font-medium tracking-[0.22em] text-white/40 uppercase">
        Lead
      </p>
      <p className="mt-4 text-lg font-semibold text-white">{example.name}</p>
      {example.email ? (
        <p className="text-sm text-white/50">{example.email}</p>
      ) : null}
      {example.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {example.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "inline-flex h-7 items-center rounded-md px-2.5 text-sm leading-none font-medium",
                leadTagColor(tag, colors[tag]).pill,
              )}
            >
              {leadTagLabel(tag)}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-5 space-y-1.5 text-sm">
        {example.source ? (
          <p>
            <span className="text-white/45">Source </span>
            <span className="text-white/80">{example.source}</span>
          </p>
        ) : null}
        <p>
          <span className="text-white/45">Stage </span>
          <span className="text-white/80">{example.stage}</span>
        </p>
      </div>
    </aside>
  );
}
