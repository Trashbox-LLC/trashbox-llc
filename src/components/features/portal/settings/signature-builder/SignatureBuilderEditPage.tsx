"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalSkeleton } from "@/components/features/portal/PortalSkeleton";
import { ApiError, listEmailSignatures, updateEmailSignature } from "@/lib/api";
import {
  createSignatureDocument,
  parseSignatureDocument,
  type SignatureDocument,
} from "@/lib/email-signature-document";
import { portalNavigate, portalSearchParam } from "@/lib/portal-routes";
import { settingsSectionPath } from "@/lib/portal-settings";
import {
  SignatureBuilder,
  type SignatureBuilderSavePayload,
} from "./SignatureBuilder";

function SignatureBuilderEditInner() {
  const searchParams = useSearchParams();
  const routerId = searchParams.get("id")?.trim() ?? "";
  const [id, setId] = useState(() =>
    typeof window === "undefined" ? "" : portalSearchParam("id", routerId),
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [document, setDocument] = useState<SignatureDocument>(
    createSignatureDocument,
  );

  useEffect(() => {
    const next = portalSearchParam("id", routerId);
    setId((current) => (current === next ? current : next));
  }, [routerId]);

  function goList() {
    portalNavigate(settingsSectionPath("signatures"));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        setError("Missing signature id.");
        setLoading(false);
        return;
      }
      setError(null);
      try {
        const { items } = await listEmailSignatures();
        const item = items.find((signature) => signature.id === id);
        if (!item) {
          if (!cancelled) {
            setError("Signature not found.");
            setLoading(false);
          }
          return;
        }
        if (cancelled) return;
        setName(item.name);
        setIsDefault(item.isDefault);
        setDocument(
          parseSignatureDocument({
            bodyHtml: item.bodyHtml,
            bodyText: item.bodyText,
          }),
        );
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not load signature",
        );
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onSave(payload: SignatureBuilderSavePayload) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await updateEmailSignature(id, {
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
    <SignatureBuilder
      key={id}
      initialName={name}
      initialDocument={document}
      initialIsDefault={isDefault}
      busy={busy}
      error={error}
      onSave={onSave}
      onCancel={goList}
    />
  );
}

export function SignatureBuilderEditPage() {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <SignatureBuilderEditInner />
    </Suspense>
  );
}
