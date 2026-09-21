import {
  messageChannelOf,
  type LeadMessage,
  type MessageChannel,
} from "@/lib/api";
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
