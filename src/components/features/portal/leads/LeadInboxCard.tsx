"use client";

import type { CSSProperties, JSX } from "react";
import { LeadStatusBadge } from "@/components/features/portal/leads/LeadStatusBadge";
import { Button } from "@/components/ui/button";
import {
  assigneeIdentity,
  type LeadStatus,
  type TeamMember,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/** Visible cards in the stack: front card + up to 2 peeking layers below. */
export function inboxCardStackDepth(replyCount: number): number {
  if (replyCount <= 0) return 1;
  return Math.min(3, replyCount + 1);
}

/** Equal step for each under-card (down + left). */
const STACK_STEP = "0.5rem";

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

/** Side-list date: "Sep 14", first letter only. */
export function formatInboxCardDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

/** "Edward Moore" → "EM". A single name uses its first two letters. */
export function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AssigneeName({
  assignedTo,
  members,
}: {
  assignedTo: string;
  members: TeamMember[];
}) {
  const assignee = assigneeIdentity(assignedTo, members);
  return (
    <span className="inline-flex min-w-0 items-baseline gap-2">
      <span className="truncate text-white">{assignee.name}</span>
      {assignee.email ? (
        <span className="text-outline truncate">{assignee.email}</span>
      ) : null}
    </span>
  );
}

export interface LeadInboxCardProps {
  senderName: string;
  senderEmail: string;
  message: string;
  /** Named project form label when the lead was tagged on submit. */
  formName?: string | null;
  submittedAt: string;
  status: LeadStatus;
  active?: boolean;
  /** Number of email replies on the thread (not including the form submission). */
  replyCount?: number;
  assignedTo?: string | null;
  members?: TeamMember[];
  /**
   * "list" is the vertical master-list card (default). "activity" is the
   * compact horizontal card used in the Recent Activity rail.
   */
  variant?: "list" | "activity";
  /**
   * Opt-in stacked under-cards for list variant (based on replyCount).
   * Off by default — single flat card.
   */
  stacked?: boolean;
  onSelect: () => void;
}

export function LeadInboxCard({
  senderName,
  senderEmail,
  message,
  formName,
  submittedAt,
  status,
  active = false,
  replyCount = 0,
  assignedTo,
  members = [],
  variant = "list",
  stacked = false,
  onSelect,
}: LeadInboxCardProps): JSX.Element {
  if (variant === "activity") {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        aria-pressed={active}
        className={cn(
          "h-auto w-[300px] shrink-0 snap-start flex-col items-stretch justify-start rounded p-5 text-left font-normal tracking-normal whitespace-normal text-inherit normal-case",
          active
            ? "bg-surface-container-high hover:bg-surface-container-high shadow-md"
            : "bg-surface-container-low hover:bg-surface-container",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-headline truncate text-base font-bold text-white">
              {senderName}
            </p>
            <p className="text-outline mt-0.5 truncate text-xs">
              {senderEmail}
            </p>
          </div>
          <LeadStatusBadge status={status} />
        </div>
        <p className="text-on-surface mt-2 line-clamp-2 text-sm">{message}</p>
        {assignedTo && (
          <p className="mt-2 truncate text-sm">
            <AssigneeName assignedTo={assignedTo} members={members} />
          </p>
        )}
        <p className="text-outline-variant mt-3 font-mono text-[10px] uppercase">
          {formatWhen(submittedAt)}
          {replyCount > 0 && (
            <>
              {" · "}
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </>
          )}
        </p>
      </Button>
    );
  }

  const depth = stacked ? inboxCardStackDepth(replyCount) : 1;
  const behind = depth - 1;

  const card = (
    <div
      className={cn(
        "relative",
        active
          ? "bg-surface-container-high"
          : "bg-surface-container-low hover:bg-surface-container-high",
        behind === 1 && "[box-shadow:var(--stack-1-fill)]",
        behind >= 2 && "[box-shadow:var(--stack-1-fill),var(--stack-2-fill)]",
      )}
      style={
        behind > 0
          ? ({
              "--stack-1-fill": `calc(${STACK_STEP} * -1) ${STACK_STEP} 0 0 var(--color-surface-container-high)`,
              "--stack-2-fill": `calc(${STACK_STEP} * -2) calc(${STACK_STEP} * 2) 0 0 var(--color-surface-container-highest)`,
            } as CSSProperties)
          : undefined
      }
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        data-stack-depth={stacked ? depth : undefined}
        aria-pressed={active}
        className="relative z-10 h-auto w-full flex-col items-stretch justify-start rounded-none px-5 py-4 text-left font-normal tracking-normal whitespace-normal text-inherit normal-case hover:bg-transparent"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="bg-surface-container-highest flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          >
            {contactInitials(senderName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-headline text-sm font-bold text-white">
                {senderName}
              </p>
              <LeadStatusBadge status={status} />
            </div>
            <p className="text-outline mt-1 text-xs">{senderEmail}</p>
            {formName ? (
              <p className="font-label text-outline mt-2 text-[10px] tracking-widest uppercase">
                {formName}
              </p>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-outline min-w-0 truncate text-xs">
                {formatInboxCardDate(submittedAt)}
              </p>
              {replyCount > 0 && (
                <p
                  data-testid="inbox-card-replies"
                  className="text-on-surface shrink-0 text-sm font-semibold tabular-nums"
                >
                  {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </p>
              )}
            </div>
          </div>
        </div>
      </Button>
    </div>
  );

  if (!stacked || behind === 0) {
    return card;
  }

  return (
    <div
      className={cn(
        // Clearance for the offset stack shadows so list gap stays even.
        behind === 1 && "pb-2 pl-2",
        behind >= 2 && "pb-4 pl-4",
      )}
      data-testid="inbox-card-stack"
      data-stack-behind={behind}
    >
      {card}
    </div>
  );
}
