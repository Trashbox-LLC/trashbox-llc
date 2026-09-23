"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Select } from "@/components/atoms/Select";
import {
  RichTextEditor,
  type RichTextEditorHandle,
  type RichTextValue,
} from "@/components/atoms/RichTextEditor";
import { LeadComposeLayoutPreview } from "@/components/features/portal/leads/LeadComposeLayoutPreview";
import { EmailTemplateGallery } from "@/components/features/portal/settings/EmailTemplateGallery";
import {
  emailPreviewSrcDoc,
  HtmlEmailCard,
} from "@/components/shared/HtmlEmailCard";
import {
  EmailTemplateBuilder,
  type EmailTemplateBuilderSavePayload,
} from "@/components/features/portal/settings/template-builder/EmailTemplateBuilder";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  EmailSignature,
  EmailSnippet,
  EmailTemplate,
  FromIdentityOption,
  LeadMessage,
  MessageChannel,
  TeamMember,
} from "@/lib/api";
import { messageChannelOf } from "@/lib/api";
import {
  designedEmailHtml,
  leadMessageTimelineLabels,
  messageSenderPresentation,
  resolveComposerChannel,
  visibleReplyText,
} from "@/lib/lead-messages";
import { formatPhoneDisplay } from "@/lib/phone";
import { LeadSmsComposer } from "@/components/features/portal/leads/LeadSmsComposer";
import {
  composeReplyHtml,
  extractReplyBody,
  extractReplySignature,
  htmlToPlainText,
  matchSnippetShortcut,
  renderContentForInsert,
  replaceReplyBody,
  replaceReplySignature,
  snippetTriggerAtEnd,
  type TemplateVariableContext,
} from "@/lib/email-content";
import { parseDocumentFromHtml } from "@/lib/email-template-document";
import type { EmailTemplateStarter } from "@/lib/email-template-starters";
import { settingsSectionPath } from "@/lib/portal-settings";
import { cn } from "@/lib/utils";

export interface LeadComposerLibrary {
  templates: EmailTemplate[];
  signatures: EmailSignature[];
  snippets: EmailSnippet[];
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function dayOrdinal(day: number): string {
  const teen = day % 100;
  if (teen >= 11 && teen <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatConversationStart(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    date,
  );
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\s/g, "")
    .toLowerCase();
  return `${month} ${date.getDate()}${dayOrdinal(date.getDate())} ${time}`;
}

function ConversationStart({ at }: { at: string }) {
  return (
    <div
      role="separator"
      className="flex items-center gap-3 py-3"
    >
      <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
      <span className="text-outline shrink-0 text-xs">
        Form Submission{" "}
        <time dateTime={at}>{formatConversationStart(at)}</time>
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
    </div>
  );
}

function formatDayChip(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const month = new Intl.DateTimeFormat(undefined, { month: "short" }).format(
      date,
    );
    return `${month} ${date.getDate()}`.toUpperCase();
  } catch {
    return iso;
  }
}

