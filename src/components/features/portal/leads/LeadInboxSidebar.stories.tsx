import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "storybook/test";
import type { Submission } from "@/lib/api";
import {
  INBOX_SIDEBAR_SNAP_WIDTH,
  LeadInboxOpenHandle,
  LeadInboxResizeHandle,
  LeadInboxSidebar,
  type LeadInboxSidebarProps,
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
    messageCount: 2,
    assignedTo: "owner@example.com",
  },
  {
    clientId: "c1",
    submissionId: "s3",
    senderName: "Alan Turing",
    senderEmail: "alan@example.com",
    message: "Question about pricing tiers",
    submittedAt: "2026-07-17T14:30:00.000Z",
    status: "qualified",
    messageCount: 0,
  },
];

const meta = {
  title: "Features/Portal/Leads/LeadInboxSidebar",
  component: LeadInboxSidebar,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-[28rem] bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    open: true,
    onOpenChange: fn(),
    filters: { q: "", status: "", tag: "", assignedTo: "", formId: "" },
    members: [
      {
        email: "owner@example.com",
        role: "owner",
        joinedAt: "2026-01-01",
        firstName: "Olivia",
        lastName: "Owner",
        emailNotifications: true,
      },
    ],
    onFiltersChange: fn(),
    onApplyFilters: fn(),
    items,
    selectedId: "s1",
    onSelect: fn(),
    listBusy: false,
    listError: null,
    hasMore: true,
    onLoadMore: fn(),
  },
} satisfies Meta<typeof LeadInboxSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledSidebar(args: LeadInboxSidebarProps) {
  const [open, setOpen] = useState(args.open);
  const [width, setWidth] = useState(args.width ?? INBOX_SIDEBAR_SNAP_WIDTH);
  const [resizing, setResizing] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    args.onOpenChange(next);
  }

  return (
    <div className="flex gap-8">
      <LeadInboxSidebar
        {...args}
        open={open}
        width={width}
        resizing={resizing}
        onOpenChange={onOpenChange}
      />
      <div className="relative min-w-0 min-h-[20rem] flex-1 rounded bg-surface-container-low p-6 text-sm text-on-surface-variant">
        {open ? (
          <LeadInboxResizeHandle
            width={width}
            onWidthChange={setWidth}
            onOpenChange={onOpenChange}
            onDraggingChange={setResizing}
          />
        ) : (
          <LeadInboxOpenHandle
            onWidthChange={setWidth}
            onOpenChange={onOpenChange}
            onDraggingChange={setResizing}
          />
        )}
        Detail pane — drag the left edge to resize; click the edge to
        {open ? " close" : " open"}
      </div>
    </div>
  );
}

export const Open: Story = {
  render: (args) => <ControlledSidebar {...args} />,
};

export const Collapsed: Story = {
  args: {
    open: false,
  },
  render: (args) => <ControlledSidebar {...args} />,
};

export const Narrow: Story = {
  args: {
    width: 240,
  },
  render: (args) => <ControlledSidebar {...args} />,
};

export const Wide: Story = {
  args: {
    width: 480,
  },
  render: (args) => <ControlledSidebar {...args} />,
};

export const Empty: Story = {
  args: {
    items: [],
    selectedId: null,
    hasMore: false,
  },
  render: (args) => <ControlledSidebar {...args} />,
};

export const Loading: Story = {
  args: {
    items: [],
    selectedId: null,
    listBusy: true,
    hasMore: false,
  },
  render: (args) => <ControlledSidebar {...args} />,
};
