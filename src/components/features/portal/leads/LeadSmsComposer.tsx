"use client";

import { useState, type KeyboardEvent } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Button } from "@/components/ui/button";
import { formatPhoneDisplay } from "@/lib/phone";
import { MAX_SMS_BODY_LENGTH, smsSegmentCount } from "@/lib/sms";
import { cn } from "@/lib/utils";

export interface LeadSmsComposerProps {
  /** Lead's phone in E.164. */
  toPhone: string;
  /** Project's sending number in E.164. */
  fromPhone?: string;
  busy?: boolean;
  /** Drop the outer card when a parent already frames the composer. */
  embedded?: boolean;
  onSend: (text: string) => Promise<void>;
}

export function LeadSmsComposer({
  toPhone,
  fromPhone,
  busy = false,
  embedded = false,
  onSend,
}: LeadSmsComposerProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const body = draft.trim();
  const segments = smsSegmentCount(body);
  const disabled = busy || sending || body.length === 0;

  async function submit() {
    if (disabled) return;
    setSending(true);
    try {
      await onSend(body);
      setDraft("");
    } catch {
      // Parent surfaces the failure; keep the draft so it can be retried.
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  }

  if (embedded) {
    return (
      <div className="flex items-center gap-2 border-t border-white/20 px-4 py-3">
        <input
          type="text"
          aria-label="Text message"
          value={draft}
          maxLength={MAX_SMS_BODY_LENGTH}
          disabled={busy || sending}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          className="border-white/15 text-on-surface placeholder:text-outline h-10 min-w-0 flex-1 rounded-lg border bg-transparent px-3 text-sm outline-none disabled:opacity-60"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => void submit()}
          className="font-label text-background hover:text-background shrink-0 rounded bg-white font-medium shadow-sm hover:bg-white/90"
        >
          Send text
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        !embedded &&
          "border-outline-variant/10 bg-surface-container-low mt-8 overflow-hidden rounded-lg border shadow-md",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-4",
          embedded ? "px-6 py-3" : "bg-surface-container-lowest/50 p-4",
        )}
      >
        <span className="font-label text-outline w-8 shrink-0 text-[10px] uppercase">
          To
        </span>
        <span className="bg-surface-container inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-white shadow-sm">
          {formatPhoneDisplay(toPhone)}
        </span>
        {fromPhone && (
          <>
            <span className="font-label text-outline w-10 shrink-0 text-[10px] uppercase">
              From
            </span>
            <span className="bg-surface-container inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-white shadow-sm">
              {formatPhoneDisplay(fromPhone)}
            </span>
          </>
        )}
      </div>

      <textarea
        aria-label="Text message"
        value={draft}
        maxLength={MAX_SMS_BODY_LENGTH}
        disabled={busy || sending}
        rows={4}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        className="text-on-surface placeholder:text-outline w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed outline-none disabled:opacity-60"
      />

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
          !embedded && "bg-surface-container/80",
          embedded && "px-6",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="font-label text-outline text-[10px] uppercase">
            {body.length} / {MAX_SMS_BODY_LENGTH} ·{" "}
            <span className="text-on-surface font-medium">
              {segments} {segments === 1 ? "segment" : "segments"}
            </span>
          </span>
          <span className="text-outline font-mono text-[10px]">
            Cmd + Enter to send
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => void submit()}
          className="font-label text-background hover:text-background rounded bg-white font-medium shadow-sm hover:bg-white/90"
        >
          Send text
          <MaterialIcon name="sms" className="text-sm" />
        </Button>
      </div>
    </div>
  );
}
