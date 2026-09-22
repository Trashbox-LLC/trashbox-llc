"use client";

import { Button } from "@/components/ui/button";
import type { MailboxProvider, MailboxStatusResponse } from "@/lib/api";
import { formatSyncedAgo } from "@/components/features/portal/settings/mailbox-sync-age";

export interface MailboxSettingsProps {
  canManage?: boolean;
  mailbox: MailboxStatusResponse | null;
  busy?: boolean;
  error?: string | null;
  onConnect: (provider: MailboxProvider) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSync: () => Promise<void>;
}

function providerLabel(provider?: MailboxProvider): string {
  if (provider === "gmail") return "Google Workspace";
  if (provider === "microsoft") return "Microsoft 365";
  return "";
}

function connectedSummary(mailbox: MailboxStatusResponse): string {
  const synced = mailbox.lastSyncAt ? formatSyncedAgo(mailbox.lastSyncAt) : "";
  return [
    providerLabel(mailbox.provider),
    mailbox.connectedBy,
    synced,
    mailbox.status === "error" ? "Sync error" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function GmailMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-6" aria-hidden="true">
      <path
        fill="#4caf50"
        d="M45 16.2 40 18.95 35 23.7V40h7c1.657 0 3-1.343 3-3V16.2z"
      />
      <path
        fill="#1e88e5"
        d="M3 16.2 6.614 17.91 13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z"
      />
      <polygon
        fill="#e53935"
        points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"
      />
      <path
        fill="#c62828"
        d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.132 8.301 8.228 8 7.298 8 4.924 8 3 9.924 3 12.298z"
      />
      <path
        fill="#fbc02d"
        d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.868 8.301 39.772 8 40.702 8 43.076 8 45 9.924 45 12.298z"
      />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 21 21" className="size-5" aria-hidden="true">
      <rect fill="#f25022" x="1" y="1" width="9" height="9" />
      <rect fill="#7fba00" x="11" y="1" width="9" height="9" />
      <rect fill="#00a4ef" x="1" y="11" width="9" height="9" />
      <rect fill="#ffb900" x="11" y="11" width="9" height="9" />
    </svg>
  );
}

function ProviderMark({ provider }: { provider?: MailboxProvider }) {
  return (
    <span className="border-outline-variant/20 bg-surface-container flex size-10 shrink-0 items-center justify-center rounded-md border">
      {provider === "microsoft" ? <MicrosoftMark /> : <GmailMark />}
    </span>
  );
}

const rowClass =
  "border-outline-variant/20 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between";

export function MailboxSettings({
  canManage = false,
  mailbox,
  busy = false,
  error,
  onConnect,
  onDisconnect,
  onSync,
}: MailboxSettingsProps) {
  const connected = Boolean(mailbox?.connected);

  return (
    <div className="space-y-3">
      {error && (
        <p className="border-error/40 bg-error/10 text-error border p-4 text-sm">
          {error}
        </p>
      )}

      {connected && mailbox ? (
        <div className={rowClass}>
          <div className="flex min-w-0 items-center gap-3">
            <ProviderMark provider={mailbox.provider} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {mailbox.email}
              </p>
              <p className="text-on-surface-variant truncate text-xs">
                {connectedSummary(mailbox)}
              </p>
              {mailbox.lastError && (
                <p className="text-error mt-1 text-xs">{mailbox.lastError}</p>
              )}
            </div>
          </div>

          {canManage ? (
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md px-4"
                disabled={busy}
                onClick={() => void onSync()}
              >
                Sync
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md px-4"
                disabled={busy}
                onClick={() => void onDisconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm">
              You need Manage Email Sender Display Names to disconnect or sync
              the mailbox.
            </p>
          )}
        </div>
      ) : (
        <div className={rowClass}>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">
              No mailbox connected
            </p>
            {!canManage && (
              <p className="text-on-surface-variant mt-1 text-xs">
                Ask someone with Manage Email Sender Display Names to connect
                one.
              </p>
            )}
          </div>
          {canManage && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md px-4"
                disabled={busy}
                onClick={() => void onConnect("gmail")}
              >
                Connect Google Workspace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md px-4"
                disabled={busy}
                onClick={() => void onConnect("microsoft")}
              >
                Connect Microsoft 365
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
