"use client";

import { useMemo, useRef, useState } from "react";
import {
  RichTextEditor,
  type RichTextValue,
} from "@/components/atoms/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EMAIL_CONTENT_LIMITS,
  TEMPLATE_VARIABLES,
  contentBodyToHtml,
  plainTextToHtml,
  renderTemplateVariables,
  sanitizeShortcutInput,
  unknownTemplateVariables,
  withPreviewSamples,
  type TemplateVariableContext,
} from "@/lib/email-content";
import {
  parseSignatureDocument,
  signaturePreviewLines,
} from "@/lib/email-signature-document";
import {
  SettingsHeaderAction,
  useHasSettingsHeader,
} from "@/components/features/portal/settings/SettingsShell";
import {
  settingsSectionPath,
  signatureBuilderEditPath,
  signatureBuilderNewPath,
  templateBuilderEditPath,
  templateBuilderNewPath,
} from "@/lib/portal-settings";

export type EmailContentKind = "template" | "signature" | "snippet";

/**
 * Structural superset of `EmailTemplate`, `EmailSignature` and `EmailSnippet`
 * so the three settings sections can share one presentation layer.
 */
export interface EmailContentEntry {
  id: string;
  name: string;
  bodyText: string;
  bodyHtml?: string;
  updatedAt: string;
  subject?: string;
  shortcut?: string;
  isDefault?: boolean;
}

export interface EmailContentDraft {
  name: string;
  subject: string;
  shortcut: string;
  bodyText: string;
  bodyHtml: string;
  isDefault: boolean;
}

