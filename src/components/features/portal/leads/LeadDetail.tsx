"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Select } from "@/components/atoms/Select";
import { LeadEmailThreadSection } from "@/components/features/portal/leads/LeadEmailThreadSection";
import type { LeadComposerLibrary } from "@/components/features/portal/leads/LeadEmailThread";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LEAD_STATUSES,
  LEAD_STATUS_DOT_CLASS,
  LEAD_STATUS_LABELS,
  leadNotesOf,
  leadStatusOf,
  leadTagColor,
  leadTagLabel,
  assigneeIdentity,
  leadTagsOf,
  nextLeadTags,
  normalizeLeadTag,
  teamMemberDisplayName,
  type FromIdentityOption,
  type LeadMessage,
  type LeadStatus,
  type LeadTag,
  type MessageChannel,
  type Submission,
  type TeamMember,
} from "@/lib/api";
import {
  formSubmissionMessage,
  leadContactLabel,
  visibleReplyText,
} from "@/lib/lead-messages";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

function useStackedLayout() {
  const [stacked, setStacked] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setStacked(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return stacked;
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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

function noteAuthorName(authorEmail: string, members: TeamMember[]): string {
  const member = members.find((item) => item.email === authorEmail);
  return teamMemberDisplayName(member ?? { email: authorEmail });
}

function sortLeadMessages(messages: LeadMessage[]): LeadMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

type ConversationPanel = "thread" | "history" | "historyText";

interface LeadDetailProps {
  submission: Submission;
  members: TeamMember[];
  busy?: boolean;
  mailboxConnected?: boolean;
  /** Connected mailbox address; used as the reply-from and "To" recipient. */
  fromAddress?: string;
  /** From identities the current user may use when replying. */
  fromOptions?: FromIdentityOption[];
  /** Business name used for `{{business.name}}` merge fields. */
  businessName?: string;
  messages?: LeadMessage[];
  messageError?: string | null;
  /** Channels the API says are sendable for this lead. Defaults to email. */
  availableChannels?: MessageChannel[];
  /** Project's sending number in E.164, shown as the text sender. */
  smsFromPhone?: string;
  /** Storybook/tests: seed the composer library without hitting the API. */
  composerLibrary?: LeadComposerLibrary;
  /** Tags already used on other leads, offered when adding one. */
  availableTags?: string[];
  /** Palette id for each project tag. */
  tagColors?: Record<string, string>;
  onUpdate: (patch: {
    status?: LeadStatus;
    tags?: LeadTag[];
    assignedTo?: string | null;
  }) => Promise<void>;
  onAddNote: (body: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  onSendMessage?: (
    body: string,
    bodyHtml?: string,
    from?: { fromIdentityId?: string },
  ) => Promise<void>;
  onSendSms?: (body: string) => Promise<void>;
}

export function LeadDetail({
  submission,
  members,
  busy = false,
  mailboxConnected = false,
  fromAddress,
  fromOptions,
  businessName,
  messages = [],
  messageError = null,
  availableChannels = ["email"],
  smsFromPhone,
  composerLibrary,
  availableTags = [],
  tagColors,
  onUpdate,
  onAddNote,
  onDeleteNote,
  onSendMessage,
  onSendSms,
}: LeadDetailProps) {
  const [noteDraft, setNoteDraft] = useState("");
  const [tagOpen, setTagOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<ConversationPanel>("historyText");
  const [channel, setChannel] = useState<MessageChannel>("email");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [phoneHintOpen, setPhoneHintOpen] = useState(false);
  const stacked = useStackedLayout();
  const detailsCollapsed = !detailsOpen && !stacked;
  const status = leadStatusOf(submission);
  const tags = leadTagsOf(submission);
  const notes = leadNotesOf(submission);
  const contactLabel = leadContactLabel(submission);
  const phoneLabel = submission.senderPhone?.trim()
    ? formatPhoneDisplay(submission.senderPhone.trim())
    : null;
  const orderedMessages = sortLeadMessages(messages);
  const latestMessage =
    orderedMessages.length > 0
      ? orderedMessages[orderedMessages.length - 1]
      : null;
  const formMessage = formSubmissionMessage(
    submission.message,
    submission.metadata,
  );
  const featuredBody = latestMessage
    ? visibleReplyText(latestMessage.bodyText)
    : formMessage;
  const featuredAuthor = latestMessage
    ? latestMessage.direction === "inbound"
      ? submission.senderName
      : latestMessage.from
    : submission.senderName;
  const featuredAt = latestMessage?.createdAt ?? submission.submittedAt;
  const metadataEntries = Object.entries(submission.metadata ?? {}).filter(
    ([, value]) => value.trim().length > 0,
  );
  const assignee = assigneeIdentity(submission.assignedTo, members);
  const assigneeKnown = members.some(
    (member) => member.email === submission.assignedTo,
  );
  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...(!assigneeKnown && submission.assignedTo
      ? [{ value: submission.assignedTo, label: submission.assignedTo }]
      : []),
    ...members.map((member) => {
      const label = teamMemberDisplayName(member);
      return {
        value: member.email,
        label,
        menuLabel:
          label === member.email ? member.email : `${label} (${member.email})`,
      };
    }),
  ];
  const hasHistory = orderedMessages.length > 0;
  const tagQuery = tagDraft.trim().toLowerCase();
  const tagSuggestions = availableTags.filter((tag) => {
    if (tags.some((current) => current.toLowerCase() === tag.toLowerCase())) {
      return false;
    }
    if (!tagQuery) return true;
    return (
      tag.toLowerCase().includes(tagQuery) ||
      leadTagLabel(tag).toLowerCase().includes(tagQuery)
    );
  });
  const draftTag = normalizeLeadTag(tagDraft);
  const draftMatch = draftTag
    ? availableTags.find(
        (tag) =>
          tag.toLowerCase() === draftTag ||
          leadTagLabel(tag).toLowerCase() === draftTag,
      )
    : undefined;
  const canCreateTag = Boolean(
    draftTag && nextLeadTags(tags, tagDraft) && !draftMatch,
  );

  function addTag(raw: string) {
    const normalized = normalizeLeadTag(raw);
    const existing = normalized
      ? availableTags.find(
          (tag) =>
            tag.toLowerCase() === normalized ||
            leadTagLabel(tag).toLowerCase() === normalized,
        )
      : undefined;
    const next = nextLeadTags(tags, existing ?? raw);
    if (!next) return;
    void onUpdate({ tags: next });
    setTagDraft("");
    setTagOpen(false);
  }

  function selectPanel(next: Exclude<ConversationPanel, "thread">) {
    setPanel((current) => (current === next ? "thread" : next));
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch">
      <section
        aria-label="Conversation"
        className="flex min-w-0 flex-1 flex-col"
      >
        <LeadEmailThreadSection
          threadHeader={
            <>
              <header className="flex items-start justify-between gap-4 px-6 pt-6">
                <h2 className="font-headline text-2xl font-semibold tracking-tight text-white">
                  {submission.senderName}
                </h2>
                <div className="flex shrink-0 items-center gap-4 pt-1">
                  <button
                    type="button"
                    aria-label="Email"
                    aria-pressed={panel === "historyText" && channel === "email"}
                    onClick={() => {
                      setChannel("email");
                      setPanel("historyText");
                    }}
                    className={cn(
                      "inline-flex size-7 items-center justify-center transition-colors",
                      panel === "historyText" && channel === "email"
                        ? "text-white"
                        : "text-outline hover:text-white",
                    )}
                  >
                    <MaterialIcon name="mail" className="text-lg" />
                  </button>
                  <button
                    type="button"
                    aria-label="Text"
                    aria-pressed={panel === "historyText" && channel === "sms"}
                    onClick={() => {
                      setChannel("sms");
                      setPanel("historyText");
                    }}
                    className={cn(
                      "inline-flex size-7 items-center justify-center transition-colors",
                      panel === "historyText" && channel === "sms"
                        ? "text-white"
                        : "text-outline hover:text-white",
                    )}
                  >
                    <MaterialIcon name="sms" className="translate-y-[2px] text-lg" />
                  </button>
                  {submission.senderPhone?.trim() ? (
                    <a
                      href={`tel:${submission.senderPhone.trim()}`}
                      aria-label="Phone"
                      className="text-outline hover:text-white inline-flex size-7 items-center justify-center"
                    >
                      <MaterialIcon name="call" className="text-lg" />
                    </a>
                  ) : (
                    <Tooltip open={phoneHintOpen} onOpenChange={setPhoneHintOpen}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Phone"
                          onClick={() => setPhoneHintOpen(true)}
                          className="text-outline inline-flex size-7 items-center justify-center"
                        >
                          <MaterialIcon name="call" className="text-lg" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={8}
                        className="bg-surface-container-highest text-on-surface border-outline-variant/20 border px-3 py-2 shadow-md"
                        arrowClassName="fill-surface-container-highest"
                      >
                        No number to call
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {hasHistory && (
                    <button
                      type="button"
                      aria-label="History"
                      aria-pressed={panel === "history"}
                      onClick={() => selectPanel("history")}
                      className={cn(
                        "inline-flex size-7 items-center justify-center transition-colors",
                        panel === "history"
                          ? "text-white"
                          : "text-outline hover:text-white",
                      )}
                    >
                      <MaterialIcon name="history" className="text-lg" />
                    </button>
                  )}
                  {!stacked && (
                  <button
                    type="button"
                    aria-label="Details"
                    aria-pressed={detailsOpen}
                    onClick={() => setDetailsOpen((open) => !open)}
                    className={cn(
                      "hidden size-7 items-center justify-center rounded-md transition-colors duration-300 lg:inline-flex",
                      detailsOpen
                        ? "bg-white/10 text-white"
                        : "text-outline hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <MaterialIcon name="info" className="text-lg" />
                  </button>
                  )}
                </div>
              </header>
              <p className="text-outline flex flex-wrap items-center gap-x-3 gap-y-1 px-6 pt-3 pb-4 text-xs">
                <span className="inline-flex items-center gap-1.5 text-white">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      LEAD_STATUS_DOT_CLASS[status],
                    )}
                  />
                  {LEAD_STATUS_LABELS[status]}
                </span>
                {submission.formName ? (
                  <span>[{submission.formName}]</span>
                ) : null}
                <time dateTime={submission.submittedAt}>
                  {formatWhen(submission.submittedAt)}
                </time>
              </p>
            </>
          }
          formMessage={formMessage}
          formFrom={contactLabel ?? submission.senderName}
          formAt={submission.submittedAt}
          messages={orderedMessages}
          showHistory={panel === "history"}
          showTranscript={panel === "historyText"}
          featuredBody={featuredBody}
          featuredAuthor={featuredAuthor}
          featuredAt={featuredAt}
          leadName={submission.senderName}
          members={members}
          mailboxConnected={mailboxConnected}
          fromAddress={fromAddress}
          fromOptions={fromOptions}
          availableChannels={availableChannels}
          leadPhone={submission.senderPhone}
          channel={channel}
          onChannelChange={(next) => {
            setChannel(next);
            setPanel("historyText");
          }}
          smsFromPhone={smsFromPhone}
          busy={busy}
          error={messageError}
          variableContext={{
            lead: {
              name: submission.senderName,
              email: submission.senderEmail,
            },
            business: businessName ? { name: businessName } : undefined,
            sender: fromAddress ? { email: fromAddress } : undefined,
          }}
          initialLibrary={composerLibrary}
          onSend={onSendMessage}
          onSendSms={onSendSms}
        />
      </section>

      <div
        aria-hidden={detailsCollapsed}
        inert={detailsCollapsed ? true : undefined}
        className={cn(
          "min-w-0 overflow-hidden transition-[width,max-height,opacity,margin] duration-300 ease-out",
          detailsCollapsed
            ? "mt-0 max-h-0 opacity-0 lg:ml-0 lg:w-0 lg:max-h-none"
            : "mt-3 max-h-[120rem] opacity-100 lg:mt-0 lg:ml-3 lg:w-80",
        )}
      >
      <aside
        aria-label="Details"
        className="border-outline-variant/20 bg-surface-container-low w-full rounded-xl border px-5 py-4 lg:w-80"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base leading-5 font-semibold text-white">
            Details
          </h2>
          <div className="flex min-w-0 items-center gap-2">
          <Select
            id="detail-status"
            aria-label="Status"
            variant="inline"
            caret={false}
            listboxAlign="end"
            value={status}
            disabled={busy}
            onChange={(next) => void onUpdate({ status: next as LeadStatus })}
            options={LEAD_STATUSES.map((s) => ({
              value: s,
              label: LEAD_STATUS_LABELS[s],
              indicatorClassName: LEAD_STATUS_DOT_CLASS[s],
            }))}
          />
          {!stacked && (
          <button
            type="button"
            aria-label="Close details"
            onClick={() => setDetailsOpen(false)}
            className="text-outline hover:text-white hidden size-7 shrink-0 items-center justify-center rounded-md lg:inline-flex"
          >
            <MaterialIcon name="close" className="text-lg" />
          </button>
          )}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3 text-sm leading-5">
          <span className="text-outline">Assigned to</span>
          <Select
            id="detail-assignee"
            aria-label="Assigned to"
            variant="inline"
            caret={false}
            listboxAlign="end"
            hint={assignee.email ?? undefined}
            className="min-w-0"
            value={submission.assignedTo ?? ""}
            disabled={busy}
            onChange={(next) =>
              void onUpdate({ assignedTo: next ? next : null })
            }
            options={assigneeOptions}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
          {tags.map((tag) => {
            const label = leadTagLabel(tag);
            const color = leadTagColor(tag, tagColors?.[tag]);
            return (
              <span
                key={tag}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md pr-1 pl-2.5 text-sm leading-none",
                  color.pill,
                )}
              >
                {label}
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  disabled={busy}
                  onClick={() =>
                    void onUpdate({
                      tags: tags.filter((entry) => entry !== tag),
                    })
                  }
                  className="inline-flex size-5 items-center justify-center rounded opacity-70 hover:opacity-100 disabled:opacity-60"
                >
                  <MaterialIcon name="close" className="text-sm" />
                </button>
              </span>
            );
          })}
          <Popover
            open={tagOpen}
            onOpenChange={(open) => {
              setTagOpen(open);
              if (!open) setTagDraft("");
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Add tag"
                disabled={busy}
                className="text-outline inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-lg border border-white/20 px-2.5 text-sm leading-none disabled:opacity-60"
              >
                <span aria-hidden="true">+</span>
                {tags.length === 0 ? "Tags" : null}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="border-outline-variant/20 bg-surface-container-high text-on-surface z-100 w-56 p-2"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                tagInputRef.current?.focus();
              }}
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addTag(tagDraft);
                }}
              >
                <input
                  ref={tagInputRef}
                  aria-label="Tag name"
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  disabled={busy}
                  className="placeholder:text-outline h-8 w-full rounded-md border border-white/15 bg-transparent px-2.5 text-sm text-white outline-none"
                />
              </form>
              {canCreateTag && draftTag ? (
                <button
                  type="button"
                  onClick={() => addTag(tagDraft)}
                  className="hover:bg-surface-bright mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-white"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      leadTagColor(draftTag, tagColors?.[draftTag]).dot,
                    )}
                  />
                  {leadTagLabel(draftTag)}
                </button>
              ) : null}
              {tagSuggestions.length > 0 ? (
                <ul className="mt-1 max-h-48 overflow-auto">
                  {tagSuggestions.map((tag) => (
                    <li key={tag}>
                      <button
                        type="button"
                        onClick={() => addTag(tag)}
                        className="hover:bg-surface-bright flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-white"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            leadTagColor(tag, tagColors?.[tag]).dot,
                          )}
                        />
                        {leadTagLabel(tag)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>
        <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm leading-5">
          {submission.senderName.trim() ? (
            <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
              <dt className="text-outline">Name</dt>
              <dd className="min-w-0 break-words text-white">
                {submission.senderName}
              </dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
            <dt className="text-outline">Id</dt>
            <dd className="font-mono text-white">
              #{submission.submissionId.slice(0, 8)}
            </dd>
          </div>
          {contactLabel ? (
            <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
              <dt className="text-outline">From</dt>
              <dd className="min-w-0 break-all text-white">{contactLabel}</dd>
            </div>
          ) : null}
          {submission.senderEmail.trim() &&
          submission.senderEmail.trim() !== contactLabel ? (
            <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
              <dt className="text-outline">Email</dt>
              <dd className="min-w-0 break-all text-white">
                {submission.senderEmail.trim()}
              </dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
            <dt className="text-outline">Phone</dt>
            <dd className="min-w-0 break-all text-white">{phoneLabel ?? "—"}</dd>
          </div>
          {fromAddress ? (
            <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
              <dt className="text-outline">To</dt>
              <dd className="min-w-0 break-all text-white">{fromAddress}</dd>
            </div>
          ) : null}
          {submission.formName?.trim() ? (
            <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
              <dt className="text-outline">Form</dt>
              <dd className="min-w-0 break-words text-white">
                {submission.formName}
              </dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
            <dt className="text-outline">Date</dt>
            <dd className="text-white">
              <time dateTime={submission.submittedAt}>
                {formatWhen(submission.submittedAt)}
              </time>
            </dd>
          </div>
        </dl>
        {metadataEntries.length > 0 ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p id="detail-metadata" className="text-outline text-sm leading-5">
              Metadata
            </p>
            <dl
              aria-labelledby="detail-metadata"
              className="mt-2 space-y-2 text-sm leading-5"
            >
              {metadataEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3"
                >
                  <dt className="text-outline">{titleCase(key)}</dt>
                  <dd className="min-w-0 break-all text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-outline text-sm leading-5">Notes</p>
          <TooltipProvider delayDuration={200}>
          <ul className="mt-2 space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="flex items-start gap-1 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="min-w-0 flex-1 text-white">{note.body}</p>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    sideOffset={8}
                    className="bg-surface-container-highest text-on-surface border-outline-variant/20 border px-3 py-2 shadow-md"
                    arrowClassName="fill-surface-container-highest"
                  >
                    {noteAuthorName(note.authorEmail, members)} ·{" "}
                    {formatWhen(note.createdAt)}
                  </TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Note actions"
                      className="text-outline hover:text-white inline-flex size-7 shrink-0 items-center justify-center rounded-md"
                    >
                      <MaterialIcon name="more_vert" className="text-lg" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-outline-variant/20 bg-surface-container-high text-on-surface z-[100]"
                  >
                    <DropdownMenuItem
                      disabled={!onDeleteNote || busy}
                      onSelect={() => void onDeleteNote?.(note.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
          </TooltipProvider>
          <form
            className="mt-3"
            onSubmit={(event) => {
              event.preventDefault();
              const body = noteDraft.trim();
              if (!body) return;
              void onAddNote(body).then(() => setNoteDraft(""));
            }}
          >
            <div className="border-white/15 flex h-10 items-center rounded-lg border">
              <input
                aria-label="Add note"
                type="text"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Add a note"
                disabled={busy}
                className="placeholder:text-outline h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label="Save note"
                disabled={busy || !noteDraft.trim()}
                className="text-white inline-flex size-10 shrink-0 items-center justify-center disabled:text-outline"
              >
                <MaterialIcon name="send" className="text-lg" />
              </button>
            </div>
          </form>
        </div>
      </aside>
      </div>
    </div>
  );
}
