"use client";

import { useState } from "react";
import { ApiError, createEmailSignature } from "@/lib/api";
import { createSignatureDocument } from "@/lib/email-signature-document";
import { portalNavigate } from "@/lib/portal-routes";
import { settingsSectionPath } from "@/lib/portal-settings";
import {
  SignatureBuilder,
  type SignatureBuilderSavePayload,
} from "./SignatureBuilder";

export function SignatureBuilderCreatePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goList() {
    portalNavigate(settingsSectionPath("signatures"));
  }

  async function onSave(payload: SignatureBuilderSavePayload) {
    setBusy(true);
    setError(null);
    try {
      await createEmailSignature({
        name: payload.name,
        bodyText: payload.bodyText,
        bodyHtml: payload.bodyHtml,
        isDefault: payload.isDefault,
      });
      goList();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save signature",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SignatureBuilder
      initialDocument={createSignatureDocument()}
      busy={busy}
      error={error}
      onSave={onSave}
      onCancel={goList}
    />
  );
}
