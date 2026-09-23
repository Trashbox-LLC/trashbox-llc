import {
  messageChannelOf,
  teamMemberDisplayName,
  type LeadMessage,
  type MessageChannel,
  type Submission,
} from "@/lib/api";
import {
  defaultPhoneLabel,
  type ContactPhone,
} from "@/lib/phone-labels";
import { formatPhoneDisplay } from "@/lib/phone";

/**
 * Best identifier to show for a lead. Texted-in leads have no email address,
 * so the phone number is the only thing that identifies them.
 */
export function leadContactLabel(submission: {
  senderEmail?: string;
  senderPhone?: string;
}): string | null {
  const email = submission.senderEmail?.trim();
  if (email) return email;
  const phone = submission.senderPhone?.trim();
  if (phone) return formatPhoneDisplay(phone);
  return null;
}

/**
 * Numbers to offer on a lead. The contact's list comes first; the number the
 * conversation already uses stays available when it is not on that list.
 */
export function contactPhoneChoices(
  phones: ContactPhone[],
  selected?: string,
): ContactPhone[] {
  const choices: ContactPhone[] = [];
  for (const phone of phones) {
    const number = phone.number.trim();
    if (!number || choices.some((item) => item.number === number)) continue;
    choices.push({
      number,
      label: phone.label.trim() || defaultPhoneLabel(choices.length),
    });
  }
  const current = selected?.trim();
  if (current && !choices.some((item) => item.number === current)) {
    choices.unshift({ number: current, label: defaultPhoneLabel(0) });
  }
  return choices;
}

/**
 * Copy a contact's current phone onto the leads that belong to them.
 * A blank phone clears the number so the conversation stops offering a text.
 */
export function applyContactPhoneToLeads(
  leads: Submission[],
  contactId: string,
  phone: string | null,
): Submission[] {
  const next = phone?.trim() || undefined;
  return leads.map((lead) => {
    if (lead.contactId !== contactId) return lead;
    if ((lead.senderPhone?.trim() || undefined) === next) return lead;
    if (!next) {
      const rest = { ...lead };
      delete rest.senderPhone;
      return rest;
    }
    return { ...lead, senderPhone: next };
  });
}

export interface ComposerChannelOptions {
  /** Channel the user last picked. */
  requested: MessageChannel;
  canEmail: boolean;
  canSms: boolean;
}

/**
 * The channel to compose on. Honours the user's pick when that channel is
 * still usable, so losing one channel mid-session does not strand the composer.
 */
export function resolveComposerChannel({
  requested,
  canEmail,
  canSms,
}: ComposerChannelOptions): MessageChannel | null {
  if (requested === "sms" && canSms) return "sms";
  if (requested === "email" && canEmail) return "email";
  if (canEmail) return "email";
  if (canSms) return "sms";
  return null;
}

export interface LeadMessageTimelineLabels {
  eyebrow: string;
  title: string;
  icon: string;
  iconLabel: string;
  accent: "primary" | "muted";
}

const QUOTE_HEADER =
  /^(?:On [^\n]*\bwrote:\s*|-{5,}\s*Original Message\s*-{5,}|From:\s[^\n]+\nSent:\s)/im;

/**
 * Form text without a leading `[value]` line that duplicates metadata.
 * Older contact submissions stored the chosen service that way.
 */
export function formSubmissionMessage(
  message: string,
  metadata?: Record<string, string>,
): string {
  const match = message.match(/^\[([^\]]+)\]\n\n([\s\S]*)$/);
  if (!match) return message;
  const copied = Object.values(metadata ?? {}).some((value) => value === match[1]);
  return copied ? match[2] : message;
}

/** Reply text without the quoted copy of the earlier email. */
export function visibleReplyText(body: string): string {
  const normalized = body.replace(/\r\n/g, "\n");
  const header = QUOTE_HEADER.exec(normalized);
  const cut = header ? header.index : normalized.length;
  const visible = normalized
    .slice(0, cut)
    .replace(/\n(?:> ?.*(?:\n|$))+$/g, "")
    .trim();
  return visible.length > 0 ? visible : body.trim();
}

export function messageSenderPresentation(input: {
  direction: "inbound" | "outbound";
  from: string;
  sentBy?: string;
  leadName?: string;
  members?: {
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }[];
}): { name: string; email: string | null; side: "start" | "end" } {
  if (input.direction === "inbound") {
    const name = input.leadName?.trim() || input.from;
    return {
      name,
      email: addressBeside(name, input.from),
      side: "start",
    };
  }

  const member =
    input.members?.find(
      (item) => input.sentBy && item.email === input.sentBy,
    ) ?? input.members?.find((item) => item.email === input.from);
  const memberName = member ? teamMemberDisplayName(member) : "";
  const named = member && memberName !== member.email ? memberName : "";
  const name = named || input.from;
  return {
    name,
    email: addressBeside(name, input.from),
    side: "end",
  };
}

function addressBeside(name: string, address: string): string | null {
  const value = address.trim();
  if (!value || value === name) return null;
  return value;
}

/** Layout-builder HTML. A plain rich-text reply has no document marker. */
export function designedEmailHtml(bodyHtml: string | undefined): string | null {
  const html = bodyHtml?.trim();
  if (!html || !html.includes("data-tb-doc")) return null;
  return html;
}

/** Presentation of one thread entry, which differs by channel and direction. */
export function leadMessageTimelineLabels(
  message: LeadMessage,
): LeadMessageTimelineLabels {
  const channel = messageChannelOf(message);
  const sms = channel === "sms";
  const outbound = message.direction === "outbound";
  const address = (value: string) => (sms ? formatPhoneDisplay(value) : value);

  const sentVerb = sms ? "Text sent" : "Sent";
  const receivedVerb = sms ? "Text received" : "Received";

  return {
    eyebrow: outbound
      ? `${sentVerb} ${address(message.from)} → ${address(message.to)}`
      : `${receivedVerb} ← ${address(message.from)}`,
    // Texts have no subject line, so a stored one is never meaningful.
    title: sms
      ? outbound
        ? "Text sent"
        : "Text received"
      : message.subject || (outbound ? "Reply sent" : "Reply received"),
    icon: sms ? "sms" : outbound ? "send" : "inbox",
    iconLabel: sms
      ? outbound
        ? "Text sent event"
        : "Text received event"
      : outbound
        ? "Sent message event"
        : "Received message event",
    accent: outbound ? "primary" : "muted",
  };
}
