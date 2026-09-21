import type { ComponentProps } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  EmailSignature,
  EmailSnippet,
  EmailTemplate,
  LeadMessage,
} from "@/lib/api";
import { LeadEmailThread } from "./LeadEmailThread";

function dayChip(iso: string): string {
  const date = new Date(iso);
  const month = new Intl.DateTimeFormat(undefined, { month: "short" }).format(
    date,
  );
  return `${month} ${date.getDate()}`.toUpperCase();
}

const fromOptions = [
  {
    id: "s1",
    label: "Sales Team (Default)",
    displayName: "Sales Team",
  },
  { id: "s2", label: "Support", displayName: "Support" },
];

const templates: EmailTemplate[] = [
  {
    clientId: "c1",
    id: "t1",
    name: "Intro reply",
    subject: "Thanks for reaching out",
    bodyText: "Hi {{lead.first_name}}, happy to help.",
    bodyHtml: "<p>Hi {{lead.first_name}}, happy to help.</p>",
    createdBy: "owner@example.com",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];

const signatures: EmailSignature[] = [
  {
    clientId: "c1",
    id: "sig1",
    name: "Default",
    bodyText: "Thanks,\n{{sender.name}}",
    bodyHtml: "<p>Thanks,<br />{{sender.name}}</p>",
    isDefault: true,
    createdBy: "owner@example.com",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    clientId: "c1",
    id: "sig2",
    name: "Short",
    bodyText: "— Support",
    bodyHtml: "<p>— Support</p>",
    isDefault: false,
    createdBy: "owner@example.com",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];

const snippets: EmailSnippet[] = [
  {
    clientId: "c1",
    id: "sn1",
    name: "Business hours",
    shortcut: "hours",
    bodyText: "We are open 8am–5pm.",
    bodyHtml: "<p>We are open 8am–5pm.</p>",
    createdBy: "owner@example.com",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];

const library = { templates, signatures, snippets };

const sampleReply: LeadMessage = {
  clientId: "c1",
  submissionId: "s1",
  messageId: "m1",
  direction: "outbound",
  from: "sales@acme.test",
  to: "ada@example.com",
  subject: "Re: Need a quote",
  bodyText: "Happy to help.",
  createdAt: "2026-07-15T18:00:00.000Z",
  sentBy: "owner@example.com",
};

/** Appended so earlier replies stay in History (latest is featured above). */
const featuredLatest: LeadMessage = {
  clientId: "c1",
  submissionId: "s1",
  messageId: "m-latest",
  direction: "inbound",
  from: "ada@example.com",
  to: "sales@acme.test",
  subject: "Featured",
  bodyText: "Featured above history.",
  createdAt: "2099-01-01T00:00:00.000Z",
};

const variableContext = {
  lead: { name: "Ada Lovelace", email: "ada@example.com" },
  business: { name: "Acme Hauling" },
  sender: { name: "Sales Team", email: "sales@acme.test" },
};

function renderConnected(
  props: Partial<ComponentProps<typeof LeadEmailThread>> = {},
) {
  const messages = props.messages ?? [];
  return render(
    <LeadEmailThread
      formMessage="Need a quote"
      formFrom="ada@example.com"
      formAt="2026-07-15T12:00:00.000Z"
      featuredBody="Need a quote"
      mailboxConnected
      fromOptions={fromOptions}
      fromAddress="sales@acme.test"
      library={library}
      variableContext={variableContext}
      onSend={vi.fn().mockResolvedValue(undefined)}
      showHistory={messages.length > 0}
      messages={messages}
      {...props}
    />,
  );
}

async function pickMenuItem(
  user: ReturnType<typeof userEvent.setup>,
  menuLabel: RegExp,
  itemName: RegExp,
) {
  await user.click(screen.getByRole("button", { name: menuLabel }));
  await user.click(screen.getByRole("menuitem", { name: itemName }));
}

async function pickTemplate(
  user: ReturnType<typeof userEvent.setup>,
  itemName: RegExp,
) {
  await user.click(screen.getByRole("button", { name: /^template$/i }));
  const gallery = await screen.findByRole("dialog", {
    name: /template gallery/i,
  });
  await user.click(within(gallery).getByRole("button", { name: itemName }));
}

describe("LeadEmailThread", () => {
  it("shows settings CTA when mailbox is disconnected", () => {
    render(
      <LeadEmailThread
        formMessage="Need a quote"
        formFrom="ada@example.com"
        formAt="2026-07-15T12:00:00.000Z"
        featuredBody="Need a quote"
        messages={[]}
        mailboxConnected={false}
        onSend={vi.fn()}
      />,
    );

    expect(screen.getByText(/connect a business mailbox/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send message/i }),
    ).not.toBeInTheDocument();
  });

  it("sends a reply with the selected Sender Display Name", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);

    renderConnected({ onSend });

    await pickTemplate(user, /intro reply/i);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(onSend).toHaveBeenCalledWith(
      expect.stringContaining("Hi Ada, happy to help."),
      expect.any(String),
      { fromIdentityId: "s1" },
    );
  });

  it("disables send when no Sender Display Name is assigned", () => {
    renderConnected({
      fromOptions: [],
      library: { templates: [], signatures: [], snippets: [] },
    });

    expect(
      screen.getByText(/No Sender Display Name assigned/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeDisabled();
  });

  it("disables send when draft is empty", () => {
    renderConnected({
      library: { templates: [], signatures: [], snippets: [] },
    });

    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeDisabled();
  });

  it("styles the send button as white", () => {
    renderConnected({
      library: { templates: [], signatures: [], snippets: [] },
    });

    expect(screen.getByRole("button", { name: /send message/i })).toHaveClass(
      "bg-white",
      "text-background",
    );
  });

  it("segments the timeline by date with labeled day headings", () => {
    const laterDayReply: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m2",
      direction: "outbound",
      from: "sales@acme.test",
      to: "ada@example.com",
      subject: "Follow-up",
      bodyText: "Just checking in.",
      createdAt: "2026-07-16T15:00:00.000Z",
      sentBy: "owner@example.com",
    };
    const sameDayReply: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m1",
      direction: "outbound",
      from: "sales@acme.test",
      to: "ada@example.com",
      subject: "Re: Need a quote",
      bodyText: "Happy to help.",
      createdAt: "2026-07-15T18:00:00.000Z",
      sentBy: "owner@example.com",
    };
    const newestReply: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m3",
      direction: "inbound",
      from: "ada@example.com",
      to: "sales@acme.test",
      subject: "Latest",
      bodyText: "Featured above history.",
      createdAt: "2026-07-16T18:00:00.000Z",
    };

    renderConnected({
      messages: [sameDayReply, laterDayReply, newestReply],
      library: { templates: [], signatures: [], snippets: [] },
    });

    const dayLabels = screen
      .getAllByRole("time")
      .filter((el) =>
        /^\d{4}-\d{2}-\d{2}$/.test(el.getAttribute("dateTime") ?? ""),
      );
    expect(dayLabels).toHaveLength(2);
    expect(dayLabels[0]).toHaveTextContent(dayChip("2026-07-15T12:00:00.000Z"));
    expect(dayLabels[1]).toHaveTextContent(dayChip("2026-07-16T15:00:00.000Z"));

    expect(
      screen.getByRole("button", { name: /^Need a quote$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Re: Need a quote$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Follow-up$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Latest$/i }),
    ).toBeInTheDocument();

    const daySections = screen.getAllByLabelText(/^Messages on /i);
    expect(daySections).toHaveLength(2);
    expect(
      document.querySelector('[data-slot="timeline-spine"]'),
    ).toBeInTheDocument();
  });

  it("hides the timeline when showHistory is false", () => {
    renderConnected({
      messages: [sampleReply],
      showHistory: false,
      library: { templates: [], signatures: [], snippets: [] },
    });

    expect(
      screen.queryByRole("heading", { name: /^history$/i }),
    ).not.toBeInTheDocument();
    const history = document.querySelector('[aria-label="Message history"]');
    expect(history).toHaveAttribute("aria-hidden", "true");
    expect(history?.className).toMatch(/grid-rows-\[0fr\]/);
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("hides the timeline when there is only the form submission", () => {
    renderConnected({
      library: { templates: [], signatures: [], snippets: [] },
    });

    expect(screen.queryByText(/^history$/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/form submission event/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("includes the latest reply in the history timeline", () => {
    renderConnected({
      messages: [sampleReply],
      featuredBody: "Happy to help.",
      featuredAuthor: "Sales Team",
      library: { templates: [], signatures: [], snippets: [] },
    });

    const history = screen.getByRole("region", { name: /message history/i });
    expect(
      within(history).getByRole("button", { name: /^Re: Need a quote$/i }),
    ).toBeInTheDocument();
    expect(within(history).getByText("Happy to help.")).toBeInTheDocument();
    expect(screen.getAllByText("Happy to help.")).toHaveLength(1);
  });

  it("shows prevalent timeline icons for each node", () => {
    renderConnected({
      messages: [sampleReply],
      library: { templates: [], signatures: [], snippets: [] },
    });

    expect(screen.getByLabelText(/form submission event/i)).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="timeline-connector"]'),
    ).toBeInTheDocument();
  });

  it("shows the event time on the history card", () => {
    renderConnected({
      messages: [sampleReply],
      library: { templates: [], signatures: [], snippets: [] },
    });

    const card = screen.getByRole("button", { name: /^Need a quote$/i });
    expect(within(card).getByRole("time")).toHaveTextContent(
      new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(
        new Date("2026-07-15T12:00:00.000Z"),
      ),
    );
  });

  it("labels sent and received messages with directional arrows", () => {
    const outbound: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m1",
      direction: "outbound",
      from: "sales@acme.test",
      to: "customer@gmail.com",
      subject: "Re: Need a quote",
      bodyText: "Happy to help.",
      createdAt: "2026-07-15T18:00:00.000Z",
      sentBy: "owner@example.com",
    };
    const inbound: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m2",
      direction: "inbound",
      from: "customer@gmail.com",
      to: "sales@acme.test",
      subject: "Re: Need a quote",
      bodyText: "Thanks!",
      createdAt: "2026-07-15T19:00:00.000Z",
    };

    renderConnected({
      messages: [outbound, inbound, featuredLatest],
      library: { templates: [], signatures: [], snippets: [] },
    });

    expect(
      screen.getByText(/Form Submission ← ada@example\.com/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sent sales@acme\.test → customer@gmail\.com/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Received ← customer@gmail\.com/i),
    ).toBeInTheDocument();
  });

  it("shows a truncated content preview on closed cards", async () => {
    const user = userEvent.setup();
    const reply: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m1",
      direction: "outbound",
      from: "sales@acme.test",
      to: "ada@example.com",
      subject: "Re: Need a quote",
      bodyText:
        "Happy to help with your quote request. We can schedule a pickup this week if that works for you.",
      createdAt: "2026-07-15T18:00:00.000Z",
    };

    renderConnected({
      messages: [reply, featuredLatest],
      library: { templates: [], signatures: [], snippets: [] },
    });

    const card = screen.getByRole("button", { name: /^Re: Need a quote$/i });
    expect(card).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Happy to help with your quote request/i)).toBeInTheDocument();

    await user.click(card);

    const preview = document.querySelector(".line-clamp-2");
    expect(preview).toHaveTextContent(/Happy to help with your quote request/i);
    expect(card).toHaveAttribute("aria-expanded", "false");
  });

  it("hides to, from, and date meta rows inside timeline entries", () => {
    const reply: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m1",
      direction: "outbound",
      from: "sales@acme.test",
      to: "ada@example.com",
      subject: "Re: Need a quote",
      bodyText: "Happy to help.",
      createdAt: "2026-07-15T18:00:00.000Z",
      sentBy: "owner@example.com",
    };

    renderConnected({
      messages: [reply, featuredLatest],
      library: { templates: [], signatures: [], snippets: [] },
    });

    const body = screen.getByText("Happy to help.");
    expect(body.previousElementSibling).toBeNull();
    expect(body).toHaveClass("whitespace-pre-wrap");
    expect(
      within(body.parentElement as HTMLElement).queryByText(/^from$/i),
    ).not.toBeInTheDocument();
    expect(
      within(body.parentElement as HTMLElement).queryByText(/^to$/i),
    ).not.toBeInTheDocument();
    expect(
      within(body.parentElement as HTMLElement).queryByText(/^date$/i),
    ).not.toBeInTheDocument();
  });

  it("toggles the card when clicking anywhere on it", async () => {
    const user = userEvent.setup();
    const reply: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m1",
      direction: "outbound",
      from: "sales@acme.test",
      to: "ada@example.com",
      subject: "Re: Need a quote",
      bodyText: "Happy to help.",
      createdAt: "2026-07-15T18:00:00.000Z",
    };

    renderConnected({
      messages: [reply, featuredLatest],
      library: { templates: [], signatures: [], snippets: [] },
    });

    const card = screen.getByRole("button", { name: /^Re: Need a quote$/i });
    expect(card).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByText("Happy to help."));
    expect(card).toHaveAttribute("aria-expanded", "false");

    await user.click(
      screen.getByText(/Sent sales@acme\.test → ada@example\.com/i),
    );
    expect(card).toHaveAttribute("aria-expanded", "true");
  });

  it("does not toggle while text is selected", async () => {
    const user = userEvent.setup();
    const reply: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m1",
      direction: "outbound",
      from: "sales@acme.test",
      to: "ada@example.com",
      subject: "Re: Need a quote",
      bodyText: "Happy to help.",
      createdAt: "2026-07-15T18:00:00.000Z",
    };

    renderConnected({
      messages: [reply, featuredLatest],
      library: { templates: [], signatures: [], snippets: [] },
    });

    const card = screen.getByRole("button", { name: /^Re: Need a quote$/i });
    expect(card).toHaveAttribute("aria-expanded", "true");

    const getSelection = vi.spyOn(window, "getSelection").mockReturnValue({
      toString: () => "Happy to help.",
    } as Selection);

    try {
      await user.click(screen.getByText("Happy to help."));
      expect(card).toHaveAttribute("aria-expanded", "true");
    } finally {
      getSelection.mockRestore();
    }
  });

  it("shows message details in an info tooltip on hover", async () => {
    const user = userEvent.setup();
    const reply: LeadMessage = {
      clientId: "c1",
      submissionId: "s1",
      messageId: "m1",
      direction: "outbound",
      from: "sales@acme.test",
      to: "ada@example.com",
      subject: "Re: Need a quote",
      bodyText: "Happy to help.",
      createdAt: "2026-07-15T18:00:00.000Z",
      sentBy: "owner@example.com",
    };

    renderConnected({
      messages: [reply, featuredLatest],
      library: { templates: [], signatures: [], snippets: [] },
    });

    await user.hover(
      screen.getByRole("button", { name: /details for re: need a quote/i }),
    );

    expect(await screen.findByRole("tooltip")).toHaveTextContent(/from/i);
    expect(screen.getByRole("tooltip")).toHaveTextContent("sales@acme.test");
    expect(screen.getByRole("tooltip")).toHaveTextContent(/to/i);
    expect(screen.getByRole("tooltip")).toHaveTextContent("ada@example.com");
    expect(screen.getByRole("tooltip")).toHaveTextContent(/date/i);
  });

  it("seeds the default signature into a new reply", async () => {
    renderConnected();

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: /reply/i }).textContent,
      ).toContain("Sales Team");
    });
  });

  it("applies a template into layout preview with merge fields resolved", async () => {
    const user = userEvent.setup();
    renderConnected();

    await pickTemplate(user, /intro reply/i);

    await waitFor(() => {
      expect(screen.getByTitle("Layout preview")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /edit layout/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove layout/i })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /reply/i })).not.toBeInTheDocument();
    // Default signature stays attached under the layout.
    expect(screen.getByLabelText(/reply signature/i).innerHTML).toContain(
      "Sales Team",
    );
    expect(screen.getByTitle("Layout preview").getAttribute("srcdoc")).toContain(
      "Hi Ada, happy to help.",
    );
  });

  it("applies a gallery starter into layout preview", async () => {
    const user = userEvent.setup();
    renderConnected({
      library: { templates: [], signatures, snippets: [] },
    });

    await pickTemplate(user, /follow-up check-in/i);

    await waitFor(() => {
      expect(screen.getByTitle("Layout preview")).toBeInTheDocument();
    });
    const srcDoc = screen.getByTitle("Layout preview").getAttribute("srcdoc") ?? "";
    expect(srcDoc).toContain("Just checking in on your recent inquiry");
    expect(srcDoc).toContain("Ada");
  });

  it("switches the signature without wiping the layout body", async () => {
    const user = userEvent.setup();
    renderConnected();

    await pickTemplate(user, /intro reply/i);
    await waitFor(() => {
      expect(screen.getByTitle("Layout preview")).toBeInTheDocument();
    });
    await pickMenuItem(user, /^signature$/i, /^short$/i);

    await waitFor(() => {
      expect(screen.getByLabelText(/reply signature/i).innerHTML).toContain(
        "— Support",
      );
    });
    expect(screen.getByTitle("Layout preview").getAttribute("srcdoc")).toContain(
      "Hi Ada, happy to help.",
    );
    expect(screen.getByLabelText(/reply signature/i).innerHTML).not.toContain(
      "Sales Team",
    );
  });

  it("opens the layout builder popup and inserts draft-only changes", async () => {
    const user = userEvent.setup();
    renderConnected();

    await pickTemplate(user, /intro reply/i);
    await waitFor(() => {
      expect(screen.getByTitle("Layout preview")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /edit layout/i }));
    const builder = await screen.findByRole("dialog", { name: /edit layout/i });
    expect(
      within(builder).getByRole("button", { name: /^insert$/i }),
    ).toBeInTheDocument();
    expect(
      within(builder).queryByPlaceholderText(/template name/i),
    ).not.toBeInTheDocument();

    await user.click(within(builder).getByRole("button", { name: /^insert$/i }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /edit layout/i }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTitle("Layout preview")).toBeInTheDocument();
  });

  it("removes the layout and restores the plain reply editor", async () => {
    const user = userEvent.setup();
    renderConnected();

    await pickTemplate(user, /intro reply/i);
    await waitFor(() => {
      expect(screen.getByTitle("Layout preview")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /remove layout/i }));
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /reply/i })).toBeInTheDocument();
    });
    expect(screen.queryByTitle("Layout preview")).not.toBeInTheDocument();
  });

  it("inserts a snippet from the picker", async () => {
    const user = userEvent.setup();
    renderConnected({
      library: { templates: [], signatures: [], snippets },
    });

    await pickMenuItem(user, /^snippet$/i, /business hours/i);

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: /reply/i }).textContent,
      ).toContain("We are open 8am–5pm.");
    });
  });

  it("links to settings when the library is empty", () => {
    renderConnected({
      library: { templates: [], signatures: [], snippets: [] },
    });

    const toolbar = screen.getByRole("toolbar", { name: /formatting/i });
    expect(
      within(toolbar).getByRole("link", { name: /manage in settings/i }),
    ).toHaveAttribute("href", expect.stringMatching(/templates/));
  });

  it("keeps library menus inside the formatting toolbar", () => {
    renderConnected();

    const toolbar = screen.getByRole("toolbar", { name: /formatting/i });
    expect(
      within(toolbar).getByRole("button", { name: /^template$/i }),
    ).toBeInTheDocument();
    expect(
      within(toolbar).getByRole("button", { name: /^snippet$/i }),
    ).toBeInTheDocument();
    expect(
      within(toolbar).getByRole("button", { name: /^signature$/i }),
    ).toBeInTheDocument();
  });
});

