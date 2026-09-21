import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TeamMember } from "@/lib/api";
import {
  inboxCardStackDepth,
  LeadInboxCard,
} from "./LeadInboxCard";

const members: TeamMember[] = [
  {
    email: "owner@example.com",
    role: "owner",
    joinedAt: "2026-01-01T00:00:00.000Z",
    firstName: "Olivia",
    lastName: "Owner",
    emailNotifications: true,
  },
  {
    email: "sales@example.com",
    role: "member",
    joinedAt: "2026-01-02T00:00:00.000Z",
    name: "Sam Sales",
    emailNotifications: true,
  },
];

describe("inboxCardStackDepth", () => {
  it("is a single card when there are no replies", () => {
    expect(inboxCardStackDepth(0)).toBe(1);
  });

  it("stacks two cards for one reply", () => {
    expect(inboxCardStackDepth(1)).toBe(2);
  });

  it("caps at three cards (one on top, two below)", () => {
    expect(inboxCardStackDepth(2)).toBe(3);
    expect(inboxCardStackDepth(9)).toBe(3);
  });
});

describe("LeadInboxCard", () => {
  const base = {
    senderName: "Ada Lovelace",
    senderEmail: "ada@example.com",
    message: "Need a quote for a new site",
    submittedAt: "2026-07-15T12:00:00.000Z",
    status: "new" as const,
    active: false,
    replyCount: 0,
    onSelect: vi.fn(),
  };

  it("renders lead summary content", () => {
    render(<LeadInboxCard {...base} />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(
      screen.queryByText("Need a quote for a new site"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /status: new/i }),
    ).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<LeadInboxCard {...base} onSelect={onSelect} />);

    await user.click(
      screen.getByRole("button", { name: /ada lovelace/i }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders a single card by default even when there are replies", () => {
    render(<LeadInboxCard {...base} replyCount={5} />);

    expect(screen.queryByTestId("inbox-card-stack")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ada lovelace/i })).not.toHaveAttribute(
      "data-stack-depth",
    );
    expect(screen.getByTestId("inbox-card-replies")).toHaveTextContent(
      "5 replies",
    );
  });

  it("places replies to the left of the assignee dropdown", () => {
    render(
      <LeadInboxCard
        {...base}
        replyCount={2}
        assignedTo="owner@example.com"
        members={members}
        onAssign={vi.fn()}
      />,
    );

    const footerRight = screen.getByTestId("inbox-card-replies").parentElement;
    expect(footerRight).toBeTruthy();
    const children = Array.from(footerRight!.children);
    expect(children[0]).toHaveAttribute("data-testid", "inbox-card-replies");
    expect(children[1]).toHaveTextContent("Olivia Owner");
  });

  it("hides reply count when there are no replies", () => {
    render(<LeadInboxCard {...base} replyCount={0} />);

    expect(screen.queryByTestId("inbox-card-replies")).not.toBeInTheDocument();
  });

  it("shows name on the trigger and name with email in the dropdown", async () => {
    const user = userEvent.setup();

    render(
      <LeadInboxCard
        {...base}
        assignedTo="owner@example.com"
        members={members}
        onAssign={vi.fn()}
      />,
    );

    const assignee = screen.getByRole("button", { name: /assigned to/i });
    expect(assignee).toHaveTextContent("Olivia Owner");
    expect(assignee).not.toHaveTextContent("owner@example.com");
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(assignee.querySelector(".truncate")).toBeTruthy();

    await user.click(assignee);
    const listbox = screen.getByRole("listbox");
    expect(listbox.className).toMatch(/\bright-0\b/);
    expect(
      screen.getByRole("option", {
        name: /olivia owner \(owner@example\.com\)/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: /sam sales \(sales@example\.com\)/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows Unassigned when no assignee is set", () => {
    render(
      <LeadInboxCard {...base} members={members} onAssign={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: /assigned to/i }),
    ).toHaveTextContent("Unassigned");
  });

  it("calls onAssign from the dropdown without selecting the lead", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onAssign = vi.fn();

    render(
      <LeadInboxCard
        {...base}
        assignedTo={null}
        members={members}
        onSelect={onSelect}
        onAssign={onAssign}
      />,
    );

    await user.click(screen.getByRole("button", { name: /assigned to/i }));
    await user.click(screen.getByRole("option", { name: /sam sales/i }));

    expect(onAssign).toHaveBeenCalledWith("sales@example.com");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("can clear assignment to Unassigned", async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();

    render(
      <LeadInboxCard
        {...base}
        assignedTo="owner@example.com"
        members={members}
        onAssign={onAssign}
      />,
    );

    await user.click(screen.getByRole("button", { name: /assigned to/i }));
    await user.click(screen.getByRole("option", { name: /unassigned/i }));

    expect(onAssign).toHaveBeenCalledWith(null);
  });

  it("shows no stack layers without replies when stacked", () => {
    render(<LeadInboxCard {...base} stacked replyCount={0} />);

    expect(screen.queryByTestId("inbox-card-stack")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ada lovelace/i }),
    ).toHaveAttribute("data-stack-depth", "1");
  });

  it("shows one stack layer under the card for a single reply when stacked", () => {
    render(<LeadInboxCard {...base} stacked replyCount={1} />);

    const stack = screen.getByTestId("inbox-card-stack");
    expect(stack).toHaveAttribute("data-stack-behind", "1");
    expect(stack.className).toMatch(/\bpl-2\b/);
    expect(
      screen.getByRole("button", { name: /ada lovelace/i }),
    ).toHaveAttribute("data-stack-depth", "2");
    expect(stack.firstElementChild?.getAttribute("style") ?? "").toContain(
      "* -1)",
    );
  });

  it("shows two stack layers under the card for multiple replies when stacked", () => {
    render(<LeadInboxCard {...base} stacked replyCount={5} />);

    const stack = screen.getByTestId("inbox-card-stack");
    expect(stack).toHaveAttribute("data-stack-behind", "2");
    expect(stack.className).toMatch(/\bpl-4\b/);
    expect(
      screen.getByRole("button", { name: /ada lovelace/i }),
    ).toHaveAttribute("data-stack-depth", "3");
    expect(stack.firstElementChild?.getAttribute("style") ?? "").toContain(
      "* -2)",
    );
  });
});
