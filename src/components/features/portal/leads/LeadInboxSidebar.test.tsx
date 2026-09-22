import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Submission } from "@/lib/api";
import {
  INBOX_SIDEBAR_SNAP_WIDTH,
  LeadInboxOpenHandle,
  LeadInboxResizeHandle,
  LeadInboxSidebar,
  LeadInboxSidebarToggle,
} from "./LeadInboxSidebar";

const items: Submission[] = [
  {
    clientId: "c1",
    submissionId: "s1",
    senderName: "Ada Lovelace",
    senderEmail: "ada@example.com",
    message: "Need a quote for a new site",
    submittedAt: "2026-07-15T12:00:00.000Z",
    status: "new",
    messageCount: 0,
  },
  {
    clientId: "c1",
    submissionId: "s2",
    senderName: "Grace Hopper",
    senderEmail: "grace@example.com",
    message: "Follow up on inspection",
    submittedAt: "2026-07-16T09:00:00.000Z",
    status: "contacted",
    messageCount: 1,
  },
];

const emptyFilters = {
  q: "",
  status: "" as const,
  tag: "" as const,
  assignedTo: "",
  formId: "",
};

const baseProps = {
  filters: emptyFilters,
  members: [] as [],
  onFiltersChange: vi.fn(),
  onApplyFilters: vi.fn(),
  items,
  selectedId: "s1",
  onSelect: vi.fn(),
  listBusy: false,
  listError: null as string | null,
};

describe("LeadInboxSidebar", () => {
  it("renders filters and vertical lead cards when open", () => {
    render(<LeadInboxSidebar open onOpenChange={vi.fn()} {...baseProps} />);

    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(screen.queryByText(/^leads$/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /hide leads panel/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ada lovelace/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /grace hopper/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("inbox-sidebar-panel")).toHaveAttribute(
      "data-state",
      "open",
    );
  });

  it("collapses the panel when closed without a show control", () => {
    render(
      <LeadInboxSidebar open={false} onOpenChange={vi.fn()} {...baseProps} />,
    );

    expect(
      screen.queryByRole("button", { name: /show leads panel/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("inbox-sidebar-panel")).toHaveAttribute(
      "data-state",
      "closed",
    );
    expect(screen.getByTestId("inbox-sidebar-panel")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("LeadInboxSidebarToggle opens the panel when closed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<LeadInboxSidebarToggle open={false} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: /show leads panel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("calls onSelect when a lead card is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <LeadInboxSidebar
        open
        onOpenChange={vi.fn()}
        {...baseProps}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /grace hopper/i }));
    expect(onSelect).toHaveBeenCalledWith("s2");
  });

  it("calls onLoadMore when load more is clicked", async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();

    render(
      <LeadInboxSidebar
        open
        onOpenChange={vi.fn()}
        {...baseProps}
        hasMore
        onLoadMore={onLoadMore}
      />,
    );

    await user.click(screen.getByRole("button", { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("does not render a resize handle on the sidebar", () => {
    render(<LeadInboxSidebar open onOpenChange={vi.fn()} {...baseProps} />);

    expect(
      screen.queryByRole("separator", { name: /resize/i }),
    ).not.toBeInTheDocument();
  });
});

describe("LeadInboxResizeHandle", () => {
  it("closes on click without dragging", () => {
    const onWidthChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LeadInboxResizeHandle
        width={320}
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: /resize leads panel/i,
    });

    fireEvent.pointerDown(handle, { clientX: 320, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onWidthChange).toHaveBeenCalledWith(INBOX_SIDEBAR_SNAP_WIDTH);
  });

  it("keeps the panel open when dragged to a valid width", () => {
    const onWidthChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LeadInboxResizeHandle
        width={320}
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: /resize leads panel/i,
    });

    fireEvent.pointerDown(handle, { clientX: 320, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onWidthChange).toHaveBeenLastCalledWith(400);
  });

  it("closes when dragged below the minimum width", () => {
    const onWidthChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LeadInboxResizeHandle
        width={320}
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: /resize leads panel/i,
    });

    fireEvent.pointerDown(handle, { clientX: 320, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onWidthChange).toHaveBeenLastCalledWith(INBOX_SIDEBAR_SNAP_WIDTH);
  });

  it("closes with Enter or ArrowLeft", async () => {
    const user = userEvent.setup();
    const onWidthChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LeadInboxResizeHandle
        width={320}
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: /resize leads panel/i,
    });
    handle.focus();
    await user.keyboard("{Enter}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onWidthChange).toHaveBeenCalledWith(INBOX_SIDEBAR_SNAP_WIDTH);
  });
});

describe("LeadInboxOpenHandle", () => {
  it("opens on click without dragging", () => {
    const onWidthChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LeadInboxOpenHandle
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: /show leads panel/i,
    });
    expect(handle.className).toMatch(/\bcursor-col-resize\b/);

    fireEvent.pointerDown(handle, { clientX: 0, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onWidthChange).toHaveBeenCalledWith(INBOX_SIDEBAR_SNAP_WIDTH);
  });

  it("opens when dragged past the minimum width", () => {
    const onWidthChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LeadInboxOpenHandle
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: /show leads panel/i,
    });

    fireEvent.pointerDown(handle, { clientX: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 300, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onWidthChange).toHaveBeenLastCalledWith(300);
  });

  it("stays closed when the drag ends below the minimum width", () => {
    const onWidthChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LeadInboxOpenHandle
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: /show leads panel/i,
    });

    fireEvent.pointerDown(handle, { clientX: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 80, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onWidthChange).toHaveBeenLastCalledWith(INBOX_SIDEBAR_SNAP_WIDTH);
  });

  it("opens with Enter or ArrowRight", async () => {
    const user = userEvent.setup();
    const onWidthChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LeadInboxOpenHandle
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: /show leads panel/i,
    });
    handle.focus();
    await user.keyboard("{Enter}");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onWidthChange).toHaveBeenCalledWith(INBOX_SIDEBAR_SNAP_WIDTH);
  });
});
