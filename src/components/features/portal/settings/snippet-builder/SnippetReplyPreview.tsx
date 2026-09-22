"use client";

import {
  renderTemplateVariables,
  snippetReplyParts,
  withPreviewSamples,
  type TemplateVariableContext,
} from "@/lib/email-content";
interface SnippetReplyPreviewProps {
  bodyText: string;
  bodyHtml?: string;
  previewContext?: TemplateVariableContext;
  /** Prefix the passage with a sample greeting, as it lands in a reply. */
  inserted?: boolean;
}

const passageClass =
  "text-sm leading-relaxed text-white [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5";

export function SnippetReplyPreview({
  bodyText,
  bodyHtml,
  previewContext,
  inserted = false,
}: SnippetReplyPreviewProps) {
  const parts = snippetReplyParts(bodyText, previewContext);
  const html = bodyHtml?.trim()
    ? renderTemplateVariables(bodyHtml, withPreviewSamples(previewContext))
    : "";

  return (
    <section
      aria-label="In a reply"
      className="border border-outline-variant/20 bg-surface-container-low p-5"
    >
      <h3 className="text-sm font-medium text-white">In a reply</h3>
      <div className="mt-5 flex items-center gap-3">
        <span className="text-sm text-outline">To:</span>
        <div className="min-w-0 flex-1 border border-outline-variant/30 bg-background px-3 py-2 text-sm text-white">
          {parts.to}
        </div>
      </div>
      <div className="mt-5 text-sm leading-relaxed whitespace-pre-line text-white">
        {inserted ? <span>{parts.greeting} </span> : null}
        {html ? (
          <div
            className={passageClass}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          parts.body
        )}
      </div>
    </section>
  );
}
