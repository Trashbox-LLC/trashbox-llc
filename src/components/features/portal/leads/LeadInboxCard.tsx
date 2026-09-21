"use client";

import type { CSSProperties, JSX } from "react";
import { Select } from "@/components/atoms/Select";
import { LeadStatusBadge } from "@/components/features/portal/leads/LeadStatusBadge";
import { Button } from "@/components/ui/button";
import {
  assigneeIdentity,
  teamMemberDisplayName,
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

function AssigneeEmail({
  assignedTo,
  members,
}: {
  assignedTo: string;
  members: TeamMember[];
}) {
  const email = assigneeIdentity(assignedTo, members).email;
  if (!email) return null;
  return <span className="text-outline min-w-0 truncate">{email}</span>;
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
  /** When set (with members), renders an assignee dropdown on list cards. */
  onAssign?: (assignedTo: string | null) => void;
  assignBusy?: boolean;
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
  onAssign,
  assignBusy = false,
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
  const showAssigneeSelect = Boolean(onAssign);

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
        className="relative z-10 h-auto w-full flex-col items-stretch justify-start rounded-none px-5 pt-4 pb-2 text-left font-normal tracking-normal whitespace-normal text-inherit normal-case hover:bg-transparent"
      >
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
      </Button>

      <div
        data-testid="inbox-card-footer"
        className="relative z-20 flex items-center justify-between gap-3 px-5 pb-4"
      >
        <p className="font-label text-outline min-w-0 truncate text-[10px] tracking-widest uppercase">
          {formatWhen(submittedAt)}
        </p>
        <div className="flex min-w-0 items-center justify-end gap-2">
          {replyCount > 0 && (
            <p
              data-testid="inbox-card-replies"
              className="text-on-surface shrink-0 text-sm font-semibold tabular-nums"
            >
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </p>
          )}
          {showAssigneeSelect && (
            <div className="flex min-w-0 items-baseline justify-end gap-2 text-sm">
              <Select
                aria-label="Assigned to"
                variant="soft"
                listboxAlign="end"
                value={assignedTo ?? ""}
                disabled={assignBusy}
                className="min-w-0 max-w-[8.5rem] shrink"
                onChange={(next) => onAssign?.(next ? next : null)}
                options={[
                  { value: "", label: "Unassigned" },
                  ...members.map((member) => {
                    const name = teamMemberDisplayName(member);
                    return {
                      value: member.email,
                      label: name,
                      menuLabel:
                        name === member.email
                          ? member.email
                          : `${name} (${member.email})`,
                    };
                  }),
                ]}
              />
              {assignedTo ? (
                <AssigneeEmail assignedTo={assignedTo} members={members} />
              ) : null}
            </div>
          )}
          {!showAssigneeSelect && assignedTo && (
            <p className="min-w-0 truncate text-sm">
              <AssigneeName assignedTo={assignedTo} members={members} />
            </p>
          )}
        </div>
      </div>
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
