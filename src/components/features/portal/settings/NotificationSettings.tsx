"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  NOTIFICATION_EVENTS,
  type EventToggles,
  type NotificationEvent,
  type NotificationSettings as NotificationSettingsMap,
} from "@/lib/api";

const EVENT_LABELS: Record<NotificationEvent, string> = {
  lead_created: "New lead arrives",
  sms_inbound: "Inbound text",
  email_inbound: "Email reply on a thread",
  lead_assigned: "A lead is assigned to me",
  lead_note_added: "Note added to a lead I own",
  lead_status_changed: "Status changes on a lead I own",
  contact_created: "New contact created",
};

interface NotificationSettingsProps {
  settings: NotificationSettingsMap;
  loading?: boolean;
  busy?: boolean;
  error?: string | null;
  /** No mobile device has registered for push on this account yet. */
  pushUnavailable?: boolean;
  onToggle: (
    event: NotificationEvent,
    channel: keyof EventToggles,
    enabled: boolean,
  ) => void;
}

export function NotificationSettings({
  settings,
  loading = false,
  busy = false,
  error = null,
  pushUnavailable = false,
  onToggle,
}: NotificationSettingsProps) {
  if (loading) {
    return (
      <p className="text-on-surface-variant text-sm">
        Loading notification settings…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="border-error/40 bg-error/10 text-error rounded border p-3 text-sm">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded bg-surface-container-low shadow-sm">
        <div className="border-outline-variant/20 grid grid-cols-[1fr_4rem_4rem] items-center gap-2 border-b px-5 py-3">
          <span />
          <span className="font-label text-outline text-center text-[10px] tracking-widest uppercase">
            Push
          </span>
          <span className="font-label text-outline text-center text-[10px] tracking-widest uppercase">
            Email
          </span>
        </div>
        <ul className="divide-outline-variant/20 divide-y">
          {NOTIFICATION_EVENTS.map((event) => {
            const toggles = settings[event];
            return (
              <li
                key={event}
                className="grid grid-cols-[1fr_4rem_4rem] items-center gap-2 px-5 py-4"
              >
                <span className="text-sm text-white">
                  {EVENT_LABELS[event]}
                </span>
                <span className="flex justify-center">
                  <Checkbox
                    aria-label={`${EVENT_LABELS[event]} push`}
                    checked={toggles.push}
                    disabled={busy || pushUnavailable}
                    onCheckedChange={(next) =>
                      onToggle(event, "push", next === true)
                    }
                  />
                </span>
                <span className="flex justify-center">
                  <Checkbox
                    aria-label={`${EVENT_LABELS[event]} email`}
                    checked={toggles.email}
                    disabled={busy}
                    onCheckedChange={(next) =>
                      onToggle(event, "email", next === true)
                    }
                  />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {pushUnavailable && (
        <p className="text-on-surface-variant text-sm">
          Sign in on the Trashbox mobile app to turn on push.
        </p>
      )}
    </div>
  );
}
