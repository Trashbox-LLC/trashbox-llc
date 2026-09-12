import { describe, expect, it } from "vitest";
import {
  leadContactLabel,
  leadMessageTimelineLabels,
  resolveComposerChannel,
} from "@/lib/lead-messages";
import type { LeadMessage } from "@/lib/api";

function message(overrides: Partial<LeadMessage> = {}): LeadMessage {
  return {
    clientId: "client_1",
    submissionId: "sub_1",
    messageId: "msg_1",
    direction: "outbound",
    from: "owner@studio.test",
    to: "lead@example.test",
    subject: "Re: Quote request",
    bodyText: "Body",
    createdAt: "2026-09-10T17:00:00.000Z",
    ...overrides,
  };
}

describe("leadMessageTimelineLabels", () => {
  it("treats a message with no channel as email", () => {
    const labels = leadMessageTimelineLabels(message({ channel: undefined }));

    expect(labels.icon).toBe("send");
    expect(labels.eyebrow).toContain("lead@example.test");
  });

  it("names the counterpart as the recipient when outbound", () => {
    const labels = leadMessageTimelineLabels(
      message({ direction: "outbound" }),
    );

    expect(labels.eyebrow).toBe("Sent owner@studio.test → lead@example.test");
    expect(labels.accent).toBe("primary");
  });

  it("names the counterpart as the sender when inbound", () => {
    const labels = leadMessageTimelineLabels(message({ direction: "inbound" }));

    expect(labels.eyebrow).toBe("Received ← owner@studio.test");
    expect(labels.accent).toBe("muted");
  });

  it("formats phone numbers instead of addresses on the SMS channel", () => {
    const labels = leadMessageTimelineLabels(
      message({
        channel: "sms",
        direction: "inbound",
        from: "+14255550182",
        to: "+18005550100",
      }),
    );

    expect(labels.eyebrow).toBe("Text received ← (425) 555-0182");
    expect(labels.icon).toBe("sms");
  });

  it("falls back to a channel-specific title when there is no subject", () => {
    expect(
      leadMessageTimelineLabels(message({ subject: "", channel: "sms" })).title,
    ).toBe("Text sent");
    expect(
      leadMessageTimelineLabels(
        message({ subject: "", channel: "sms", direction: "inbound" }),
      ).title,
    ).toBe("Text received");
    expect(leadMessageTimelineLabels(message({ subject: "" })).title).toBe(
      "Reply sent",
    );
  });

  it("prefers the subject when the email carries one", () => {
    expect(leadMessageTimelineLabels(message()).title).toBe(
      "Re: Quote request",
    );
  });

  it("ignores a stray subject on a text, which has no subject line", () => {
    expect(
      leadMessageTimelineLabels(message({ channel: "sms", subject: "junk" }))
        .title,
    ).toBe("Text sent");
  });
});

describe("leadContactLabel", () => {
  it("prefers the email address", () => {
    expect(
      leadContactLabel({
        senderEmail: "ada@example.test",
        senderPhone: "+14255550182",
      }),
    ).toBe("ada@example.test");
  });

  it("falls back to the phone number for leads that texted in", () => {
    expect(
      leadContactLabel({ senderEmail: "", senderPhone: "+14255550182" }),
    ).toBe("(425) 555-0182");
  });

  it("reports nothing when the lead has neither", () => {
    expect(leadContactLabel({ senderEmail: "  " })).toBeNull();
  });
});

describe("resolveComposerChannel", () => {
  it("keeps the requested channel when it is usable", () => {
    expect(
      resolveComposerChannel({
        requested: "sms",
        canEmail: true,
        canSms: true,
      }),
    ).toBe("sms");
  });

  it("falls back to the other channel when the request is unusable", () => {
    expect(
      resolveComposerChannel({
        requested: "sms",
        canEmail: true,
        canSms: false,
      }),
    ).toBe("email");
    expect(
      resolveComposerChannel({
        requested: "email",
        canEmail: false,
        canSms: true,
      }),
    ).toBe("sms");
  });

  it("reports no channel when the lead cannot be contacted at all", () => {
    expect(
      resolveComposerChannel({
        requested: "email",
        canEmail: false,
        canSms: false,
      }),
    ).toBeNull();
  });
});
