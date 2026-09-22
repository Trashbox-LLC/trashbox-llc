"use client";

import {
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { LeadInboxCard } from "@/components/features/portal/leads/LeadInboxCard";
import {
  LeadInboxFilters,
  type LeadInboxFiltersValue,
} from "@/components/features/portal/leads/LeadInboxFilters";
import { Button } from "@/components/ui/button";
import {
  collectLeadTags,
  leadStatusOf,
  type ProjectForm,
  type Submission,
  type TeamMember,
} from "@/lib/api";
import { leadContactLabel } from "@/lib/lead-messages";
import { cn } from "@/lib/utils";

export const INBOX_SIDEBAR_DEFAULT_WIDTH = 320;
export const INBOX_SIDEBAR_MIN_WIDTH = 240;
export const INBOX_SIDEBAR_MAX_WIDTH = 520;
/** Open / restore width for the leads panel. */
export const INBOX_SIDEBAR_SNAP_WIDTH = INBOX_SIDEBAR_DEFAULT_WIDTH;

export function clampInboxSidebarWidth(width: number): number {
  return Math.min(
    INBOX_SIDEBAR_MAX_WIDTH,
    Math.max(INBOX_SIDEBAR_MIN_WIDTH, Math.round(width)),
  );
}

/** Live drag range — allows shrinking toward closed while dragging. */
export function clampInboxSidebarDragWidth(width: number): number {
  return Math.min(INBOX_SIDEBAR_MAX_WIDTH, Math.max(0, Math.round(width)));
}

export interface LeadInboxSidebarToggleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  tabIndex?: number;
}

/** Compact icon control to show or hide the leads sidebar. */
export function LeadInboxSidebarToggle({
  open,
  onOpenChange,
  className,
  tabIndex,
}: LeadInboxSidebarToggleProps): JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={open ? "Hide leads panel" : "Show leads panel"}
      aria-expanded={open}
      tabIndex={tabIndex}
      className={cn("text-white/60 hover:text-white", className)}
      onClick={() => onOpenChange(!open)}
    >
      <MaterialIcon
        name={open ? "left_panel_close" : "left_panel_open"}
        className="text-xl"
      />
    </Button>
  );
}

export interface LeadInboxResizeHandleProps {
  /** Current sidebar width in px (used for drag-shrink feedback). */
  width: number;
  onWidthChange: (width: number) => void;
  onOpenChange: (open: boolean) => void;
  onDraggingChange?: (dragging: boolean) => void;
  className?: string;
}

/** Handle on the email pane’s left edge — click closes; drag resizes. */
export function LeadInboxResizeHandle({
  width,
  onWidthChange,
  onOpenChange,
  onDraggingChange,
  className,
}: LeadInboxResizeHandleProps): JSX.Element {
  const dragRef = useRef<{
    startX: number;
    startWidth: number;
    moved: boolean;
    lastWidth: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  function setDraggingState(next: boolean) {
    setDragging(next);
    onDraggingChange?.(next);
  }

  function closeToSnap() {
    onWidthChange(INBOX_SIDEBAR_SNAP_WIDTH);
    onOpenChange(false);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startWidth = clampInboxSidebarDragWidth(width);
    dragRef.current = {
      startX: event.clientX,
      startWidth,
      moved: false,
      lastWidth: startWidth,
    };
    setDraggingState(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) >= 3) {
      drag.moved = true;
    }
    const next = clampInboxSidebarDragWidth(drag.startWidth + delta);
    drag.lastWidth = next;
    onWidthChange(next);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const drag = dragRef.current;
    dragRef.current = null;
    setDraggingState(false);

    if (!drag || !drag.moved) {
      closeToSnap();
      return;
    }

    if (drag.lastWidth < INBOX_SIDEBAR_MIN_WIDTH) {
      closeToSnap();
      return;
    }

    onWidthChange(clampInboxSidebarWidth(drag.lastWidth));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowLeft"
    ) {
      event.preventDefault();
      closeToSnap();
    }
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize leads panel"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={INBOX_SIDEBAR_MAX_WIDTH}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn(
        "absolute top-0 left-0 z-10 flex h-full w-3 -translate-x-1/2 cursor-col-resize touch-none items-stretch justify-center",
        "after:bg-outline-variant/40 after:my-auto after:h-12 after:w-px after:transition-colors",
        "hover:after:bg-white/50 focus-visible:outline-none focus-visible:after:bg-white",
        dragging && "after:bg-white",
        className,
      )}
    />
  );
}

/** Handle on the email pane’s left edge when closed — click/drag opens. */
export interface LeadInboxOpenHandleProps {
  onOpenChange: (open: boolean) => void;
  onWidthChange: (width: number) => void;
  onDraggingChange?: (dragging: boolean) => void;
  className?: string;
}

