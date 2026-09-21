import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LeadMessage, Submission } from "@/lib/api";
import { LeadDetail } from "./LeadDetail";

const baseSubmission: Submission = {
  clientId: "c1",
  submissionId: "s1",
  senderName: "Ada",
  senderEmail: "ada@example.com",
  message: "[Full-Stack Development]\n\nYour mom as a website",
  submittedAt: "2026-07-15T12:00:00.000Z",
  status: "new",
  tags: [],
  notes: [],
  assignedTo: null,
  metadata: { service: "Full-Stack Development" },
};

const outboundReply: LeadMessage = {
  messageId: "m1",
  submissionId: "s1",
  clientId: "c1",
  direction: "outbound",
  from: "biz@example.com",
  to: "ada@example.com",
  subject: "Re: quote",
  bodyText: "Thanks for reaching out",
  createdAt: "2026-07-15T13:00:00.000Z",
};

const laterReply: LeadMessage = {
  messageId: "m2",
  submissionId: "s1",
  clientId: "c1",
  direction: "inbound",
  from: "ada@example.com",
  to: "biz@example.com",
  subject: "Re: quote",
  bodyText: "Sounds good, when can we start?",
  createdAt: "2026-07-15T14:00:00.000Z",
};

describe("LeadDetail", () => {
  it("changes status and adds a note", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onAddNote = vi.fn().mockResolvedValue(undefined);

    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          message: "Need a quote",
          metadata: undefined,
        }}
        members={[
          {
            email: "sarah@example.com",
            role: "member",
            joinedAt: "2026-01-01",
            emailNotifications: false,
          },
        ]}
        onUpdate={onUpdate}
        onAddNote={onAddNote}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^status$/i }));
    await user.click(
      within(screen.getByRole("listbox")).getByRole("option", {
        name: /contacted/i,
      }),
    );
    expect(onUpdate).toHaveBeenCalledWith({ status: "contacted" });

    expect(screen.queryByLabelText(/add note/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    await user.type(
      screen.getByLabelText(/add note/i),
      "Called customer July 15, requested estimate",
    );
    await user.click(screen.getByRole("button", { name: /save note/i }));
    expect(onAddNote).toHaveBeenCalledWith(
      "Called customer July 15, requested estimate",
    );
  });

  it("keeps notes collapsed until show notes is clicked", async () => {
    const user = userEvent.setup();

    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          notes: [
            {
              id: "n1",
              body: "Followed up by email.",
              authorEmail: "owner@example.com",
              createdAt: "2026-07-15T14:00:00.000Z",
            },
          ],
        }}
        members={[]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    expect(screen.queryByText("Followed up by email.")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/add note/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    expect(screen.getByText("Followed up by email.")).toBeInTheDocument();
    expect(screen.getByLabelText(/add note/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^notes$/i }));
    expect(screen.queryByText("Followed up by email.")).not.toBeInTheDocument();
  });

  it("hides the quoted earlier email on the latest reply", () => {
    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        messages={[
          {
            ...laterReply,
            bodyText: [
              "awesome",
              "",
              "On Mon, Sep 21, 2026 at 1:23 PM Ezekiel Mohr <contact@trashbox.io> wrote:",
              "",
              "> Yourmother",
            ].join("\n"),
          },
        ]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    expect(screen.getByText("awesome")).toBeInTheDocument();
    expect(screen.queryByText(/Yourmother/)).not.toBeInTheDocument();
    expect(screen.queryByText(/wrote:/)).not.toBeInTheDocument();
  });

  it("shows the form message and metadata when there are no thread replies", () => {
    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Your mom as a website/i, { selector: "p" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("[Full-Stack Development]")).not.toBeInTheDocument();

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(within(details).getByText("Metadata")).toBeInTheDocument();
    expect(within(details).getByText("Service")).toBeInTheDocument();
    expect(within(details).getByText("Full-Stack Development")).toBeInTheDocument();
  });

  it("keeps metadata in the details panel after replies arrive", () => {
    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        messages={[outboundReply]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(within(details).getByText("Service")).toBeInTheDocument();
    expect(within(details).getByText("Full-Stack Development")).toBeInTheDocument();
  });

  it("shows only tags on the lead, with an add control that does not change them", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          tags: ["website_quote", "sales"],
        }}
        members={[]}
        onUpdate={onUpdate}
        onAddNote={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(within(details).getByText("Website Quote")).toBeInTheDocument();
    expect(within(details).getByText("Sales")).toBeInTheDocument();
    expect(within(details).queryByRole("button", { name: /^support$/i })).not.toBeInTheDocument();

    await user.click(within(details).getByRole("button", { name: /add tag/i }));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("opens the assignee menu from the name or the email", async () => {
    const user = userEvent.setup();

    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          status: "contacted",
          assignedTo: "owner@example.com",
        }}
        members={[
          {
            email: "owner@example.com",
            role: "owner",
            joinedAt: "2026-01-01T00:00:00.000Z",
            firstName: "Ezekiel",
            lastName: "Mohr",
            emailNotifications: true,
          },
        ]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    const status = within(details).getByRole("button", { name: /^status$/i });
    const assignee = within(details).getByRole("button", { name: "Assigned to" });
    expect(status).toHaveTextContent("Contacted");
    expect(status).not.toHaveTextContent("expand_more");
    expect(assignee).toHaveTextContent("Ezekiel Mohr");
    expect(assignee).toHaveTextContent("owner@example.com");
    expect(assignee).not.toHaveTextContent("expand_more");

    await user.click(within(assignee).getByText("owner@example.com"));
    const listbox = screen.getByRole("listbox");
    expect(listbox.className).toMatch(/\bright-0\b/);
    expect(listbox.className).toMatch(/\bleft-auto\b/);
  });

  it("shows an email-only assignee once", () => {
    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          assignedTo: "owner@example.com",
        }}
        members={[
          {
            email: "owner@example.com",
            role: "owner",
            joinedAt: "2026-01-01T00:00:00.000Z",
            emailNotifications: true,
          },
        ]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(within(details).getAllByText("owner@example.com")).toHaveLength(1);
  });

  it("shows the latest message as a history card instead of below the timeline", async () => {
    const user = userEvent.setup();

    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        messages={[outboundReply, laterReply]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
        onSendMessage={vi.fn()}
        composerLibrary={{ templates: [], signatures: [], snippets: [] }}
      />,
    );

    const historyTab = screen.getByRole("button", { name: /^history$/i });
    const featured = screen.getByText(/Sounds good, when can we start\?/i, {
      selector: "p",
    });
    expect(
      screen.queryByRole("region", { name: /message history/i })?.contains(featured),
    ).not.toBe(true);

    await user.click(historyTab);

    const history = screen.getByRole("region", { name: /message history/i });
    const latest = within(history).getByText(
      /Sounds good, when can we start\?/i,
      { selector: "p" },
    );
    expect(history.contains(latest)).toBe(true);
    expect(
      within(history).getByLabelText(/received message event/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Sounds good, when can we start\?/i)).toHaveLength(
      1,
    );

    await user.click(historyTab);
    expect(
      screen.queryByRole("heading", { name: /^history$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sounds good, when can we start\?/i, { selector: "p" }),
    ).toBeInTheDocument();
  });

  it("keeps addresses and assignment in the details panel", () => {
    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          formName: "Web application",
          message: "Need a quote",
          metadata: undefined,
        }}
        members={[]}
        fromAddress="contact@trashbox.io"
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(
      within(details).getByRole("button", { name: /^status$/i }),
    ).toBeInTheDocument();
    expect(
      within(details).getByRole("button", { name: "Assigned to" }),
    ).toBeInTheDocument();
    expect(within(details).getByText("ada@example.com")).toBeInTheDocument();
    expect(within(details).getByText("contact@trashbox.io")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Ada$/i })).toBeInTheDocument();
    expect(screen.getByText(/\[Web application\]/)).toBeInTheDocument();
  });

  it("keeps the reply composer without the timeline when there are no replies", () => {
    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        messages={[]}
        mailboxConnected
        fromOptions={[
          {
            id: "s1",
            label: "Sales Team",
            displayName: "Sales Team",
          },
        ]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
        onSendMessage={vi.fn()}
        composerLibrary={{ templates: [], signatures: [], snippets: [] }}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: /^history$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^history$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("keeps the reply editor in its own region below the messages", () => {
    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        messages={[]}
        mailboxConnected
        fromOptions={[
          {
            id: "s1",
            label: "Sales Team",
            displayName: "Sales Team",
          },
        ]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
        onSendMessage={vi.fn()}
        composerLibrary={{ templates: [], signatures: [], snippets: [] }}
      />,
    );

    const messages = screen.getByRole("region", { name: /^messages$/i });
    const reply = screen.getByRole("region", { name: /^reply$/i });

    expect(messages.contains(reply)).toBe(false);
    expect(
      messages.compareDocumentPosition(reply) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      reply.contains(screen.getByRole("button", { name: /send message/i })),
    ).toBe(true);
    expect(messages.contains(screen.getByRole("heading", { name: /^Ada$/i }))).toBe(
      true,
    );
  });
});
