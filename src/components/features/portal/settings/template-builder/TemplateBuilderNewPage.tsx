"use client";

import { useEffect, useState } from "react";
import {
  EmailTemplateGallery,
  type EmailTemplateGallerySavedItem,
} from "@/components/features/portal/settings/EmailTemplateGallery";
import { listEmailTemplates, createEmailTemplate, deleteEmailTemplate, type EmailTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createBlockId,
  emptyDocument,
} from "@/lib/email-template-document";
import type { EmailTemplateStarter } from "@/lib/email-template-starters";
import { portalNavigate } from "@/lib/portal-routes";
import {
  TEMPLATE_BUILDER_DRAFT_STORAGE_KEY,
  settingsSectionPath,
  templateBuilderCreatePath,
  templateBuilderEditPath,
} from "@/lib/portal-settings";
import { EMAIL_CONTENT_LIMITS } from "@/lib/email-content";

/**
 * Starter gallery only — selecting a template opens the full-page builder.
 */
export function TemplateBuilderNewPage({
  showClose = true,
}: {
  showClose?: boolean;
} = {}): React.ReactElement {
  const [htmlSourceOpen, setHtmlSourceOpen] = useState(false);
  const [pastedSource, setPastedSource] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listEmailTemplates()
      .then((response) => {
        if (cancelled) return;
        setSavedTemplates(response.items);
      })
      .catch(() => {
        if (!cancelled) setSavedTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function goList() {
    portalNavigate(settingsSectionPath("templates"));
  }

  function selectStarter(starter: EmailTemplateStarter) {
    portalNavigate(templateBuilderCreatePath({ starterId: starter.id }));
  }

  function selectSaved(template: EmailTemplateGallerySavedItem) {
    portalNavigate(templateBuilderEditPath(template.id));
  }

  async function duplicateSaved(template: EmailTemplateGallerySavedItem) {
    const source = savedTemplates.find((item) => item.id === template.id);
    if (!source) return;
    setActionError(null);
    try {
      const created = await createEmailTemplate({
        name: `${source.name} (copy)`.slice(0, EMAIL_CONTENT_LIMITS.name),
        subject: source.subject,
        bodyText: source.bodyText,
        bodyHtml: source.bodyHtml ?? null,
      });
      portalNavigate(templateBuilderEditPath(created.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not copy template");
    }
  }

  async function removeSaved(template: EmailTemplateGallerySavedItem) {
    setActionError(null);
    try {
      await deleteEmailTemplate(template.id);
      setSavedTemplates((current) =>
        current.filter((item) => item.id !== template.id),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete template",
      );
    }
  }

  function applyPastedSource() {
    const value = pastedSource.trim();
    if (!value) return;
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(value);
    const document = {
      ...emptyDocument(),
      blocks: [
        {
          id: createBlockId(),
          type: (looksLikeHtml ? "html" : "text") as "html" | "text",
          html: looksLikeHtml
            ? value
            : value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br />"),
        },
      ],
    };
    try {
      sessionStorage.setItem(
        TEMPLATE_BUILDER_DRAFT_STORAGE_KEY,
        JSON.stringify({
          name: looksLikeHtml ? "Custom HTML" : "Custom text",
          subject: "",
          document,
        }),
      );
    } catch {
      // Fall through to blank builder if storage is unavailable.
    }
    portalNavigate(templateBuilderCreatePath({ draft: true }));
  }

  if (htmlSourceOpen) {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-6 md:p-10">
        <div
          role="dialog"
          aria-label="Insert HTML or plain text"
          className="mx-auto w-full max-w-3xl space-y-4 border border-outline-variant/20 bg-surface-container-low p-4 md:p-6"
        >
          <Label className="mb-0">Insert HTML / Plain Text</Label>
          <p className="text-sm text-on-surface-variant">
            Paste HTML for a custom layout, or plain text. Continues on the
            full-page builder.
          </p>
          <Textarea
            aria-label="HTML or plain text"
            value={pastedSource}
            onChange={(event) => setPastedSource(event.target.value)}
            rows={10}
            className="min-h-40 font-mono text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={!pastedSource.trim()}
              onClick={applyPastedSource}
            >
              Continue to builder
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setHtmlSourceOpen(false)}
            >
              Back to gallery
            </Button>
            <Button type="button" variant="ghost" onClick={goList}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-4 md:p-6">
      <EmailTemplateGallery
        mode="create"
        className="min-h-0 flex-1"
        savedTemplates={savedTemplates.map((template) => ({
          id: template.id,
          name: template.name,
          subject: template.subject,
          bodyHtml: template.bodyHtml,
        }))}
        onSelectStarter={selectStarter}
        onSelectSaved={selectSaved}
        onDuplicateSaved={(template) => {
          void duplicateSaved(template);
        }}
        onDeleteSaved={(template) => {
          void removeSaved(template);
        }}
        onInsertHtmlPlainText={() => setHtmlSourceOpen(true)}
        onClose={showClose ? goList : undefined}
      />
      {actionError ? (
        <p className="px-4 pb-4 text-sm text-error">{actionError}</p>
      ) : null}
    </div>
  );
}
