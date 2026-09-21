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
  LEAD_TAGS,
  LEAD_TAG_LABELS,
  leadNotesOf,
  leadStatusOf,
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
import { leadContactLabel, visibleReplyText } from "@/lib/lead-messages";
import { cn } from "@/lib/utils";

const labelClass =
  "mb-2 block font-label text-[10px] uppercase tracking-widest text-outline";

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

type ConversationPanel = "thread" | "history" | "notes";

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
  const featuredBody = latestMessage
    ? visibleReplyText(latestMessage.bodyText)
    : submission.message;
  const featuredAuthor = latestMessage
    ? latestMessage.direction === "inbound"
      ? submission.senderName
      : latestMessage.from
    : submission.senderName;
  const featuredAt = latestMessage?.createdAt ?? submission.submittedAt;
  const showFormMetadata =
    !latestMessage &&
    Boolean(submission.metadata && Object.keys(submission.metadata).length > 0);
  const hasHistory = orderedMessages.length > 0;

  function selectPanel(next: Exclude<ConversationPanel, "thread">) {
    setPanel((current) => (current === next ? "thread" : next));
  }

  async function toggleTag(tag: LeadTag) {
    const next = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    await onUpdate({ tags: next });
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
          formMessage={submission.message}
          formFrom={contactLabel ?? submission.senderName}
          formAt={submission.submittedAt}
          messages={orderedMessages}
          showHistory={panel === "history"}
          featuredBody={featuredBody}
          featuredAuthor={featuredAuthor}
          featuredAt={featuredAt}
          leadName={submission.senderName}
          showFeatured={panel !== "notes"}
          conversationExtra={panel === "notes" ? notesPanel : undefined}
          featuredMetadata={
            showFormMetadata ? submission.metadata : undefined
          }
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
        className="border-outline-variant/20 bg-surface-container-low w-full shrink-0 space-y-6 rounded-xl border p-5 lg:w-72"
      >
        <h2 className="text-sm font-medium text-white">Details</h2>
        <div>
          <label className={labelClass} htmlFor="detail-status">
            Status
          </label>
          <Select
            id="detail-status"
            variant="field"
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
        <div>
          <label className={labelClass} htmlFor="detail-assignee">
            Assigned to
          </label>
          <Select
            id="detail-assignee"
            variant="field"
            value={submission.assignedTo ?? ""}
            disabled={busy}
            onChange={(next) =>
              void onUpdate({ assignedTo: next ? next : null })
            }
            options={[
              { value: "", label: "Unassigned" },
              ...members.map((member) => {
                const label = teamMemberDisplayName(member);
                return {
                  value: member.email,
                  label:
                    label === member.email
                      ? member.email
                      : `${label} (${member.email})`,
                };
              }),
            ]}
          />
        </div>
        <div>
          <p className={labelClass}>Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {LEAD_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={busy}
                  onClick={() => void toggleTag(tag)}
                  className={cn(
                    "font-label rounded-md text-[9px] font-medium tracking-wider",
                    active
                      ? "border-white/70 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                      : "border-outline-variant/40 text-outline hover:border-white hover:text-white",
                  )}
                >
                  {LEAD_TAG_LABELS[tag]}
                </Button>
              );
            })}
          </div>
        </div>
        <dl className="space-y-5">
          {contactLabel ? (
            <div>
              <dt className={labelClass}>From</dt>
              <dd className="text-sm break-all text-white">{contactLabel}</dd>
            </div>
          ) : null}
          {fromAddress ? (
            <div>
              <dt className={labelClass}>To</dt>
              <dd className="text-sm break-all text-white">{fromAddress}</dd>
            </div>
          ) : null}
          <div>
            <dt className={labelClass}>Date</dt>
            <dd className="text-sm text-white">
              <time dateTime={submission.submittedAt}>
                {formatWhen(submission.submittedAt)}
              </time>
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
