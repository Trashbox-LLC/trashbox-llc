"use client";

import { useCallback, useEffect, useState } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApiError,
  createProjectTag,
  deleteProjectTag,
  leadTagLabel,
  listProjectTags,
  renameProjectTag,
} from "@/lib/api";
import { usePortal } from "@/lib/portal";

export type TagsSettingsInitialState = {
  tags: string[];
};

interface TagsSettingsProps {
  /** When set, skip the network load (Storybook and tests). */
  initialState?: TagsSettingsInitialState;
}

export function TagsSettings({ initialState }: TagsSettingsProps) {
  const portal = usePortal();
  const [tags, setTags] = useState<string[]>(initialState?.tags ?? []);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(Boolean(initialState));
  const [error, setError] = useState<string | null>(null);

  const setLeadTags = portal.setLeadTags;
  const rewriteLeadTag = portal.rewriteLeadTag;
  const publish = useCallback(
    (next: string[]) => {
      setTags(next);
      setLeadTags(next);
    },
    [setLeadTags],
  );

  useEffect(() => {
    if (initialState) return;
    let cancelled = false;
    async function run() {
      setReady(false);
      setError(null);
      try {
        const data = await listProjectTags();
        if (!cancelled) publish(data.tags);
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
      const result = await createProjectTag(name);
      publish(result.tags);
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
      publish(result.tags);
      rewriteLeadTag(from, to);
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not rename tag");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(tag: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await deleteProjectTag(tag);
      publish(result.tags);
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

  return (
    <div className="border-outline-variant/10 bg-surface-container-low space-y-6 border p-6 md:p-8">
      <form
        className="flex items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void onAdd();
        }}
      >
        <div className="min-w-0 flex-1">
          <Input
            aria-label="Tag name"
            value={draft}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            className="py-2"
          />
        </div>
        <Button type="submit" disabled={busy || !draft.trim()}>
          Add
        </Button>
      </form>
      {error ? <p className="text-error text-sm">{error}</p> : null}
      <ul className="divide-y divide-white/10">
        {tags.map((tag) => {
          const label = leadTagLabel(tag);
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
                    className="py-2"
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
                  <span className="min-w-0 flex-1 text-sm text-white">{label}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label={`Rename ${label}`}
                    disabled={busy}
                    onClick={() => startEdit(tag)}
                  >
                    Rename
                  </Button>
                  <button
                    type="button"
                    aria-label={`Remove ${label}`}
                    disabled={busy}
                    onClick={() => void onRemove(tag)}
                    className="text-outline hover:text-white inline-flex size-8 items-center justify-center rounded-md disabled:opacity-60"
                  >
                    <MaterialIcon name="close" className="text-lg" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
