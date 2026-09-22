"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalSkeleton } from "@/components/features/portal/PortalSkeleton";
import {
  EmailTemplateBuilder,
  type EmailTemplateBuilderSavePayload,
} from "@/components/features/portal/settings/template-builder/EmailTemplateBuilder";
import { ApiError, createEmailTemplate } from "@/lib/api";
import {
  defaultDocument,
  documentFromStarter,
  type EmailTemplateDocument,
} from "@/lib/email-template-document";
import { getStarterById } from "@/lib/email-template-starters";
import { portalNavigate, portalSearchParam } from "@/lib/portal-routes";
import {
  TEMPLATE_BUILDER_DRAFT_STORAGE_KEY,
  settingsSectionPath,
  templateBuilderNewPath,
  type TemplateBuilderDraftPayload,
} from "@/lib/portal-settings";

function readDraft(): TemplateBuilderDraftPayload | null {
  try {
    const raw = sessionStorage.getItem(TEMPLATE_BUILDER_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(TEMPLATE_BUILDER_DRAFT_STORAGE_KEY);
    return JSON.parse(raw) as TemplateBuilderDraftPayload;
  } catch {
    return null;
  }
}

function resolveInitial(
  starterId: string,
  useDraft: boolean,
): {
  name: string;
  subject: string;
  document: EmailTemplateDocument;
} {
  if (useDraft && typeof window !== "undefined") {
    const draft = readDraft();
    if (draft?.document && typeof draft.document === "object") {
      return {
        name: draft.name ?? "",
        subject: draft.subject ?? "",
        document: draft.document as EmailTemplateDocument,
      };
    }
  }
  if (starterId) {
    const starter = getStarterById(starterId);
    if (starter) {
      return {
        name: starter.name === "Blank" ? "" : starter.name,
        subject: starter.subject ?? "",
        document: documentFromStarter(starter),
      };
    }
  }
  return { name: "", subject: "", document: defaultDocument() };
}

function readCreateQuery(
  routerStarter: string,
  routerDraft: boolean,
): {
  starterId: string;
  useDraft: boolean;
} {
  return {
    starterId: portalSearchParam("starter", routerStarter),
    useDraft:
      portalSearchParam("draft", routerDraft ? "1" : "") === "1" || routerDraft,
  };
}

function TemplateBuilderCreateInner(): React.ReactElement {
  const searchParams = useSearchParams();
  const routerStarter = searchParams.get("starter")?.trim() ?? "";
  const routerDraft = searchParams.get("draft") === "1";
  const [query, setQuery] = useState(() =>
    typeof window === "undefined"
      ? null
      : readCreateQuery(routerStarter, routerDraft),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = readCreateQuery(routerStarter, routerDraft);
    setQuery((current) =>
      current &&
      current.starterId === next.starterId &&
      current.useDraft === next.useDraft
        ? current
        : next,
    );
  }, [routerDraft, routerStarter]);

  const initial = useMemo(
    () =>
      query
        ? resolveInitial(query.starterId, query.useDraft)
        : { name: "", subject: "", document: defaultDocument() },
    [query],
  );

  if (!query) return <PortalSkeleton />;

  function goList() {
    portalNavigate(settingsSectionPath("templates"));
  }

  function goGallery() {
    portalNavigate(templateBuilderNewPath());
  }

  async function onSave(payload: EmailTemplateBuilderSavePayload) {
    setBusy(true);
    setError(null);
    try {
      await createEmailTemplate({
        name: payload.name,
        subject: payload.subject,
        bodyText: payload.bodyText,
        bodyHtml: payload.bodyHtml,
      });
      goList();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save template";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <EmailTemplateBuilder
      key={`${query.starterId}-${query.useDraft ? "draft" : "starter"}`}
      initialName={initial.name}
      initialSubject={initial.subject}
      initialDocument={initial.document}
      busy={busy}
      error={error}
      onSave={onSave}
      onCancel={query.starterId || query.useDraft ? goGallery : goList}
      className="h-full min-h-0 border-0"
    />
  );
}

export function TemplateBuilderCreatePage(): React.ReactElement {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <TemplateBuilderCreateInner />
    </Suspense>
  );
}
