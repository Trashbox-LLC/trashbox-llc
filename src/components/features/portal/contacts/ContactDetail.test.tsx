import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Contact, ContactLeadRef, TeamMember } from "@/lib/api";
import { ContactDetail } from "./ContactDetail";

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    clientId: "c1",
    contactId: "id",
    displayName: "Sam Reed",
    emails: ["sam@example.com"],
    phones: [],
    tags: [],
    ownerEmail: null,
    source: "manual",
    notes: [],
    createdBy: "owner@example.com",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    searchText: "sam reed",
    leadCount: 0,
    ...overrides,
  };
}

const members: TeamMember[] = [
  {
    email: "rep@example.com",
    role: "member",
    joinedAt: "2026-01-01T00:00:00.000Z",
    emailNotifications: true,
  },
];

const lead: ContactLeadRef = {
  submissionId: "s1",
  senderName: "Sam Reed",
  status: "new",
  submittedAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

function setup(props: Partial<React.ComponentProps<typeof ContactDetail>> = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onBack: vi.fn(),
    onOwnerChange: vi.fn(),
    onAddNote: vi.fn().mockResolvedValue(undefined),
    onSendMessage: vi.fn().mockResolvedValue(undefined),
    onConfigureSms: vi.fn(),
    onConfigureEmail: vi.fn(),
    onDelete: vi.fn(),
    onOpenLead: vi.fn(),
  };
  render(
    <ContactDetail
      contact={contact()}
      leads={[]}
      members={members}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("ContactDetail", () => {
  it("opens the lead that was clicked", async () => {
    const handlers = setup({ leads: [lead] });
    await userEvent.click(screen.getByRole("button", { name: /Sam Reed/ }));
    expect(handlers.onOpenLead).toHaveBeenCalledWith("s1");
  });

  it("keeps the note button inert until something is typed", async () => {
    setup();
    const save = screen.getByRole("button", { name: "Save note" });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Add note"), "Called back");
    expect(save).toBeEnabled();
  });

  it("submits a trimmed note", async () => {
    const handlers = setup();
    await userEvent.type(screen.getByLabelText("Add note"), "  Called back  ");
    await userEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(handlers.onAddNote).toHaveBeenCalledWith("Called back");
  });

  it("clears the draft after the note saves", async () => {
    setup();
    const field = screen.getByLabelText("Add note");
    await userEvent.type(field, "Called back");
    await userEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(field).toHaveValue("");
  });

  it("keeps the draft when the save fails", async () => {
    setup({ onAddNote: vi.fn().mockRejectedValue(new Error("nope")) });
    const field = screen.getByLabelText("Add note");
    await userEvent.type(field, "Called back");
    await userEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(field).toHaveValue("Called back");
  });

  it("sends null when the owner is cleared", async () => {
    const handlers = setup({ contact: contact({ ownerEmail: "rep@example.com" }) });
    await userEvent.click(screen.getByRole("button", { name: /owner/i }));
    await userEvent.click(screen.getByRole("option", { name: /unassigned/i }));
    expect(handlers.onOwnerChange).toHaveBeenCalledWith(null);
  });

  it("hides delete from members who lack the permission", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("asks for confirmation before deleting", async () => {
    const handlers = setup({ canDelete: true });
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(handlers.onDelete).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: "Confirm delete" }),
    );
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it("lets the viewer back out of a delete", async () => {
    const handlers = setup({ canDelete: true });
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(
      screen.queryByRole("button", { name: "Confirm delete" }),
    ).not.toBeInTheDocument();
    expect(handlers.onDelete).not.toHaveBeenCalled();
  });

  it("surfaces an error", () => {
    setup({ error: "Boom" });
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });

  it("offers a call link for the contact's number", () => {
    setup({ contact: contact({ phones: ["+15551234567"] }) });
    expect(screen.getByRole("link", { name: "Call" })).toHaveAttribute(
      "href",
      "tel:+15551234567",
    );
  });

  it("offers no call action without a number", () => {
    setup();
    expect(screen.queryByRole("link", { name: "Call" })).not.toBeInTheDocument();
  });

  it("never hands emailing off to the viewer's own mail client", () => {
    setup({ availableChannels: [] });
    expect(screen.queryByRole("link", { name: "Email" })).not.toBeInTheDocument();
  });

  it("sends the viewer to email settings when no mailbox is connected", async () => {
    const handlers = setup({ availableChannels: [] });
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    expect(handlers.onConfigureEmail).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
  });

  it("sends the viewer to text settings when the project has no number", async () => {
    const handlers = setup({
      contact: contact({ phones: ["+15551234567"] }),
      availableChannels: [],
    });
    await userEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(handlers.onConfigureSms).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Text message")).not.toBeInTheDocument();
  });

  it("offers no text action for a contact with no number", () => {
    setup({ availableChannels: [] });
    expect(
      screen.queryByRole("button", { name: "Text" }),
    ).not.toBeInTheDocument();
  });

  it("offers no email action for a contact with no address", () => {
    setup({
      contact: contact({ emails: [], phones: ["+15551234567"] }),
      availableChannels: [],
    });
    expect(
      screen.queryByRole("button", { name: "Email" }),
    ).not.toBeInTheDocument();
  });

  it("refuses to text a contact who replied STOP", async () => {
    const handlers = setup({
      contact: contact({ phones: ["+15551234567"] }),
      availableChannels: [],
      smsOptedOut: true,
    });
    expect(screen.getByRole("button", { name: "Text" })).toBeDisabled();
    expect(handlers.onConfigureSms).not.toHaveBeenCalled();
  });

  it("opens the composer on the channel that was picked", async () => {
    setup({
      contact: contact({
        emails: ["sam@example.com"],
        phones: ["+15551234567"],
      }),
      availableChannels: ["email", "sms"],
    });
    await userEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(screen.getByLabelText("Text message")).toBeInTheDocument();
  });

  it("closes the composer when the same action is pressed again", async () => {
    setup({ availableChannels: ["email"] });
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
  });

  it("sends on the channel the composer is set to", async () => {
    const handlers = setup({
      availableChannels: ["sms"],
      contact: contact({ phones: ["+15551234567"] }),
    });
    await userEvent.click(screen.getByRole("button", { name: "Text" }));
    await userEvent.type(screen.getByLabelText("Text message"), "On my way");
    await userEvent.click(screen.getByRole("button", { name: /Send text/ }));
    expect(handlers.onSendMessage).toHaveBeenCalledWith({
      channel: "sms",
      body: "On my way",
    });
  });

  it("passes an email subject along when one was typed", async () => {
    const handlers = setup({ availableChannels: ["email"] });
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    await userEvent.type(screen.getByLabelText("Subject"), "Your quote");
    await userEvent.type(screen.getByLabelText("Message"), "Attached.");
    await userEvent.click(screen.getByRole("button", { name: /Send email/ }));
    expect(handlers.onSendMessage).toHaveBeenCalledWith({
      channel: "email",
      body: "Attached.",
      subject: "Your quote",
    });
  });

  it("omits an untouched subject rather than sending an empty one", async () => {
    const handlers = setup({ availableChannels: ["email"] });
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    await userEvent.type(screen.getByLabelText("Message"), "Attached.");
    await userEvent.click(screen.getByRole("button", { name: /Send email/ }));
    expect(handlers.onSendMessage).toHaveBeenCalledWith({
      channel: "email",
      body: "Attached.",
    });
  });

  it("closes the composer once the message is away", async () => {
    setup({ availableChannels: ["email"] });
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    await userEvent.type(screen.getByLabelText("Message"), "Attached.");
    await userEvent.click(screen.getByRole("button", { name: /Send email/ }));
    expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
  });

  it("keeps the composer open when the send fails", async () => {
    setup({
      availableChannels: ["email"],
      onSendMessage: vi.fn().mockRejectedValue(new Error("nope")),
    });
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    await userEvent.type(screen.getByLabelText("Message"), "Attached.");
    await userEvent.click(screen.getByRole("button", { name: /Send email/ }));
    expect(screen.getByLabelText("Message")).toHaveValue("Attached.");
  });

  it("explains why texting is unavailable after a STOP reply", () => {
    setup({ smsOptedOut: true });
    expect(screen.getByText(/replied STOP/)).toBeInTheDocument();
  });
});