function formatDay(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function ThreadMessage({
  author,
  email,
  at,
  body,
  html,
  previewTitle,
  side = "start",
}: {
  author?: string;
  email?: string | null;
  at?: string;
  body: string;
  html?: string | null;
  previewTitle?: string;
  side?: "start" | "end";
}) {
  const outbound = side === "end";
  const name = author ? (
    email ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm font-medium text-white">{author}</span>
        </TooltipTrigger>
        <TooltipContent side={outbound ? "left" : "right"} sideOffset={8}>
          {email}
        </TooltipContent>
      </Tooltip>
    ) : (
      <span className="text-sm font-medium text-white">{author}</span>
    )
  ) : null;

  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[85%] items-start gap-3 py-4",
          outbound && "flex-row-reverse",
        )}
      >
        {author ? (
          <span
            aria-hidden="true"
            className="bg-surface-container-highest mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          >
            {initialsOf(author)}
          </span>
        ) : null}
        <div className={cn("min-w-0", outbound && "text-right")}>
          {(author || at) && (
            <div
              className={cn(
                "mb-1 flex flex-wrap items-baseline gap-2",
                outbound && "justify-end",
              )}
            >
              {name}
              {at ? (
                <time dateTime={at} className="text-outline text-xs">
                  {formatTime(at)}
                </time>
              ) : null}
            </div>
          )}
          {html ? (
            <HtmlEmailPreview
              title={previewTitle || author || "Email"}
              html={html}
            />
          ) : body.trim().length > 0 ? (
            <p className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
              {body}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

/** Local calendar day key used to segment the thread timeline. */
function dayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface TimelineMeta {
  from: string;
  to?: string;
  at: string;
}

interface TimelineEntry {
  id: string;
  at: string;
  eyebrow: string;
  title: string;
  preview: string;
  accent: "primary" | "muted";
  /** Short label above the title, such as Form or Sent. */
  kind: string;
  /** Inbound replies sit off the spine. */
  branch?: boolean;
  /** Name shown with initials on a branched reply. */
  author?: string;
  icon: string;
  iconLabel: string;
  meta: TimelineMeta;
  defaultOpen?: boolean;
  body: ReactNode;
}

function HtmlEmailPreview({ title, html }: { title: string; html: string }) {
  const [open, setOpen] = useState(false);
  const srcDoc = emailPreviewSrcDoc(html);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Preview ${title}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="block w-full text-left"
      >
        <HtmlEmailCard title={title} html={html} />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-130 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="border-outline-variant/20 bg-surface-container-low flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <h2 className="truncate text-sm font-medium text-white">{title}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-outline inline-flex size-8 items-center justify-center rounded-sm hover:text-white"
              >
                <MaterialIcon name="close" className="text-base" />
              </button>
            </div>
            <iframe
              title={`${title} email`}
              sandbox=""
              srcDoc={srcDoc}
              className="h-[70vh] w-full border-0 bg-white"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function groupTimelineByDay(entries: TimelineEntry[]): {
  key: string;
  label: string;
  entries: TimelineEntry[];
}[] {
  const groups: {
    key: string;
    label: string;
    entries: TimelineEntry[];
  }[] = [];

  for (const entry of entries) {
    const key = dayKey(entry.at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.entries.push(entry);
    } else {
      groups.push({
        key,
        label: formatDay(entry.at),
        entries: [entry],
      });
    }
  }

  return groups;
}

interface TimelineNodeProps {
  id: string;
  eyebrow: string;
  title: string;
  preview: string;
  time: string;
  at: string;
  accent: "primary" | "muted";
  kind: string;
  branch?: boolean;
  author?: string;
  icon: string;
  iconLabel: string;
  meta: TimelineMeta;
  defaultOpen?: boolean;
  children: ReactNode;
}

function TimelineNode({
  id,
  eyebrow,
  title,
  preview,
  time,
  at,
  accent,
  kind,
  branch = false,
  author,
  icon,
  iconLabel,
  meta,
  defaultOpen = false,
  children,
}: TimelineNodeProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `timeline-panel-${id}`;

  function toggleOpen() {
    setOpen((value) => !value);
  }

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  function onCardPointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function onCardClick(event: MouseEvent<HTMLDivElement>) {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (start) {
      const moved =
        Math.abs(event.clientX - start.x) > 4 ||
        Math.abs(event.clientY - start.y) > 4;
      if (moved) return;
    }
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    toggleOpen();
  }

  function onCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleOpen();
    }
  }

  const sent = accent === "primary" && icon !== "description";

  return (
    <li className="relative w-full">
      <div
        data-slot="timeline-connector"
        aria-hidden="true"
        className="relative mx-auto flex h-8 w-8 items-end justify-center"
      >
        <span className="absolute top-0 bottom-3 left-1/2 w-px -translate-x-1/2 bg-white/20" />
        <MaterialIcon
          name="arrow_downward"
          className="text-outline relative text-base"
        />
      </div>
      <div
        className={cn(
          "relative rounded-xl border",
          sent
            ? "border-[#3d648c] bg-[#121c28] shadow-[0_10px_28px_-6px_rgba(0,0,0,0.75),0_2px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(120,170,210,0.16)]"
            : "border-[#2a2a2a] bg-[#161616] shadow-[0_10px_28px_-6px_rgba(0,0,0,0.75),0_2px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]",
        )}
      >
        <div className="flex items-start gap-3 px-4 py-4 pr-10">
          <span
            role="img"
            aria-label={iconLabel}
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full select-none",
              icon === "description"
                ? "bg-white text-[#1c1c1c]"
                : sent
                  ? "bg-[#3b84f0] text-white"
                  : "bg-[#2a2a2a] text-white",
            )}
          >
            {branch && author ? (
              <span className="text-[10px] font-semibold">
                {initialsOf(author)}
              </span>
            ) : (
              <MaterialIcon name={icon} className="text-base" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-label text-outline text-[10px] tracking-widest uppercase">
              {kind}
            </p>
            <div
              role="button"
              tabIndex={0}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={title}
              onPointerDown={onCardPointerDown}
              onClick={onCardClick}
              onKeyDown={onCardKeyDown}
              className="focus-visible:ring-primary/40 cursor-pointer text-left outline-none select-text focus-visible:ring-2"
            >
              <span className="mt-1 block text-sm font-medium text-white">
                {title}
              </span>
              <p className="text-outline mt-1 text-xs">
                {eyebrow}
                <span aria-hidden="true"> · </span>
                <time dateTime={at}>{time}</time>
              </p>
              {!open && preview ? (
                <p className="text-on-surface-variant mt-2 line-clamp-2 text-xs">
                  {preview}
                </p>
              ) : null}
              <div
                id={panelId}
                role="region"
                aria-label={`${title} content`}
                aria-hidden={!open}
                inert={!open ? true : undefined}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                  open
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="text-on-surface pt-3 text-sm">{children}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Details for ${title}`}
                className="text-outline inline-flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors select-none hover:text-white"
              >
                <MaterialIcon name="info" className="text-sm" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              sideOffset={8}
              className="bg-surface-container-highest text-on-surface border-outline-variant/20 max-w-xs border px-3 py-2 shadow-md"
            >
              <dl className="space-y-1.5 text-left">
                <div className="flex gap-3">
                  <dt className="font-label text-outline w-10 shrink-0 text-[10px] uppercase">
                    From
                  </dt>
                  <dd className="min-w-0 text-xs break-all">{meta.from}</dd>
                </div>
                {meta.to && (
                  <div className="flex gap-3">
                    <dt className="font-label text-outline w-10 shrink-0 text-[10px] uppercase">
                      To
                    </dt>
                    <dd className="min-w-0 text-xs break-all">{meta.to}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className="font-label text-outline w-10 shrink-0 text-[10px] uppercase">
                    Date
                  </dt>
                  <dd className="min-w-0 text-xs">{formatWhen(meta.at)}</dd>
                </div>
              </dl>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </li>
  );
}

/** Rough plain-text length of the body region (ignores the signature). */
function bodyTextLength(html: string): number {
  const match = html.match(
    /<div\s+data-trashbox-body\b[^>]*>([\s\S]*?)<\/div>/i,
  );
  const source =
    match?.[1] ??
    html.replace(/<div\s+data-trashbox-signature\b[^>]*>[\s\S]*?<\/div>/i, "");
  return source
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

function defaultSignatureId(signatures: EmailSignature[]): string {
  return (
    signatures.find((signature) => signature.isDefault)?.id ??
    signatures[0]?.id ??
    ""
  );
}

function buildSeedHtml(
  signatures: EmailSignature[],
  signatureId: string,
  context: TemplateVariableContext,
): string {
  const signature = signatures.find((item) => item.id === signatureId);
  const signatureHtml = signature
    ? renderContentForInsert(signature, context).html
    : undefined;
  return composeReplyHtml("<p><br></p>", signatureHtml);
}

export interface LeadEmailThreadProps {
  formMessage: string;
  formFrom: string;
  formAt: string;
  messages: LeadMessage[];
  /** When true, render every message, including the latest, in the History timeline. */
  showHistory?: boolean;
  /** When true, render the full thread in the featured text layout. */
  showTranscript?: boolean;
  /** Latest message body shown when History is closed. */
  featuredBody: string;
  /** Name shown beside the featured message. */
  featuredAuthor?: string;
  /** Timestamp for the featured message. */
  featuredAt?: string;
  /** Optional form metadata shown with the featured body. */
  featuredMetadata?: Record<string, string>;
  /** When false, the featured message stays mounted out of view. */
  showFeatured?: boolean;
  /** Replaces the featured message (notes, for example). */
  conversationExtra?: ReactNode;
  /** Pinned above the message list, inside the messages card. */
  threadHeader?: ReactNode;
  /** Lead name used on branched inbound replies. */
  leadName?: string;
  /** Teammates, used to show a name on sent messages. */
  members?: TeamMember[];
  mailboxConnected: boolean;
  fromAddress?: string;
  fromOptions?: FromIdentityOption[];
  /** Channels the API says are sendable for this lead. Defaults to email. */
  availableChannels?: MessageChannel[];
  /** Lead's phone in E.164. The text field stays visible without it. */
  leadPhone?: string;
  /** Conversation and composer channel. Unset shows every message. */
  channel?: MessageChannel;
  onChannelChange?: (channel: MessageChannel) => void;
  /** Project's sending number in E.164. */
  smsFromPhone?: string;
  busy?: boolean;
  error?: string | null;
  /** Account email content library used while composing. */
  library?: LeadComposerLibrary;
  /** Values used to resolve merge fields on insert. */
  variableContext?: TemplateVariableContext;
  onSend?: (
    text: string,
    html?: string,
    from?: { fromIdentityId?: string },
  ) => Promise<void>;
  onSendSms?: (text: string) => Promise<void>;
}

export function LeadEmailThread({
  formMessage,
  formFrom,
  formAt,
  messages,
  showHistory = false,
  showTranscript = false,
  featuredBody,
  featuredAuthor,
  featuredAt,
  featuredMetadata,
  showFeatured = true,
  conversationExtra,
  threadHeader,
  leadName,
  members = [],
  mailboxConnected,
  fromAddress,
  fromOptions = [],
  availableChannels = ["email"],
  leadPhone,
  channel,
  onChannelChange,
  smsFromPhone,
  busy = false,
  error,
  library,
  variableContext = {},
  onSend,
  onSendSms,
}: LeadEmailThreadProps) {
  const templates = library?.templates ?? [];
  const signatures = library?.signatures ?? [];
  const snippets = library?.snippets ?? [];

  const defaultOption =
    fromOptions.find((option) => option.label.includes("(Default)")) ??
    fromOptions[0];
  const [fromIdentityId, setFromIdentityId] = useState(defaultOption?.id ?? "");
  const selected = fromOptions.find((o) => o.id === fromIdentityId);
  const hasFromOptions = fromOptions.length > 0;

  const context = useMemo<TemplateVariableContext>(
    () => ({
      ...variableContext,
      sender: {
        name: selected?.displayName || variableContext.sender?.name,
        email: fromAddress || variableContext.sender?.email,
      },
    }),
    [variableContext, selected?.displayName, fromAddress],
  );

  const [signatureId, setSignatureId] = useState(() =>
    defaultSignatureId(signatures),
  );
  const [editorKey, setEditorKey] = useState(0);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [layoutActive, setLayoutActive] = useState(false);
  const [layoutBuilderOpen, setLayoutBuilderOpen] = useState(false);
  const [layoutBuilderKey, setLayoutBuilderKey] = useState(0);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const seededForSignature = useRef<string | null>(null);
  const draftRef = useRef<RichTextValue>({ html: "", text: "" });
  const layoutActiveRef = useRef(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const seedHtml = useMemo(
    () => buildSeedHtml(signatures, signatureId, context),
    [signatures, signatureId, context],
  );

  const [draft, setDraft] = useState<RichTextValue>(() => ({
    html: seedHtml,
    text: "",
  }));
  /** HTML applied on mount / remount only — never mirror live draft here. */
  const [editorSeed, setEditorSeed] = useState(seedHtml);
  draftRef.current = draft;
  layoutActiveRef.current = layoutActive;

  function setDraftHtml(nextHtml: string) {
    setDraft({
      html: nextHtml,
      text: htmlToPlainText(nextHtml),
    });
  }

  function enterLayoutMode(bodyHtml: string) {
    const next = replaceReplyBody(draftRef.current.html || seedHtml, bodyHtml);
    setDraftHtml(next);
    setLayoutActive(true);
  }

  function exitLayoutMode() {
    const next = replaceReplyBody(
      draftRef.current.html || seedHtml,
      "<p><br></p>",
    );
    setDraftHtml(next);
    setEditorSeed(next);
    setEditorKey((key) => key + 1);
    setLayoutActive(false);
    setLayoutBuilderOpen(false);
  }

  // Seed once when the default signature first becomes available.
  useEffect(() => {
    if (!mailboxConnected) return;
    const nextDefault = defaultSignatureId(signatures);
    if (!nextDefault) return;
    if (seededForSignature.current === nextDefault) return;
    if (bodyTextLength(draftRef.current.html) > 0) return;

    seededForSignature.current = nextDefault;
    setSignatureId(nextDefault);
    const html = buildSeedHtml(signatures, nextDefault, context);
    setDraft({ html, text: "" });
    setEditorSeed(html);
    setEditorKey((key) => key + 1);
  }, [mailboxConnected, signatures, context]);

  // Refresh merge fields inside the signature when the From identity changes.
  useEffect(() => {
    if (!signatureId) return;
    const signature = signatures.find((item) => item.id === signatureId);
    if (!signature) return;
    const current = draftRef.current.html;
    const nextHtml = replaceReplySignature(
      current,
      renderContentForInsert(signature, context).html,
    );
    if (nextHtml === current) return;
    if (layoutActiveRef.current) {
      setDraftHtml(nextHtml);
      return;
    }
    if (!editorRef.current) return;
    editorRef.current.setHtml(nextHtml);
  }, [
    fromIdentityId,
    context.sender?.name,
    context.sender?.email,
    signatureId,
    signatures,
    context,
  ]);

  const hasContent = bodyTextLength(draft.html) > 0;
  const layoutBodyHtml = extractReplyBody(draft.html);
  const layoutSignatureHtml = extractReplySignature(draft.html);

  async function submit() {
    if (!onSend || !hasContent || busy || !fromIdentityId) return;
    const html = draft.html.trim();
    const plain = draft.text.trim() || htmlToPlainText(extractReplyBody(html));
    await onSend(plain, html ? html : undefined, {
      fromIdentityId,
    });
    const htmlSeed = buildSeedHtml(signatures, signatureId, context);
    setDraft({ html: htmlSeed, text: "" });
    setEditorSeed(htmlSeed);
    setEditorKey((key) => key + 1);
    setLayoutActive(false);
    setLayoutBuilderOpen(false);
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    const rendered = renderContentForInsert(template, context);
    enterLayoutMode(rendered.html);
  }

  function applyStarter(starter: EmailTemplateStarter) {
    const rendered = renderContentForInsert(starter, context);
    enterLayoutMode(rendered.html);
  }

  function applySignature(nextId: string) {
    setSignatureId(nextId);
    const signature = signatures.find((item) => item.id === nextId);
    const signatureHtml = signature
      ? renderContentForInsert(signature, context).html
      : "";
    const next = replaceReplySignature(
      draftRef.current.html || seedHtml,
      signatureHtml,
    );
    if (layoutActive) {
      setDraftHtml(next);
      return;
    }
    if (!editorRef.current) return;
    editorRef.current.setHtml(next);
  }

  function applySnippet(snippetId: string) {
    if (layoutActive) return;
    const snippet = snippets.find((item) => item.id === snippetId);
    if (!snippet || !editorRef.current) return;
    const rendered = renderContentForInsert(snippet, context);
    editorRef.current.insertHtml(rendered.html);
  }

  function openLayoutBuilder() {
    setLayoutBuilderKey((key) => key + 1);
    setLayoutBuilderOpen(true);
  }

  async function insertLayoutFromBuilder(
    payload: EmailTemplateBuilderSavePayload,
  ) {
    const next = replaceReplyBody(
      draftRef.current.html || seedHtml,
      payload.bodyHtml,
    );
    setDraftHtml(next);
    setLayoutActive(true);
    setLayoutBuilderOpen(false);
  }

  function expandSnippetShortcut(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== " " && event.key !== "Enter") return false;
    if (event.metaKey || event.ctrlKey || event.altKey) return false;

    const before = editorRef.current?.textBeforeCursor() ?? "";
    const trigger = snippetTriggerAtEnd(before);
    if (!trigger) return false;

    const snippet = matchSnippetShortcut(snippets, trigger);
    if (!snippet || !editorRef.current) return false;

    event.preventDefault();
    const rendered = renderContentForInsert(snippet, context);
    const tokenLength = trigger.length + 1; // leading "/"
    const suffix = event.key === " " ? " " : "<br />";
    editorRef.current.replaceCharsBeforeCursor(
      tokenLength,
      `${rendered.html}${suffix}`,
    );
    return true;
  }

  function onEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
      return;
    }
    expandSnippetShortcut(event);
  }

  const canEmail =
    Boolean(onSend) && mailboxConnected && availableChannels.includes("email");
  const canSms =
    Boolean(onSendSms) &&
    Boolean(leadPhone) &&
    availableChannels.includes("sms");
  const [internalChannel, setInternalChannel] =
    useState<MessageChannel>("email");
  const requestedChannel = channel ?? internalChannel;
  function selectChannel(next: MessageChannel) {
    if (channel === undefined) setInternalChannel(next);
    onChannelChange?.(next);
  }
  const activeChannel = resolveComposerChannel({
    requested: requestedChannel,
    canEmail,
    canSms,
  });
  const viewingText =
    channel === "sms" || (channel === undefined && activeChannel === "sms");

  const showReplyNode =
    Boolean(onSend) || (Boolean(onSendSms) && Boolean(leadPhone));
  const sendDisabled = busy || !hasContent || !fromIdentityId;
  const libraryEmpty =
    templates.length === 0 && signatures.length === 0 && snippets.length === 0;
  const libraryButtonClass =
    "font-body h-8 gap-2 rounded px-0 text-sm font-normal tracking-normal text-outline normal-case hover:bg-transparent hover:text-white";

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );
  const latestMessage = orderedMessages.at(-1);
  const transcriptMessages =
    channel === undefined
      ? orderedMessages
      : orderedMessages.filter(
          (message) => messageChannelOf(message) === channel,
        );
  const formSender = messageSenderPresentation({
    direction: "inbound",
    from: formFrom,
    leadName,
  });
  const featuredSender = latestMessage
    ? messageSenderPresentation({
        direction: latestMessage.direction,
        from: latestMessage.from,
        sentBy: latestMessage.sentBy,
        leadName,
        members,
      })
    : messageSenderPresentation({
        direction: "inbound",
        from: formFrom,
        leadName: leadName || featuredAuthor,
      });

  const timelineGroups = useMemo(() => {
    const ordered = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    // While History is closed the latest reply stays in the featured block.
    const historyMessages =
      showHistory || ordered.length === 0 ? ordered : ordered.slice(0, -1);

    const entries: TimelineEntry[] = [
      {
        id: "form",
        at: formAt,
        eyebrow: `Form Submission ← ${formFrom}`,
        title: formMessage.split("\n")[0] || "Form submission",
        preview: formMessage.replace(/\s+/g, " ").trim(),
        accent: "primary",
        kind: "Form",
        icon: "description",
        iconLabel: "Form submission event",
        meta: { from: formFrom, at: formAt },
        defaultOpen: true,
        body: (
          <div>
            <p className="font-label text-outline mb-1 text-[10px] tracking-widest uppercase">
              Message
            </p>
            <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
              {formMessage}
            </p>
          </div>
        ),
      },
      ...historyMessages.map((message) => {
        const labels = leadMessageTimelineLabels(message);
        const sms = messageChannelOf(message) === "sms";
        const address = (value: string) =>
          sms ? formatPhoneDisplay(value) : value;
        const branch = labels.accent === "muted";
        const previewHtml = designedEmailHtml(message.bodyHtml);
        const replyText = visibleReplyText(message.bodyText);
        return {
          id: message.messageId,
          at: message.createdAt,
          eyebrow: labels.eyebrow,
          title: labels.title,
          preview: replyText.replace(/\s+/g, " ").trim(),
          accent: labels.accent,
          kind: sms ? "Text" : branch ? "Received" : "Sent",
          branch,
          author: branch ? leadName || address(message.from) : undefined,
          icon: labels.icon,
          iconLabel: labels.iconLabel,
          defaultOpen: true,
          meta: {
            from: address(message.from),
            to: address(message.to),
            at: message.createdAt,
          },
          body: previewHtml ? (
            <HtmlEmailPreview title={labels.title} html={previewHtml} />
          ) : (
            <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
              {replyText}
            </p>
          ),
        };
      }),
    ];
    return groupTimelineByDay(entries);
  }, [formAt, formFrom, formMessage, leadName, messages, showHistory]);

  useLayoutEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [showTranscript, channel, transcriptMessages.length, formMessage]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-3">
        <div
          role="region"
          aria-label="Messages"
          className="border-outline-variant/20 bg-surface-container-low flex flex-col rounded-xl border"
        >
        {threadHeader}
        <div className="px-6 py-2">
        {conversationExtra}
        {messages.length > 0 && (
          <div
            role="region"
            aria-label="Message history"
            aria-hidden={!showHistory}
            inert={!showHistory ? true : undefined}
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              showHistory
                ? "mb-8 grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="relative mx-auto max-w-lg px-6 pt-2 pb-8">
                <h3 className="sr-only">History</h3>
                <div data-slot="timeline-spine" className="relative space-y-6">
                  {timelineGroups.map((group) => (
                    <section
                      key={group.key}
                      aria-label={`Messages on ${group.label}`}
                      className="space-y-2"
                    >
                      <div className="flex justify-center">
                        <time
                          dateTime={group.key}
                          className="font-label relative z-10 rounded-full border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-1 text-[10px] tracking-widest text-[#d4d4d4] uppercase"
                        >
                          {formatDayChip(group.entries[0]?.at ?? group.key)}
                        </time>
                      </div>

                      <ol className="space-y-2">
                        {group.entries.map((entry) => (
                          <TimelineNode
                            key={entry.id}
                            id={entry.id}
                            eyebrow={entry.eyebrow}
                            title={entry.title}
                            preview={entry.preview}
                            time={formatTime(entry.at)}
                            at={entry.at}
                            accent={entry.accent}
                            kind={entry.kind}
                            branch={entry.branch}
                            author={entry.author}
                            icon={entry.icon}
                            iconLabel={entry.iconLabel}
                            meta={entry.meta}
                            defaultOpen={entry.defaultOpen}
                          >
                            {entry.body}
                          </TimelineNode>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showTranscript && (
          <div
            ref={transcriptRef}
            role="region"
            aria-label="Message transcript"
            className="max-h-96 overflow-y-auto"
          >
            {channel !== "sms" && (
              <>
                <ConversationStart at={formAt} />
                <ThreadMessage
                  author={formSender.name}
                  email={formSender.email}
                  side={formSender.side}
                  at={formAt}
                  body={formMessage}
                />
              </>
            )}
            {transcriptMessages.map((message) => {
              const sender = messageSenderPresentation({
                direction: message.direction,
                from: message.from,
                sentBy: message.sentBy,
                leadName,
                members,
              });
              return (
                <ThreadMessage
                  key={message.messageId}
                  author={sender.name}
                  email={sender.email}
                  side={sender.side}
                  at={message.createdAt}
                  body={visibleReplyText(message.bodyText)}
                  html={designedEmailHtml(message.bodyHtml)}
                  previewTitle={message.subject}
                />
              );
            })}
          </div>
        )}

        {showFeatured && !showHistory && !showTranscript && featuredBody.trim().length > 0 && (
          <div>
            <ConversationStart at={formAt} />
            <ThreadMessage
              author={featuredSender.name}
              email={featuredSender.email}
              side={featuredSender.side}
              at={featuredAt}
              body={featuredBody}
              html={
                latestMessage
                  ? designedEmailHtml(latestMessage.bodyHtml)
                  : null
              }
              previewTitle={latestMessage?.subject}
            />
            {featuredMetadata && Object.keys(featuredMetadata).length > 0 && (
              <dl className="mt-6 space-y-2">
                {Object.entries(featuredMetadata).map(([key, value]) => (
                  <div key={key} className="flex gap-4 text-sm">
                    <dt className="font-label text-outline tracking-widest uppercase">
                      {key}
                    </dt>
                    <dd className="text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        {!showReplyNode && !viewingText && error && (
          <p className="text-error mt-4 text-sm">{error}</p>
        )}
        </div>
        {viewingText && !smsFromPhone?.trim() && (
          <div className="flex flex-col items-center gap-4 border-t border-white/20 px-4 py-8">
            <div
              aria-hidden="true"
              className="border-white/15 bg-[#0d0d0d] flex aspect-[9/16] w-12 flex-col rounded-[0.85rem] border-2 px-1 pt-1.5 pb-1"
            >
              <span className="mx-auto mb-2 block h-0.5 w-4 rounded-full bg-white/20" />
              <div className="flex min-h-0 flex-1 flex-col justify-end space-y-1">
                <div className="bg-white/12 h-2.5 w-5 rounded-full" />
                <div className="ml-auto h-2.5 w-6 rounded-full bg-[#3d648c]" />
                <div className="bg-white/12 h-2.5 w-7 rounded-full" />
                <div className="ml-auto h-2.5 w-4 rounded-full bg-[#3d648c]" />
                <div className="bg-white/12 h-2.5 w-6 rounded-full" />
              </div>
              <span className="mx-auto mt-1 block h-0.5 w-3.5 rounded-full bg-white/20" />
            </div>
            <p className="text-outline max-w-sm text-center text-sm">
              SMS text messaging is not set up for this account. Go to{" "}
              <a
                href={settingsSectionPath("text-messaging")}
                className="text-white underline"
              >
                settings
              </a>{" "}
              or click below to apply for text messaging
            </p>
            <Button asChild>
              <a href={settingsSectionPath("text-messaging")}>
                <MaterialIcon name="sms" className="text-base" />
                Get Started With SMS
              </a>
            </Button>
          </div>
        )}
        {viewingText && (
          <>
            {error && <p className="text-error px-6 pt-3 text-sm">{error}</p>}
            <LeadSmsComposer
              toPhone={leadPhone?.trim() || ""}
              fromPhone={smsFromPhone}
              busy={busy}
              disabled={
                !onSendSms || !leadPhone?.trim() || !smsFromPhone?.trim()
              }
              notice={
                leadPhone?.trim()
                  ? undefined
                  : "No phone number on this contact"
              }
              embedded
              onSend={onSendSms ?? (async () => {})}
            />
          </>
        )}
        </div>

        {showReplyNode && !viewingText && (
        <div
          role="region"
          aria-label="Reply"
          className="border-outline-variant/20 bg-surface-container-low shrink-0 overflow-hidden rounded-xl border"
        >
        {error && <p className="text-error px-6 pt-3 text-sm">{error}</p>}

        {channel === undefined && canEmail && canSms && (
          <div
            role="tablist"
            aria-label="Reply channel"
            className="border-outline-variant/15 mx-6 mt-3 inline-flex gap-1 self-start rounded-lg border p-1"
          >
            {(["email", "sms"] as const).map((channel) => (
              <button
                key={channel}
                type="button"
                role="tab"
                aria-selected={activeChannel === channel}
                onClick={() => selectChannel(channel)}
                className={cn(
                  "font-label inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[10px] tracking-widest uppercase transition-colors",
                  activeChannel === channel
                    ? "text-background bg-white"
                    : "text-outline hover:text-white",
                )}
              >
                <MaterialIcon
                  name={channel === "sms" ? "sms" : "mail"}
                  className="text-base"
                />
                {channel === "sms" ? "Text" : "Email"}
              </button>
            ))}
          </div>
        )}

        {activeChannel === "email" && onSend && (
          <div>
            <div className="px-6 py-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-outline shrink-0 text-sm">To</span>
                <span className="bg-surface-container inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-white shadow-sm">
                  {formFrom}
                </span>
                <span className="text-outline shrink-0 text-sm">From</span>
                <div className="min-w-[12rem] flex-1">
                  {hasFromOptions ? (
                    <Select
                      aria-label="Sender Display Name"
                      variant="inline"
                      value={fromIdentityId}
                      onChange={setFromIdentityId}
                      disabled={busy}
                      options={fromOptions.map((option) => ({
                        value: option.id,
                        label: option.label,
                      }))}
                    />
                  ) : (
                    <p className="text-on-surface-variant py-2 text-sm">
                      No Sender Display Name assigned. Ask an owner or admin to
                      set one in Members.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/20 px-6 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Template"
                disabled={busy}
                onClick={() => setTemplateGalleryOpen(true)}
                className={libraryButtonClass}
              >
                <MaterialIcon name="description" className="text-lg" />
                Template
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Snippet"
                    disabled={busy || snippets.length === 0}
                    className={libraryButtonClass}
                  >
                    <MaterialIcon name="data_object" className="text-lg" />
                    Snippet
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-outline-variant/20 bg-surface-container-high text-on-surface z-[100] max-h-64"
                >
                  {snippets.map((snippet) => (
                    <DropdownMenuItem
                      key={snippet.id}
                      onSelect={() => applySnippet(snippet.id)}
                    >
                      {snippet.shortcut
                        ? `${snippet.name} (/${snippet.shortcut})`
                        : snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Signature"
                    disabled={busy || signatures.length === 0}
                    className={libraryButtonClass}
                  >
                    <MaterialIcon name="draw" className="text-lg" />
                    Signature
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-outline-variant/20 bg-surface-container-high text-on-surface z-[100] max-h-64"
                >
                  {signatures.map((signature) => (
                    <DropdownMenuItem
                      key={signature.id}
                      onSelect={() => applySignature(signature.id)}
                    >
                      {signature.isDefault
                        ? `${signature.name} (Default)`
                        : signature.name}
                      {signature.id === signatureId ? " ✓" : ""}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {libraryEmpty ? (
                <a
                  href={settingsSectionPath("templates")}
                  className="font-label text-[10px] tracking-widest text-white uppercase underline"
                >
                  Manage in Settings
                </a>
              ) : null}
            </div>

            {layoutActive ? (
              <LeadComposeLayoutPreview
                html={layoutBodyHtml}
                signatureHtml={layoutSignatureHtml}
                disabled={busy}
                onEdit={openLayoutBuilder}
                onRemove={exitLayoutMode}
              />
            ) : (
              <RichTextEditor
                key={editorKey}
                ref={editorRef}
                ariaLabel="Reply"
                placeholder="Reply"
                disabled={busy}
                initialHtml={editorSeed}
                onChange={setDraft}
                onKeyDown={onEditorKeyDown}
                className="rounded-none border-0 bg-transparent"
                editorClassName="min-h-24"
                compactToolbar
              />
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/20 px-6 py-3">
              <span className="text-outline font-mono text-[10px]">
                Cmd + Enter
              </span>
              <Button
                type="button"
                variant="secondary"
                aria-label="Send message"
                disabled={sendDisabled}
                onClick={() => void submit()}
                className="font-label text-background hover:text-background h-9 rounded-md bg-white px-5 text-xs font-semibold tracking-widest uppercase shadow-sm hover:bg-white/90"
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {onSend && !canEmail && !canSms && (
          <p className="text-on-surface-variant px-6 py-4 text-sm">
            Connect a business mailbox in{" "}
            <a
              href={settingsSectionPath("email-accounts")}
              className="text-white underline"
            >
              Settings
            </a>{" "}
            to reply from the portal.
          </p>
        )}
        </div>
        )}
      </div>

      {templateGalleryOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
          <EmailTemplateGallery
            mode="compose"
            className="w-full max-w-5xl shadow-lg"
            savedTemplates={templates.map((template) => ({
              id: template.id,
              name: template.name,
              subject: template.subject,
              bodyHtml: template.bodyHtml,
            }))}
            onSelectSaved={(template) => {
              applyTemplate(template.id);
              setTemplateGalleryOpen(false);
            }}
            onSelectStarter={(starter) => {
              applyStarter(starter);
              setTemplateGalleryOpen(false);
            }}
            onClose={() => setTemplateGalleryOpen(false)}
          />
        </div>
      )}

      {layoutBuilderOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-stretch justify-center bg-black/70 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit layout"
        >
          <div className="bg-background flex h-full max-h-[100dvh] w-full max-w-7xl flex-col overflow-hidden rounded-lg shadow-2xl">
            <EmailTemplateBuilder
              key={layoutBuilderKey}
              mode="compose"
              initialDocument={parseDocumentFromHtml(layoutBodyHtml)}
              onSave={insertLayoutFromBuilder}
              onCancel={() => setLayoutBuilderOpen(false)}
              className="min-h-0"
            />
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
