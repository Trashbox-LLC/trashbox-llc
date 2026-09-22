"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalSkeleton } from "@/components/features/portal/PortalSkeleton";
import { ApiError, listEmailSnippets, updateEmailSnippet } from "@/lib/api";
import { portalNavigate, portalSearchParam } from "@/lib/portal-routes";
import { settingsSectionPath } from "@/lib/portal-settings";
import {
  SnippetBuilder,
  type SnippetBuilderSavePayload,
} from "./SnippetBuilder";

function SnippetBuilderEditInner() {
  const searchParams = useSearchParams();
  const routerId = searchParams.get("id")?.trim() ?? "";
  const [id, setId] = useState(() =>
    typeof window === "undefined" ? "" : portalSearchParam("id", routerId),
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [body, setBody] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  useEffect(() => {
    const next = portalSearchParam("id", routerId);
    setId((current) => (current === next ? current : next));
  }, [routerId]);

  function goList() {
    portalNavigate(settingsSectionPath("snippets"));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        setError("Missing snippet id.");
        setLoading(false);
        return;
      }
      setError(null);
      try {
        const { items } = await listEmailSnippets();
        const item = items.find((snippet) => snippet.id === id);
        if (!item) {
          if (!cancelled) {
            setError("Snippet not found.");
            setLoading(false);
          }
          return;
        }
        if (cancelled) return;
        setName(item.name);
        setShortcut(item.shortcut);
        setBody(item.bodyText);
        setBodyHtml(item.bodyHtml ?? "");
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not load snippet",
        );
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onSave(payload: SnippetBuilderSavePayload) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await updateEmailSnippet(id, {
        name: payload.name,
        shortcut: payload.shortcut || null,
        bodyText: payload.bodyText,
        bodyHtml: payload.bodyHtml,
      });
      goList();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save snippet",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PortalSkeleton />;

  if (error && !name) {
    return (
      <div className="border border-error/40 bg-error/10 p-6 text-sm text-error">
        <p>{error}</p>
        <button type="button" className="mt-4 underline" onClick={goList}>
          Back
        </button>
      </div>
    );
  }

  return (
    <SnippetBuilder
      key={id}
      initialName={name}
      initialShortcut={shortcut}
      initialBody={body}
      initialHtml={bodyHtml}
      busy={busy}
      error={error}
      onSave={onSave}
      onCancel={goList}
    />
  );
}

export function SnippetBuilderEditPage() {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <SnippetBuilderEditInner />
    </Suspense>
  );
}