export function LeadInboxOpenHandle({
  onOpenChange,
  onWidthChange,
  onDraggingChange,
  className,
}: LeadInboxOpenHandleProps): JSX.Element {
  const dragRef = useRef<{
    startX: number;
    moved: boolean;
    lastWidth: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  function setDraggingState(next: boolean) {
    setDragging(next);
    onDraggingChange?.(next);
  }

  function openToSnap() {
    onWidthChange(INBOX_SIDEBAR_SNAP_WIDTH);
    onOpenChange(true);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      moved: false,
      lastWidth: 0,
    };
    setDraggingState(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) >= 3) {
      drag.moved = true;
    }
    const next = clampInboxSidebarDragWidth(delta);
    drag.lastWidth = next;
    onWidthChange(next);
    if (next > 0) {
      onOpenChange(true);
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const drag = dragRef.current;
    dragRef.current = null;
    setDraggingState(false);

    if (!drag || !drag.moved) {
      openToSnap();
      return;
    }

    if (drag.lastWidth < INBOX_SIDEBAR_MIN_WIDTH) {
      onWidthChange(INBOX_SIDEBAR_SNAP_WIDTH);
      onOpenChange(false);
      return;
    }

    onWidthChange(clampInboxSidebarWidth(drag.lastWidth));
    onOpenChange(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowRight"
    ) {
      event.preventDefault();
      openToSnap();
    }
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Show leads panel"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={INBOX_SIDEBAR_MAX_WIDTH}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn(
        "absolute top-0 left-0 z-10 flex h-full w-3 cursor-col-resize touch-none items-stretch justify-center",
        "after:bg-outline-variant/40 after:my-auto after:h-12 after:w-px after:transition-colors",
        "hover:after:bg-white/50 focus-visible:outline-none focus-visible:after:bg-white",
        dragging && "after:bg-white",
        className,
      )}
    />
  );
}

export interface LeadInboxSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: LeadInboxFiltersValue;
  members: TeamMember[];
  forms?: ProjectForm[];
  onFiltersChange: (value: LeadInboxFiltersValue) => void;
  onApplyFilters: () => void;
  items: Submission[];
  selectedId: string | null;
  onSelect: (submissionId: string) => void;
  listBusy: boolean;
  listError: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** Sidebar width in px. */
  width?: number;
  /** Disable width transition while the email-pane handle is dragging. */
  resizing?: boolean;
}

export function LeadInboxSidebar({
  open,
  filters,
  members,
  forms = [],
  onFiltersChange,
  onApplyFilters,
  items,
  selectedId,
  onSelect,
  listBusy,
  listError,
  hasMore = false,
  onLoadMore,
  width: widthProp = INBOX_SIDEBAR_DEFAULT_WIDTH,
  resizing = false,
}: LeadInboxSidebarProps): JSX.Element {
  const width = clampInboxSidebarDragWidth(widthProp);

  const showListError =
    listError !== null && listError !== "No Form API account for this email";

  return (
    <div
      data-testid="inbox-sidebar-panel"
      data-state={open ? "open" : "closed"}
      aria-hidden={!open}
      className={cn(
        "relative shrink-0 max-lg:contents lg:overflow-x-clip lg:overflow-y-visible",
        !resizing &&
          "transition-[width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open ? "lg:opacity-100" : "pointer-events-none lg:opacity-0",
      )}
      style={{ width: open ? width : 0 }}
    >
      <div style={{ width }} className="max-lg:contents lg:pr-1">
        <aside className="max-lg:contents lg:flex lg:flex-col lg:gap-3">
          <div className="order-1 min-w-0 lg:order-none">
            <LeadInboxFilters
              value={filters}
              members={members}
              forms={forms}
              tags={collectLeadTags(items)}
              onChange={onFiltersChange}
              onApply={onApplyFilters}
            />
          </div>

          <div className="order-2 flex min-w-0 flex-col gap-3 lg:order-none">
          {showListError && (
            <p className="border-outline-variant/20 bg-surface-container-low text-on-surface-variant border p-4 text-sm">
              {listError}
            </p>
          )}

          {listBusy && items.length === 0 && (
            <p className="font-label text-outline text-xs tracking-widest uppercase">
              Loading…
            </p>
          )}

          {!listBusy && !listError && items.length === 0 && (
            <p className="text-on-surface-variant text-sm">
              No leads match these filters.
            </p>
          )}

          {items.length > 0 && (
            <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 lg:snap-none lg:flex-col lg:overflow-visible lg:pb-0">
              {items.map((item) => {
                const active = item.submissionId === selectedId;
                return (
                  <li
                    key={item.submissionId}
                    className="w-72 shrink-0 snap-start lg:w-auto lg:shrink"
                  >
                    <LeadInboxCard
                      senderName={item.senderName}
                      senderEmail={leadContactLabel(item) ?? ""}
                      message={item.message}
                      formName={item.formName}
                      submittedAt={item.submittedAt}
                      status={leadStatusOf(item)}
                      active={active}
                      replyCount={item.messageCount ?? 0}
                      onSelect={() => onSelect(item.submissionId)}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {hasMore && onLoadMore && (
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={listBusy}
              tabIndex={open ? 0 : -1}
              onClick={() => onLoadMore()}
            >
              {listBusy ? "Loading…" : "Load more"}
            </Button>
          )}
          </div>
        </aside>
      </div>
    </div>
  );
}