describe("LeadEmailThread channels", () => {
  const smsProps = {
    availableChannels: ["email", "sms"] as const,
    leadPhone: "+14255550182",
    smsFromPhone: "+18005550100",
  };

  it("composes on email until another channel is picked", () => {
    renderConnected({ ...smsProps, onSendSms: vi.fn() });

    expect(screen.getByRole("textbox", { name: /reply/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /text message/i }),
    ).not.toBeInTheDocument();
  });

  it("swaps in the text composer when the text channel is picked", async () => {
    const user = userEvent.setup();
    renderConnected({ ...smsProps, onSendSms: vi.fn() });

    await user.click(screen.getByRole("tab", { name: /text/i }));

    expect(
      screen.getByRole("textbox", { name: /text message/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /reply/i }),
    ).not.toBeInTheDocument();
  });

  it("sends through the text handler, not the email one", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    const onSendSms = vi.fn().mockResolvedValue(undefined);
    renderConnected({ ...smsProps, onSend, onSendSms });

    await user.click(screen.getByRole("tab", { name: /text/i }));
    await user.type(
      screen.getByRole("textbox", { name: /text message/i }),
      "On my way",
    );
    await user.click(screen.getByRole("button", { name: /send text/i }));

    expect(onSendSms).toHaveBeenCalledWith("On my way");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("offers no channel switch when only email is available", () => {
    renderConnected({ onSendSms: vi.fn() });

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("goes straight to the text composer for a lead with no mailbox", () => {
    renderConnected({
      ...smsProps,
      availableChannels: ["sms"],
      mailboxConnected: false,
      onSendSms: vi.fn(),
    });

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /text message/i }),
    ).toBeInTheDocument();
  });

  it("hides the text channel for a lead with no phone number", () => {
    renderConnected({
      ...smsProps,
      leadPhone: undefined,
      onSendSms: vi.fn(),
    });

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /reply/i })).toBeInTheDocument();
  });

  it("labels a texted history entry by phone number", () => {
    renderConnected({
      messages: [
        {
          ...sampleReply,
          messageId: "m-sms",
          channel: "sms",
          direction: "inbound",
          subject: "",
          from: "+14255550182",
          to: "+18005550100",
          bodyText: "Still interested",
        },
        featuredLatest,
      ],
    });

    expect(screen.getByText(/\(425\) 555-0182/)).toBeInTheDocument();
  });
});