export interface EmailContentSettingsProps {
  kind: EmailContentKind;
  items: EmailContentEntry[];
  canManage?: boolean;
  busy?: boolean;
  error?: string | null;
  /** Values used to resolve merge fields in the preview. */
  previewContext?: TemplateVariableContext;
  onCreate: (draft: EmailContentDraft) => Promise<void>;
  onUpdate: (id: string, draft: EmailContentDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Signatures only — promotes one entry to the account default. */
  onMakeDefault?: (id: string) => Promise<void>;
}

interface KindCopy {
  label: string;
  heading: string;
  description: string;
  bodyPlaceholder: string;
  empty: string;
}

const KIND_COPY: Record<EmailContentKind, KindCopy> = {
  template: {
    label: "template",
    heading: "Email Templates",
    description:
      "Saved replies your team can load while answering a lead. A template fills in both the subject and the body, and merge fields are resolved against the lead you are replying to.",
    bodyPlaceholder: "Hi {{lead.first_name}}, thanks for reaching out…",
    empty: "No templates yet.",
  },
  signature: {
    label: "signature",
    heading: "Signatures",
    description: "",
    bodyPlaceholder: "Thanks,\n{{sender.name}} — {{business.name}}",
    empty: "No signatures yet.",
  },
  snippet: {
    label: "snippet",
    heading: "Snippets",
    description:
      "Short passages your team drops into a reply — pricing, hours, directions. Give a snippet a shortcut to insert it by name while composing.",
    bodyPlaceholder: "We are open 8am to 5pm, Monday through Friday.",
    empty: "No snippets yet.",
  },
};

const EMPTY_DRAFT: EmailContentDraft = {
  name: "",
  subject: "",
  shortcut: "",
  bodyText: "",
  bodyHtml: "",
  isDefault: false,
};

interface FormState {
  /** Existing entry being edited, or null when creating. */
  editingId: string | null;
  /** Stable seed for the uncontrolled editor; only set when the form opens. */
  seedHtml: string;
  seedKey: number;
  draft: EmailContentDraft;
}

function draftFromEntry(entry: EmailContentEntry): EmailContentDraft {
  return {
    name: entry.name,
    subject: entry.subject ?? "",
    shortcut: entry.shortcut ?? "",
    bodyText: entry.bodyText,
    bodyHtml: entry.bodyHtml ?? "",
    isDefault: entry.isDefault ?? false,
  };
}

function formatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

const actionClass = "h-auto px-0 py-0 font-label text-[10px]";

export function EmailContentSettings({
  kind,
  items,
  canManage = false,
  busy = false,
  error,
  previewContext,
  onCreate,
  onUpdate,
  onDelete,
  onMakeDefault,
}: EmailContentSettingsProps) {
  const copy = KIND_COPY[kind];
  const [form, setForm] = useState<FormState | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [seedCounter, setSeedCounter] = useState(0);

  const context = withPreviewSamples(previewContext);
  const usesBuilder = kind === "template" || kind === "signature";

  function builderNewPath(): string {
    return kind === "signature"
      ? signatureBuilderNewPath()
      : templateBuilderNewPath();
  }

  function builderEditPath(id: string): string {
    return kind === "signature"
      ? signatureBuilderEditPath(id)
      : templateBuilderEditPath(id);
  }

  function openForm(editingId: string | null, draft: EmailContentDraft) {
    const nextKey = seedCounter + 1;
    setSeedCounter(nextKey);
    setForm({
      editingId,
      seedHtml: draft.bodyHtml || plainTextToHtml(draft.bodyText),
      seedKey: nextKey,
      draft,
    });
  }

  function startNew() {
    if (usesBuilder) return;
    openForm(null, EMPTY_DRAFT);
  }

  function updateDraft(patch: Partial<EmailContentDraft>) {
    setForm((current) =>
      current ? { ...current, draft: { ...current.draft, ...patch } } : current,
    );
  }

  function onBodyChange(value: RichTextValue) {
    updateDraft({ bodyText: value.text, bodyHtml: value.html });
  }

  async function save() {
    if (!form) return;
    const draft: EmailContentDraft = {
      ...form.draft,
      name: form.draft.name.trim(),
      subject: form.draft.subject.trim(),
      bodyText: form.draft.bodyText.trim(),
    };
    if (form.editingId) await onUpdate(form.editingId, draft);
    else await onCreate(draft);
    setForm(null);
  }

  function confirmDelete(entry: EmailContentEntry) {
    const ok = window.confirm(
      `Delete the ${copy.label} “${entry.name}”? This cannot be undone.`,
    );
    if (!ok) return;
    void onDelete(entry.id);
  }

  async function duplicateTemplate(entry: EmailContentEntry) {
    const draft = {
      ...draftFromEntry(entry),
      name: `${entry.name} (copy)`.slice(0, EMAIL_CONTENT_LIMITS.name),
      shortcut: "",
      isDefault: false,
    };
    await onCreate(draft);
  }

  const unknownTokens = form
    ? unknownTemplateVariables(`${form.draft.subject} ${form.draft.bodyText}`)
    : [];
  const canSave =
    Boolean(form?.draft.name.trim()) && Boolean(form?.draft.bodyText.trim());
  const inSettingsHeader = useHasSettingsHeader();
  const startNewRef = useRef(startNew);
  startNewRef.current = startNew;
  const newHref = usesBuilder ? builderNewPath() : "";
  const newButton = useMemo(() => {
    if (!canManage) return null;
    if (usesBuilder) {
      return (
        <Button type="button" variant="outline" disabled={busy} asChild>
          <a href={newHref}>New {copy.label}</a>
        </Button>
      );
    }
    return (
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => startNewRef.current()}
      >
        New {copy.label}
      </Button>
    );
  }, [busy, canManage, copy.label, newHref, usesBuilder]);

