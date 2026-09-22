"use client";

import { renderPreviewTemplate } from "@/lib/email-content";
import { documentToEmailHtml } from "@/lib/email-template-document";
import type { EmailTemplateDocument } from "@/lib/email-template-document";
import { cn } from "@/lib/utils";

/** Preview-only stage (not part of emailed HTML). Matches editor canvas chrome. */
const PREVIEW_STAGE_BG = "#e8e8ec";

export interface BuilderPreviewProps {
  document: EmailTemplateDocument;
  /** When set, render this HTML instead of serializing `document`. */
  htmlOverride?: string;
  className?: string;
}

function wrapPreviewSrcDoc(html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;min-height:100%;background:${PREVIEW_STAGE_BG};}
.tb-preview-stage{box-sizing:border-box;padding:24px 16px 48px;min-height:100%;}
.tb-preview-stage>[data-tb-doc]{max-width:600px;margin:0 auto;box-shadow:0 8px 30px rgba(0,0,0,0.12);}
</style></head><body><div class="tb-preview-stage">${html}</div></body></html>`;
}

export function BuilderPreview({
  document: doc,
  htmlOverride,
  className,
}: BuilderPreviewProps): React.ReactElement {
  const html = renderPreviewTemplate(htmlOverride ?? documentToEmailHtml(doc));
  return (
    <iframe
      title="Template preview"
      sandbox=""
      srcDoc={wrapPreviewSrcDoc(html)}
      className={cn("h-full min-h-[480px] w-full border-0 bg-[#e8e8ec]", className)}
    />
  );
}
