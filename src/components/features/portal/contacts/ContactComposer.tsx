"use client";

import { useState, type KeyboardEvent } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MessageChannel } from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/phone";
import { MAX_SMS_BODY_LENGTH, smsSegmentCount } from "@/lib/sms";
import { cn } from "@/lib/utils";

export interface ContactComposerProps {
  channel: MessageChannel;
  /** Both channels render a switch; one renders none. */
  channels: MessageChannel[];
  toEmail?: string;
  toPhone?: string;
  /** Project's sending number in E.164. */
  fromPhone?: string;
  busy?: boolean;
  onChannelChange: (next: MessageChannel) => void;
  onSend: (input: { body: string; subject?: string }) => Promise<void>;
  onCancel: () => void;
}

export function ContactComposer({
  channel,
  channels,
  toEmail,
  toPhone,
  fromPhone,
  busy = false,
  onChannelChange,
  onSend,
  onCancel,
}: ContactComposerProps) {
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);

  const sms = channel === "sms";
  const body = draft.trim();
  const segments = smsSegmentCount(body);
  const disabled = busy || sending || body.length === 0;
  const recipient = sms
    ? toPhone
      ? formatPhoneDisplay(toPhone)
      : ""
    : (toEmail ?? "");

  async function submit() {
    if (disabled) return;
    setSending(true);
    try {
      await onSend({
        body,
        ...(!sms && subject.trim() ? { subject: subject.trim() } : {}),
      });
      setDraft("");
      setSubject("");
    } catch {
      // Parent surfaces the failure; keep the draft so it can be retried.
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className="border-outline-variant/10 bg-surface-container-low overflow-hidden rounded-lg border shadow-md">
      <div className="bg-surface-container-lowest/50 flex flex-wrap items-center gap-3 p-4">
        <span className="font-label text-outline shrink-0 text-[10px] uppercase">
          To
        </span>
        <span className="bg-surface-container inline-flex items-center rounded px-2 py-1 text-xs text-white shadow-sm">
          {recipient}
        </span>
        {sms && fromPhone && (
          <>
            <span className="font-label text-outline shrink-0 text-[10px] uppercase">
              From
            </span>
            <span className="bg-surface-container inline-flex items-center rounded px-2 py-1 text-xs text-white shadow-sm">
              {formatPhoneDisplay(fromPhone)}
            </span>
          </>
        )}
        {channels.length > 1 && (
          <div className="ml-auto flex items-center gap-1">
            {channels.map((option) => (
              <Button
                key={option}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={channel === option}
                disabled={busy || sending}
                onClick={() => onChannelChange(option)}
                className={cn(
                  "font-label h-auto rounded px-2 py-1 text-[10px] tracking-widest uppercase",
                  channel === option
                    ? "bg-surface-container text-white"
                    : "text-outline hover:text-white",
                )}
              >
                {option === "sms" ? "Text" : "Email"}
              </Button>
            ))}
          </div>
        )}
      </div>

      {!sms && (
        <div className="border-outline-variant/10 border-b px-4 py-2">
          <Input
            aria-label="Subject"
            value={subject}
            disabled={busy || sending}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            className="placeholder:text-outline h-auto border-0 bg-transparent px-0 py-1 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      )}

      <textarea
        aria-label={sms ? "Text message" : "Message"}
        value={draft}
        maxLength={sms ? MAX_SMS_BODY_LENGTH : undefined}
        disabled={busy || sending}
        rows={5}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        className="text-on-surface placeholder:text-outline w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed outline-none disabled:opacity-60"
      />

      <div className="bg-surface-container/80 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {sms && (
            <span className="font-label text-outline text-[10px] uppercase">
              {body.length} / {MAX_SMS_BODY_LENGTH} ·{" "}
              <span className="text-on-surface font-medium">
                {segments} {segments === 1 ? "segment" : "segments"}
              </span>
            </span>
          )}
          <span className="text-outline font-mono text-[10px]">
            Cmd + Enter to send
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={sending}
            onClick={onCancel}
            className="text-outline font-label rounded font-medium hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            onClick={() => void submit()}
            className="font-label text-background hover:text-background rounded bg-white font-medium shadow-sm hover:bg-white/90"
          >
            {sms ? "Send text" : "Send email"}
            <MaterialIcon name={sms ? "sms" : "send"} className="text-sm" />
          </Button>
        </div>
      </div>
    </div>
  );
}
