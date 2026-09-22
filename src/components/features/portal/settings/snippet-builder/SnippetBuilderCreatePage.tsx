"use client";

import { useState } from "react";
import { ApiError, createEmailSnippet } from "@/lib/api";
import { portalNavigate } from "@/lib/portal-routes";
import { settingsSectionPath } from "@/lib/portal-settings";
import {
  SnippetBuilder,
  type SnippetBuilderSavePayload,
} from "./SnippetBuilder";

export function SnippetBuilderCreatePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goList() {
    portalNavigate(settingsSectionPath("snippets"));
  }

  async function onSave(payload: SnippetBuilderSavePayload) {
    setBusy(true);
    setError(null);
    try {
      await createEmailSnippet({
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

  return (
    <SnippetBuilder
      busy={busy}
      error={error}
      onSave={onSave}
      onCancel={goList}
    />
  );
}
