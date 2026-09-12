"use client";

import { useState, type ReactNode } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
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
import { leadContactLabel } from "@/lib/lead-messages";
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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function subjectOf(submission: Submission): string {
  const firstLine = submission.message.split("\n")[0]?.trim();
  if (firstLine) return firstLine.slice(0, 90);
  return `New lead from ${submission.senderName}`;
}

function sortLeadMessages(messages: LeadMessage[]): LeadMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-label text-outline w-14 shrink-0 text-[10px] uppercase">
        {label}
      </span>
      <div className="text-on-surface min-w-0 text-sm">{value}</div>
    </div>
  );
}

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const status = leadStatusOf(submission);
  const tags = leadTagsOf(submission);
  const notes = leadNotesOf(submission);
  const contactLabel = leadContactLabel(submission);
  const orderedMessages = sortLeadMessages(messages);
  const latestMessage =
    orderedMessages.length > 0
      ? orderedMessages[orderedMessages.length - 1]
      : null;
  const featuredBody = latestMessage?.bodyText ?? submission.message;
  const showFormMetadata =
    !latestMessage &&
    Boolean(submission.metadata && Object.keys(submission.metadata).length > 0);
  const hasHistory = orderedMessages.length > 0;

  async function toggleTag(tag: LeadTag) {
    const next = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    await onUpdate({ tags: next });
  }

  return (
    <div>
      <div className="bg-surface-container -mx-6 -mt-6 rounded-t-lg px-6 pt-6 pb-8 md:-mx-10 md:-mt-10 md:rounded-tl-none md:px-10 md:pt-10 md:pb-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="space-y-8 md:col-span-8">
            <div>
              <p className="font-label text-outline text-[10px] tracking-widest uppercase">
                Lead
              </p>
              <h2 className="font-headline mt-2 text-3xl font-bold tracking-tighter text-white">
                {submission.senderName}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="bg-surface-container-highest font-label rounded px-2 py-0.5 text-[10px] tracking-widest text-white uppercase">
                  {LEAD_STATUS_LABELS[status]}
                </span>
                <span className="text-outline-variant font-mono text-[10px] uppercase">
                  ID: #{submission.submissionId.slice(0, 8)}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {contactLabel && (
                <MetaRow
                  label="From"
                  value={
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="bg-surface-container-highest flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      >
                        {initialsOf(submission.senderName)}
                      </span>
                      <span className="text-white">{contactLabel}</span>
                    </span>
                  }
                />
              )}
              {fromAddress && <MetaRow label="To" value={fromAddress} />}
              {submission.formName ? (
                <MetaRow label="Form" value={submission.formName} />
              ) : null}
              <MetaRow
                label="Subject"
                value={
                  <span className="font-medium text-white">
                    {subjectOf(submission)}
                  </span>
                }
              />
              <MetaRow
                label="Date"
                value={
                  <span className="font-medium text-white">
                    {formatWhen(submission.submittedAt)}
                  </span>
                }
              />
            </div>
          </div>

          <div className="space-y-6 md:col-span-4">
            <div>
              <label className={labelClass} htmlFor="detail-status">
                Status
              </label>
              <Select
                id="detail-status"
                variant="soft"
                value={status}
                disabled={busy}
                onChange={(next) =>
                  void onUpdate({ status: next as LeadStatus })
                }
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
                variant="soft"
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
                        "font-label rounded text-[9px] font-medium tracking-wider",
                        active
                          ? "text-background hover:text-background border-white bg-white hover:bg-white"
                          : "border-outline-variant/40 text-outline hover:border-white hover:text-white",
                      )}
                    >
                      {LEAD_TAG_LABELS[tag]}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasHistory && (
        <div className="flex justify-center py-6">
          <button
            type="button"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((open) => !open)}
            className="font-label text-outline inline-flex items-center gap-1 text-[10px] tracking-widest uppercase transition-colors hover:text-white"
          >
            <MaterialIcon
              name="expand_more"
              className={cn(
                "text-base transition-transform duration-300 ease-out",
                historyOpen && "rotate-180",
              )}
            />
            {historyOpen ? "Hide history" : "Show history"}
          </button>
        </div>
      )}

      <LeadEmailThreadSection
        formMessage={submission.message}
        formFrom={contactLabel ?? submission.senderName}
        formAt={submission.submittedAt}
        messages={orderedMessages}
        showHistory={historyOpen}
        featuredBody={featuredBody}
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

      <div className={cn("pt-2", hasHistory ? "mt-6" : "mt-10")}>
        <div className="flex justify-center pb-6">
          <button
            type="button"
            aria-expanded={notesOpen}
            onClick={() => setNotesOpen((open) => !open)}
            className="font-label text-outline inline-flex items-center gap-1 text-[10px] tracking-widest uppercase transition-colors hover:text-white"
          >
            <MaterialIcon
              name="expand_more"
              className={cn(
                "text-base transition-transform duration-300 ease-out",
                notesOpen && "rotate-180",
              )}
            />
            {notesOpen
              ? "Hide notes"
              : notes.length > 0
                ? `Show notes (${notes.length})`
                : "Show notes"}
          </button>
        </div>

        {notesOpen && (
          <div>
            <p className={labelClass}>Notes</p>
            <ul className="space-y-4">
              {notes.length === 0 && (
                <li className="text-on-surface-variant text-sm">
                  No notes yet.
                </li>
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
        )}
      </div>
    </div>
  );
}