  return (
    <>
      {kind === "signature" &&
        (inSettingsHeader ? (
          <SettingsHeaderAction>{newButton}</SettingsHeaderAction>
        ) : (
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="font-headline text-2xl font-bold tracking-tight text-white md:text-3xl">
              {copy.heading}
            </h2>
            {newButton}
          </div>
        ))}
      <div className="space-y-8 border border-outline-variant/10 bg-surface-container-low p-6 md:p-8">
      {kind !== "signature" && (
        <div>
          <Label>{copy.heading}</Label>
          {copy.description && (
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              {copy.description}{" "}
              <a
                href={settingsSectionPath("email-accounts")}
                className="text-white underline"
              >
                A connected mailbox
              </a>{" "}
              is required to send replies.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="border border-error/40 bg-error/10 p-4 text-sm text-error">
          {error}
        </p>
      )}

      {kind !== "signature" && (
        <section>
          <Label>Merge fields</Label>
          <p className="mt-2 text-sm text-on-surface-variant">
            Type these anywhere in a subject or body. They are replaced when the
            content is inserted into a reply.
          </p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {TEMPLATE_VARIABLES.map((variable) => (
              <li key={variable.token} className="text-sm">
                <code className="font-mono text-xs text-white">
                  {variable.token}
                </code>
                <span className="ml-2 text-on-surface-variant">
                  {variable.description}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        {kind !== "signature" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label className="mb-0">Saved {copy.label}s</Label>
            {newButton}
          </div>
        )}

        <ul
          className={`divide-y divide-outline-variant/10 border-y border-outline-variant/10${kind === "signature" ? "" : " mt-4"}`}
        >
          {items.length === 0 && (
            <li className="py-4 text-sm text-on-surface-variant">
              {copy.empty}
            </li>
          )}
          {items.map((entry) => {
            const renderedSubject = entry.subject
              ? renderTemplateVariables(entry.subject, context)
              : "";
            return (
              <li key={entry.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-white">
                      {entry.name}
                      {entry.isDefault && (
                        <span className="border border-outline-variant/30 px-2 py-0.5 font-label text-[9px] uppercase tracking-widest text-outline">
                          Default
                        </span>
                      )}
                      {entry.shortcut && (
                        <code className="font-mono text-xs text-outline">
                          /{entry.shortcut}
                        </code>
                      )}
                    </p>
                    {entry.subject !== undefined && entry.subject !== "" && (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {entry.subject}
                      </p>
                    )}
                    <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-outline">
                      Updated {formatUpdated(entry.updatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {kind !== "signature" && (
                      <Button
                        type="button"
                        variant="link"
                        disabled={busy}
                        onClick={() =>
                          setPreviewId((id) =>
                            id === entry.id ? null : entry.id,
                          )
                        }
                        className={actionClass}
                      >
                        Preview
                      </Button>
                    )}
                    {canManage && (
                      <>
                        {usesBuilder ? (
                          <Button
                            type="button"
                            variant="link"
                            disabled={busy}
                            asChild
                            className={actionClass}
                          >
                            <a href={builderEditPath(entry.id)}>Edit</a>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="link"
                            disabled={busy}
                            onClick={() =>
                              openForm(entry.id, draftFromEntry(entry))
                            }
                            className={actionClass}
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="link"
                          disabled={busy}
                          onClick={() => {
                            if (usesBuilder) {
                              void duplicateTemplate(entry);
                              return;
                            }
                            openForm(null, {
                              ...draftFromEntry(entry),
                              name: `${entry.name} (copy)`,
                              shortcut: "",
                              isDefault: false,
                            });
                          }}
                          className={actionClass}
                        >
                          Duplicate
                        </Button>
                        {onMakeDefault && !entry.isDefault && (
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void onMakeDefault(entry.id)}
                            className={`${actionClass} text-white`}
                          >
                            Make default
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => confirmDelete(entry)}
                          className={`${actionClass} text-error hover:text-error`}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {kind === "signature" && (
                  <SignatureSavedPreview entry={entry} context={context} />
                )}

                {kind !== "signature" && previewId === entry.id && (
                  <div className="mt-3 border border-outline-variant/20 bg-background/40 p-4">
                    <p className="font-label text-[10px] uppercase tracking-widest text-outline">
                      Preview with sample values
                    </p>
                    {renderedSubject && (
                      <p className="mt-2 text-sm text-white">
                        {renderedSubject}
                      </p>
                    )}
                    <iframe
                      title={`Preview of ${entry.name}`}
                      sandbox=""
                      srcDoc={renderTemplateVariables(
                        contentBodyToHtml(entry),
                        context,
                      )}
                      className="mt-2 h-48 w-full border border-outline-variant/15 bg-white"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!canManage && (
          <p className="mt-4 text-sm text-on-surface-variant">
            You need Manage Email Templates, Signatures And Snippets to add or
            change saved {copy.label}s.
          </p>
        )}
      </section>

      {form && !usesBuilder && (
        <form
          className="space-y-4 border border-outline-variant/20 bg-background/40 p-4 md:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Label className="mb-0">
            {form.editingId ? `Edit ${copy.label}` : `New ${copy.label}`}
          </Label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email-content-name">Name</Label>
              <Input
                id="email-content-name"
                value={form.draft.name}
                onChange={(event) => updateDraft({ name: event.target.value })}
                disabled={busy}
                maxLength={EMAIL_CONTENT_LIMITS.name}
                placeholder={`Internal name for this ${copy.label}`}
                className="py-2"
              />
            </div>

            {kind === "snippet" && (
              <div>
                <Label htmlFor="email-content-shortcut">Shortcut</Label>
                <Input
                  id="email-content-shortcut"
                  value={form.draft.shortcut}
                  onChange={(event) =>
                    updateDraft({
                      shortcut: sanitizeShortcutInput(event.target.value),
                    })
                  }
                  disabled={busy}
                  maxLength={EMAIL_CONTENT_LIMITS.shortcut}
                  placeholder="hours"
                  className="py-2"
                />
                <p className="mt-1 text-xs text-outline">
                  Optional. Lowercase letters, numbers, hyphens and underscores.
                </p>
              </div>
            )}
          </div>

          <div>
            <Label>Body</Label>
            <RichTextEditor
              key={form.seedKey}
              ariaLabel="Body"
              placeholder={copy.bodyPlaceholder}
              initialHtml={form.seedHtml}
              disabled={busy}
              onChange={onBodyChange}
            />
          </div>

          {kind === "signature" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="email-content-default"
                checked={form.draft.isDefault}
                disabled={busy}
                onCheckedChange={(checked) =>
                  updateDraft({ isDefault: checked === true })
                }
              />
              <Label htmlFor="email-content-default" className="mb-0">
                Use as the account default
              </Label>
            </div>
          )}

          {unknownTokens.length > 0 && (
            <p className="text-sm text-on-surface-variant">
              {unknownTokens.map((token) => (
                <code key={token} className="mr-2 font-mono text-xs text-white">
                  {token}
                </code>
              ))}
              {unknownTokens.length === 1
                ? "is not a supported merge field and will be sent exactly as typed."
                : "are not supported merge fields and will be sent exactly as typed."}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy || !canSave}>
              Save {copy.label}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setForm(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
    </>
  );
}

function SignatureSavedPreview({
  entry,
  context,
}: {
  entry: EmailContentEntry;
  context: TemplateVariableContext;
}) {
  const doc = parseSignatureDocument({
    bodyHtml: entry.bodyHtml,
    bodyText: entry.bodyText,
  });
  const lines = signaturePreviewLines(doc, context);
  const layoutClass =
    doc.layout === "banner"
      ? "flex items-center gap-3"
      : doc.layout === "stacked"
        ? "flex flex-col items-start gap-3"
        : "flex items-center gap-4";

  return (
    <div
      role="region"
      aria-label={`Preview of ${entry.name}`}
      className={`mt-3 border border-outline-variant/20 bg-background p-4 text-sm text-white ${layoutClass}`}
    >
      {doc.logoUrl ? (
        <img
          src={doc.logoUrl}
          alt=""
          className={
            doc.layout === "banner" ? "size-6 object-cover" : "size-16 object-cover"
          }
        />
      ) : null}
      {doc.layout === "banner" ? (
        <p>{lines.join(" · ")}</p>
      ) : (
        <div>
          {lines.map((line, index) => (
            <p key={`${index}-${line}`} className="whitespace-pre-line">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { contentBodyToHtml };
