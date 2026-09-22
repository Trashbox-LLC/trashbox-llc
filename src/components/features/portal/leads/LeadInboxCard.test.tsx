import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  contactInitials,
  formatInboxCardDate,
  inboxCardStackDepth,
  LeadInboxCard,
} from "./LeadInboxCard";

describe("formatInboxCardDate", () => {
  it("uses a short month and day, with only the first letter capitalized", () => {
    const formatted = formatInboxCardDate("2026-09-14T18:00:00.000Z");

    expect(formatted).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
    expect(formatted).not.toMatch(/\d{4}|am|pm/i);
    expect(formatted).not.toBe(formatted.toUpperCase());
  });

  it("returns the original value when the date cannot be parsed", () => {
    expect(formatInboxCardDate("not-a-date")).toBe("not-a-date");
  });
});

describe("contactInitials", () => {
  it("uses the first and last initials of a contact name", () => {
    expect(contactInitials("Edward Moore")).toBe("EM");
    expect(contactInitials("edward moore")).toBe("EM");
  });

  it("uses the first two letters of a single name", () => {
    expect(contactInitials("Ada")).toBe("AD");
  });

  it("uses a placeholder when the name is blank", () => {
    expect(contactInitials("  ")).toBe("?");
  });
});

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

  it("hides reply count when there are no replies", () => {
    render(<LeadInboxCard {...base} replyCount={0} />);

    expect(screen.queryByTestId("inbox-card-replies")).not.toBeInTheDocument();
  });

  it("does not show assignment on the list card", () => {
    render(<LeadInboxCard {...base} assignedTo="owner@example.com" />);

    expect(screen.queryByText("owner@example.com")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /assigned to/i }),
    ).not.toBeInTheDocument();
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
