"use client";

import { useState } from "react";
import { Select } from "@/components/atoms/Select";
import { LeadEmailThreadSection } from "@/components/features/portal/leads/LeadEmailThreadSection";
import type { LeadComposerLibrary } from "@/components/features/portal/leads/LeadEmailThread";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_STATUSES,
  LEAD_STATUS_DOT_CLASS,
  LEAD_STATUS_LABELS,
  LEAD_TAG_LABELS,
  leadNotesOf,
  leadStatusOf,
  assigneeIdentity,
  leadTagsOf,
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
import { cn } from "@/lib/utils";

const labelClass =
  "mb-2 block font-label text-[10px] uppercase tracking-widest text-outline";

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

function sortLeadMessages(messages: LeadMessage[]): LeadMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

type ConversationPanel = "thread" | "history" | "historyText" | "notes";

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
  onUpdate: (patch: {
    status?: LeadStatus;
    tags?: LeadTag[];
    assignedTo?: string | null;
  }) => Promise<void>;
  onAddNote: (body: string) => Promise<void>;
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
  onUpdate,
  onAddNote,
  onSendMessage,
  onSendSms,
}: LeadDetailProps) {
  const [noteDraft, setNoteDraft] = useState("");
  const [panel, setPanel] = useState<ConversationPanel>("thread");
  const status = leadStatusOf(submission);
  const tags = leadTagsOf(submission);
  const notes = leadNotesOf(submission);
  const contactLabel = leadContactLabel(submission);
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

  function selectPanel(next: Exclude<ConversationPanel, "thread">) {
    setPanel((current) => (current === next ? "thread" : next));
  }

  const notesPanel = (
    <div className="py-4">
      <ul className="space-y-4">
        {notes.length === 0 && (
          <li className="text-on-surface-variant text-sm">No notes yet.</li>
        )}
        {notes.map((note) => (
          <li key={note.id} className="text-sm">
            <p className="text-white">{note.body}</p>
            <p className="font-label text-outline mt-1 text-[10px] tracking-widest uppercase">
              {note.authorEmail} · {formatWhen(note.createdAt)}
            </p>
          </li>
        ))}
      </ul>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const body = noteDraft.trim();
          if (!body) return;
          void onAddNote(body).then(() => setNoteDraft(""));
        }}
      >
        <label className={labelClass} htmlFor="lead-note">
          Add note
        </label>
        <Textarea
          id="lead-note"
          rows={3}
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          className="border-outline-variant/20 placeholder:text-outline focus-visible:border-primary min-h-0 border px-3 py-3"
          placeholder="Add a note…"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !noteDraft.trim()}>
          Save note
        </Button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
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
                  {hasHistory && (
                    <button
                      type="button"
                      aria-pressed={panel === "history"}
                      onClick={() => selectPanel("history")}
                      className={cn(
                        "text-sm transition-colors",
                        panel === "history"
                          ? "border-b border-white text-white"
                          : "text-outline hover:text-white",
                      )}
                    >
                      History
                    </button>
                  )}
                  {hasHistory && (
                    <button
                      type="button"
                      aria-pressed={panel === "historyText"}
                      onClick={() => selectPanel("historyText")}
                      className={cn(
                        "text-sm transition-colors",
                        panel === "historyText"
                          ? "border-b border-white text-white"
                          : "text-outline hover:text-white",
                      )}
                    >
                      History 2
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={panel === "notes"}
                    onClick={() => selectPanel("notes")}
                    className={cn(
                      "text-sm transition-colors",
                      panel === "notes"
                        ? "text-white"
                        : "text-outline hover:text-white",
                    )}
                  >
                    Notes
                  </button>
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
                <span className="font-mono">
                  #{submission.submissionId.slice(0, 8)}
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
          showFeatured={panel !== "notes"}
          conversationExtra={panel === "notes" ? notesPanel : undefined}
          mailboxConnected={mailboxConnected}
          fromAddress={fromAddress}
          fromOptions={fromOptions}
          availableChannels={availableChannels}
          leadPhone={submission.senderPhone}
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

      <aside
        aria-label="Details"
        className="border-outline-variant/20 bg-surface-container-low w-full shrink-0 rounded-xl border px-5 py-4 lg:w-80"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base leading-5 font-semibold text-white">
            Details
          </h2>
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
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-7 items-center rounded-lg border border-white/20 px-2.5 text-sm leading-none text-white"
            >
              {LEAD_TAG_LABELS[tag]}
            </span>
          ))}
          <button
            type="button"
            aria-label="Add tag"
            className="text-outline inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/20 px-2 text-sm leading-none"
          >
            +
          </button>
        </div>
        <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm leading-5">
          {contactLabel ? (
            <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
              <dt className="text-outline">From</dt>
              <dd className="min-w-0 break-all text-white">{contactLabel}</dd>
            </div>
          ) : null}
          {fromAddress ? (
            <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3">
              <dt className="text-outline">To</dt>
              <dd className="min-w-0 break-all text-white">{fromAddress}</dd>
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
      </aside>
    </div>
  );
}
