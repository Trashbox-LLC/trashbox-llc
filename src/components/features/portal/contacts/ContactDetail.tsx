"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Select } from "@/components/atoms/Select";
import { ContactAvatar } from "@/components/features/portal/contacts/ContactAvatar";
import { ContactComposer } from "@/components/features/portal/contacts/ContactComposer";
import { contactSubtitle } from "@/components/features/portal/contacts/contact-display";
import { LeadStatusBadge } from "@/components/features/portal/leads/LeadStatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  teamMemberDisplayName,
  type Contact,
  type ContactLeadRef,
  type MessageChannel,
  type TeamMember,
} from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/phone";
import { labeledContactPhones } from "@/lib/phone-labels";
import { cn } from "@/lib/utils";

const labelClass =
  "mb-1 block font-label text-[10px] uppercase tracking-widest text-outline";

/** Round icon button with a caption, the way a phone contact card reads. */
function ContactAction({
  icon,
  label,
  href,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: string;
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span
        className={cn(
          "grid size-11 place-content-center rounded-full transition-colors",
          active
            ? "bg-white text-background"
            : "bg-surface-container-high text-on-surface group-hover:bg-surface-container-highest",
        )}
      >
        <MaterialIcon name={icon} className="text-xl!" />
      </span>
      <span className="font-label text-outline text-[10px] tracking-widest uppercase">
        {label}
      </span>
    </>
  );

  const shell =
    "group flex h-auto flex-col items-center gap-1.5 rounded-lg bg-transparent p-1 hover:bg-transparent";

  if (href) {
    return (
      <a href={href} aria-label={label} className={shell}>
        {body}
      </a>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={shell}
    >
      {body}
    </Button>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface ContactDetailProps {
  contact: Contact;
  leads: ContactLeadRef[];
  members: TeamMember[];
  busy?: boolean;
  error?: string | null;
  canDelete?: boolean;
  /** Channels the project can reach this contact on; omit to hide sending. */
  availableChannels?: MessageChannel[];
  /** Project's sending number, shown as the From on texts. */
  smsFromPhone?: string | null;
  smsOptedOut?: boolean;
  onEdit: () => void;
  onBack: () => void;
  onOwnerChange: (ownerEmail: string | null) => void;
  onAddNote: (body: string) => Promise<void>;
  onSendMessage?: (input: {
    channel: MessageChannel;
    body: string;
    subject?: string;
  }) => Promise<void>;
  /** Opens text messaging settings when the project has no number yet. */
  onConfigureSms?: () => void;
  /** Opens email settings when no mailbox is connected yet. */
  onConfigureEmail?: () => void;
  onDelete: () => void;
  onOpenLead: (submissionId: string) => void;
}

export function ContactDetail({
  contact,
  leads,
  members,
  busy = false,
  error = null,
  canDelete = false,
  availableChannels = [],
  smsFromPhone,
  smsOptedOut = false,
  onEdit,
  onBack,
  onOwnerChange,
  onAddNote,
  onSendMessage,
  onConfigureSms,
  onConfigureEmail,
  onDelete,
  onOpenLead,
}: ContactDetailProps) {
  const [noteDraft, setNoteDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [composing, setComposing] = useState<MessageChannel | null>(null);
  const subtitle = contactSubtitle(contact);

  const phone = contact.phones[0];
  const email = contact.emails[0];
  const canSend = Boolean(onSendMessage);
  const canEmail = canSend && availableChannels.includes("email");
  const canText = canSend && availableChannels.includes("sms");

  return (
    <div className="space-y-8">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="text-outline h-auto rounded p-0 font-label text-[10px] tracking-widest uppercase hover:text-white"
      >
        All contacts
      </Button>

      {error && (
        <p className="border-error/40 bg-error/10 text-error rounded border p-3 text-sm">
          {error}
        </p>
      )}

      <header className="flex flex-col items-center gap-4 text-center">
        <ContactAvatar displayName={contact.displayName} size="xl" />
        <div className="max-w-full">
          <h1 className="font-headline truncate text-3xl font-bold tracking-tight text-white">
            {contact.displayName}
          </h1>
          {subtitle && subtitle !== contact.displayName && (
            <p className="text-on-surface-variant mt-1 truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {phone && (
            <ContactAction
              icon="sms"
              label="Text"
              active={composing === "sms"}
              disabled={smsOptedOut}
              onClick={() => {
                if (smsOptedOut) return;
                if (canText) {
                  setComposing(composing === "sms" ? null : "sms");
                  return;
                }
                onConfigureSms?.();
              }}
            />
          )}
          {phone && (
            <ContactAction icon="call" label="Call" href={`tel:${phone}`} />
          )}
          {email && (
            <ContactAction
              icon="mail"
              label="Email"
              active={composing === "email"}
              onClick={() => {
                if (canEmail) {
                  setComposing(composing === "email" ? null : "email");
                  return;
                }
                onConfigureEmail?.();
              }}
            />
          )}
        </div>

        {smsOptedOut && (
          <p className="text-outline text-xs">
            {contact.displayName} replied STOP, so texts are blocked.
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onEdit}
            className="text-on-surface-variant rounded font-label font-medium hover:text-white"
          >
            Edit
          </Button>
          {canDelete && !confirmDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              className="text-outline rounded font-label font-medium hover:text-white"
            >
              Delete
            </Button>
          )}
          {canDelete && confirmDelete && (
            <>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={onDelete}
                className="text-error rounded font-label font-medium hover:text-error"
              >
                Confirm delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
                className="text-outline rounded font-label font-medium hover:text-white"
              >
                Keep
              </Button>
            </>
          )}
        </div>
      </header>

      {composing && onSendMessage && (
        <ContactComposer
          channel={composing}
          channels={availableChannels}
          toEmail={email}
          toPhone={phone}
          fromPhone={smsFromPhone ?? undefined}
          busy={busy}
          onChannelChange={setComposing}
          onSend={async ({ body, subject }) => {
            await onSendMessage({ channel: composing, body, subject });
            setComposing(null);
          }}
          onCancel={() => setComposing(null)}
        />
      )}

      <section className="grid grid-cols-1 gap-6 rounded bg-surface-container-low p-6 shadow-sm sm:grid-cols-2">
        <div>
          <p className={labelClass}>Email</p>
          {contact.emails.length === 0 ? (
            <p className="text-outline text-sm">None</p>
          ) : (
            <ul className="space-y-1">
              {contact.emails.map((address) => (
                <li key={address} className="text-sm text-white">
                  {address}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className={labelClass}>Phone</p>
          {contact.phones.length === 0 ? (
            <p className="text-outline text-sm">None</p>
          ) : (
            <ul className="space-y-1">
              {labeledContactPhones(contact).map((phone) => (
                <li key={phone.number} className="flex items-baseline gap-2 text-sm">
                  <span className="text-outline capitalize">{phone.label}</span>
                  <a
                    href={`tel:${phone.number}`}
                    className="text-white underline-offset-4 hover:underline"
                  >
                    {formatPhoneDisplay(phone.number)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {contact.address && (
          <div>
            <p className={labelClass}>Address</p>
            <p className="text-sm text-white">{contact.address}</p>
          </div>
        )}
        {contact.website && (
          <div>
            <p className={labelClass}>Website</p>
            <a
              href={contact.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-white underline-offset-4 hover:underline"
            >
              {contact.website}
            </a>
          </div>
        )}
        <div>
          <p className={labelClass}>Owner</p>
          <Select
            aria-label="Owner"
            value={contact.ownerEmail ?? ""}
            disabled={busy}
            onChange={(next) => onOwnerChange(next ? next : null)}
            options={[
              { value: "", label: "Unassigned" },
              ...members.map((member) => {
                const label = teamMemberDisplayName(member);
                return {
                  value: member.email,
                  label,
                  menuLabel:
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
          {contact.tags.length === 0 ? (
            <p className="text-outline text-sm">None</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-surface-container-highest text-on-surface-variant font-label rounded-full px-2 py-0.5 text-[10px] tracking-widest uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <p className={labelClass}>
          Leads {leads.length > 0 && `· ${leads.length}`}
        </p>
        {leads.length === 0 ? (
          <p className="text-on-surface-variant text-sm">
            Nothing has come in from this contact yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {leads.map((lead) => (
              <li key={lead.submissionId}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenLead(lead.submissionId)}
                  className="h-auto w-full items-center justify-between gap-3 rounded bg-surface-container-low p-4 text-left font-normal tracking-normal whitespace-normal text-inherit normal-case shadow-sm hover:bg-surface-container-high"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {lead.senderName}
                    </span>
                    <span className="font-label text-outline mt-0.5 block text-[10px] tracking-widest uppercase">
                      {formatWhen(lead.submittedAt)}
                    </span>
                  </span>
                  <LeadStatusBadge status={lead.status} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className={labelClass}>Notes</p>
        <ul className="space-y-4">
          {contact.notes.length === 0 && (
            <li className="text-on-surface-variant text-sm">No notes yet.</li>
          )}
          {contact.notes.map((note) => (
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
            // Failures surface through `error`; keep the draft so it survives.
            void onAddNote(body).then(
              () => setNoteDraft(""),
              () => {},
            );
          }}
        >
          <label className={labelClass} htmlFor="contact-note">
            Add note
          </label>
          <Textarea
            id="contact-note"
            rows={3}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            className="border-outline-variant/20 placeholder:text-outline focus-visible:border-primary min-h-0 border px-3 py-3"
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !noteDraft.trim()}>
            Save note
          </Button>
        </form>
      </section>
    </div>
  );
}
