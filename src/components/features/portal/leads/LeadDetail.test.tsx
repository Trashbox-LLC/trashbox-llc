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

    await user.type(
      screen.getByLabelText(/add note/i),
      "Called customer July 15, requested estimate",
    );
    await user.click(screen.getByRole("button", { name: /save note/i }));
    expect(onAddNote).toHaveBeenCalledWith(
      "Called customer July 15, requested estimate",
    );
  });

  it("keeps note author and time behind hover", async () => {
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

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(within(details).getByText("Followed up by email.")).toBeInTheDocument();
    expect(within(details).queryByText("owner@example.com")).not.toBeInTheDocument();

    await user.hover(within(details).getByText("Followed up by email."));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "owner@example.com",
    );
  });

  it("shows the author's name on note hover when they have one", async () => {
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
    await user.hover(within(details).getByText("Followed up by email."));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Ezekiel Mohr");
    expect(tooltip).not.toHaveTextContent("owner@example.com");
  });

  it("deletes a note from the note menu", async () => {
    const user = userEvent.setup();
    const onDeleteNote = vi.fn().mockResolvedValue(undefined);
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
        onDeleteNote={onDeleteNote}
      />,
    );

    await user.click(screen.getByRole("button", { name: /note actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(onDeleteNote).toHaveBeenCalledWith("n1");
  });

  it("shows earlier messages as text from history 2", () => {
    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        messages={[outboundReply, laterReply]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    const transcript = screen.getByRole("region", {
      name: /message transcript/i,
    });
    expect(screen.getByRole("button", { name: /^email$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(transcript).getByText("Thanks for reaching out"),
    ).toBeInTheDocument();
    expect(
      within(transcript).getByText("Sounds good, when can we start?"),
    ).toBeInTheDocument();
    expect(
      within(transcript).getByText("Your mom as a website"),
    ).toBeInTheDocument();
  });

  it("shows the text conversation from the text button", async () => {
    const user = userEvent.setup();
    render(
      <LeadDetail
        submission={{ ...baseSubmission, senderPhone: "+14255550182" }}
        members={[]}
        messages={[
          outboundReply,
          {
            messageId: "m-sms",
            submissionId: "s1",
            clientId: "c1",
            direction: "inbound",
            channel: "sms",
            from: "+14255550182",
            to: "+18005550100",
            subject: "",
            bodyText: "On my way",
            createdAt: "2026-07-15T15:00:00.000Z",
          },
        ]}
        mailboxConnected
        availableChannels={["email", "sms"]}
        smsFromPhone="+18005550100"
        composerLibrary={{ templates: [], signatures: [], snippets: [] }}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
        onSendMessage={vi.fn()}
        onSendSms={vi.fn()}
      />,
    );

    const emailThread = screen.getByRole("region", { name: /message transcript/i });
    expect(within(emailThread).queryByText("On my way")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^text$/i }));

    const texts = screen.getByRole("region", { name: /message transcript/i });
    expect(within(texts).getByText("On my way")).toBeInTheDocument();
    expect(
      within(texts).queryByText("Thanks for reaching out"),
    ).not.toBeInTheDocument();
    expect(
      within(texts).queryByText(/your mom as a website/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /text message/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /^reply$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^text$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps a disabled text editor when the contact has no phone", async () => {
    const user = userEvent.setup();
    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        mailboxConnected
        availableChannels={["email", "sms"]}
        smsFromPhone="+18005550100"
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
        onSendMessage={vi.fn()}
        onSendSms={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^text$/i }));

    expect(screen.getByRole("textbox", { name: /text message/i })).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /get started with sms/i }),
    ).not.toBeInTheDocument();
  });

  it("offers text setup when the account has no sending number", async () => {
    const user = userEvent.setup();
    render(
      <LeadDetail
        submission={{ ...baseSubmission, senderPhone: "+14255550182" }}
        members={[]}
        mailboxConnected
        availableChannels={["email", "sms"]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
        onSendMessage={vi.fn()}
        onSendSms={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^text$/i }));

    expect(
      screen.getByRole("link", { name: /get started with sms/i }),
    ).toHaveAttribute("href", expect.stringContaining("text-messaging"));
    expect(screen.getByRole("textbox", { name: /text message/i })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("calls the lead phone number", () => {
    render(
      <LeadDetail
        submission={{ ...baseSubmission, senderPhone: "+14255550182" }}
        members={[]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: /^phone$/i })).toHaveAttribute(
      "href",
      "tel:+14255550182",
    );
  });

  it("offers no call without a phone number", async () => {
    const user = userEvent.setup();
    render(
      <LeadDetail
        submission={baseSubmission}
        members={[]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /^phone$/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^phone$/i }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      /no number to call/i,
    );
  });

  it("hides the details panel and brings it back", async () => {
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

    expect(screen.getByText("Followed up by email.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^details$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /close details/i }));
    expect(
      screen.queryByRole("complementary", { name: /^details$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^details$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: /^details$/i }));
    expect(
      within(
        screen.getByRole("complementary", { name: /^details$/i }),
      ).getByText("Followed up by email."),
    ).toBeInTheDocument();
  });

  it("keeps details open on a narrow screen without a toggle", () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      render(
        <LeadDetail
          submission={baseSubmission}
          members={[]}
          onUpdate={vi.fn()}
          onAddNote={vi.fn()}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /^details$/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /close details/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("complementary", { name: /^details$/i }),
      ).toBeInTheDocument();
    } finally {
      window.matchMedia = matchMedia;
    }
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
    expect(
      screen.queryByText("[Full-Stack Development]"),
    ).not.toBeInTheDocument();

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(within(details).getByText("Metadata")).toBeInTheDocument();
    expect(within(details).getByText("Service")).toBeInTheDocument();
    expect(
      within(details).getByText("Full-Stack Development"),
    ).toBeInTheDocument();
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
    expect(
      within(details).getByText("Full-Stack Development"),
    ).toBeInTheDocument();
  });

  it("shows only the tags on the lead", () => {
    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          tags: ["website_quote", "sales"],
        }}
        members={[]}
        availableTags={["website_quote", "sales", "support"]}
        onUpdate={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(
      within(details).getByRole("button", { name: /remove website quote/i }),
    ).toBeInTheDocument();
    expect(
      within(details).getByRole("button", { name: /remove sales/i }),
    ).toBeInTheDocument();
    expect(
      within(details).queryByRole("button", { name: /remove support/i }),
    ).not.toBeInTheDocument();
  });

  it("adds a new tag from the detail panel", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);

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
    await user.click(within(details).getByRole("button", { name: /add tag/i }));
    expect(onUpdate).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: /tag name/i }), "Hot  Lead{Enter}");
    expect(onUpdate).toHaveBeenCalledWith({
      tags: ["website_quote", "sales", "hot lead"],
    });
  });

  it("adds a tag the project already uses", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          tags: ["sales"],
        }}
        members={[]}
        availableTags={["sales", "follow up"]}
        onUpdate={onUpdate}
        onAddNote={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    await user.click(within(details).getByRole("button", { name: /add tag/i }));
    await user.click(screen.getByRole("button", { name: /^follow up$/i }));
    expect(onUpdate).toHaveBeenCalledWith({
      tags: ["sales", "follow up"],
    });
  });

  it("does not add a tag the lead already has", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          tags: ["sales"],
        }}
        members={[]}
        onUpdate={onUpdate}
        onAddNote={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    await user.click(within(details).getByRole("button", { name: /add tag/i }));
    await user.type(screen.getByRole("textbox", { name: /tag name/i }), "Sales{Enter}");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("removes a tag from the lead", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);

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
    await user.click(
      within(details).getByRole("button", { name: /remove website quote/i }),
    );
    expect(onUpdate).toHaveBeenCalledWith({ tags: ["sales"] });
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
    const assignee = within(details).getByRole("button", {
      name: "Assigned to",
    });
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
      screen
        .queryByRole("region", { name: /message history/i })
        ?.contains(featured),
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
    expect(
      screen.getAllByText(/Sounds good, when can we start\?/i),
    ).toHaveLength(1);

    await user.click(historyTab);
    expect(
      screen.queryByRole("heading", { name: /^history$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sounds good, when can we start\?/i, { selector: "p" }),
    ).toBeInTheDocument();
  });

  it("picks a number from the text and phone actions when the contact has several", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          senderPhone: "+14255550182",
          contactId: "con_1",
        }}
        contactPhones={[
          { number: "+14255550182", label: "phone" },
          { number: "+14255550199", label: "home" },
        ]}
        members={[]}
        mailboxConnected
        smsFromPhone="+18005550100"
        onUpdate={onUpdate}
        onAddNote={vi.fn()}
        onSendMessage={vi.fn()}
        onSendSms={vi.fn()}
      />,
    );

    const details = screen.getByRole("complementary", { name: /^details$/i });
    expect(within(details).getByText("(425) 555-0182")).toBeInTheDocument();
    expect(within(details).getByText("(425) 555-0199")).toBeInTheDocument();
    expect(within(details).getByText("home")).toBeInTheDocument();
    expect(within(details).queryByRole("radio")).not.toBeInTheDocument();
    expect(within(details).queryByRole("link")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^text$/i }));
    const textMenu = screen.getByRole("menu");
    const textChoices = within(textMenu).getAllByRole("menuitem");
    expect(textChoices).toHaveLength(2);
    expect(textChoices[0]).toHaveAttribute("aria-current", "true");
    expect(textChoices[1]).not.toHaveAttribute("aria-current", "true");
    expect(textChoices[1]).toHaveAccessibleName(/home/i);

    await user.click(textChoices[1]!);
    expect(onUpdate).toHaveBeenCalledWith({ senderPhone: "+14255550199" });
    expect(screen.getByRole("button", { name: /^text$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /^phone$/i }));
    const phoneMenu = screen.getByRole("menu");
    expect(within(phoneMenu).getAllByRole("menuitem")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /^phone$/i })).not.toBeInTheDocument();
  });

  it("keeps addresses and assignment in the details panel", () => {
    render(
      <LeadDetail
        submission={{
          ...baseSubmission,
          submissionId: "8e0919d5abcd",
          senderPhone: "+14255550182",
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
    expect(
      within(details).getByText("contact@trashbox.io"),
    ).toBeInTheDocument();
    expect(within(details).getByText("#8e0919d5")).toBeInTheDocument();
    expect(within(details).getByText("Ada")).toBeInTheDocument();
    expect(within(details).getByText("Web application")).toBeInTheDocument();
    expect(within(details).getByText("(425) 555-0182")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: /^messages$/i })).queryByText(
        "#8e0919d5",
      ),
    ).not.toBeInTheDocument();
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
    expect(
      messages.contains(screen.getByRole("heading", { name: /^Ada$/i })),
    ).toBe(true);
  });
});
