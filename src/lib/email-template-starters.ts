/**
 * Client-side starter catalog for the template gallery.
 * Starters seed the editor only — saving creates a real account template.
 */

export type EmailTemplateStarterCategory =
  | "basic"
  | "followup"
  | "welcome"
  | "quotes"
  | "notification";

export type EmailTemplateStarterThumbnail =
  | "blank"
  | "one_column"
  | "two_column"
  | "two_column_image"
  | "text";

export interface EmailTemplateStarter {
  id: string;
  name: string;
  category: EmailTemplateStarterCategory;
  subject?: string;
  bodyText: string;
  bodyHtml: string;
  thumbnail: EmailTemplateStarterThumbnail;
}

export interface EmailTemplateStarterCategoryNav {
  id: "all" | EmailTemplateStarterCategory;
  label: string;
}

export const EMAIL_TEMPLATE_STARTER_CATEGORIES: readonly EmailTemplateStarterCategoryNav[] =
  [
    { id: "all", label: "All" },
    { id: "basic", label: "Basic" },
    { id: "followup", label: "Follow-up" },
    { id: "welcome", label: "Welcome" },
    { id: "quotes", label: "Quotes" },
    { id: "notification", label: "Notification" },
  ] as const;

/** Wide photo used by the two-column image starter. */
export const EMAIL_TEMPLATE_STOCK_IMAGE =
  "/images/email-templates/two-column-hero.webp";

const PLACEHOLDER_LINE =
  '<div style="height:10px;background:#d4d4d4;border-radius:2px;margin:6px 0;"></div>';
const PLACEHOLDER_SHORT =
  '<div style="height:10px;width:60%;background:#d4d4d4;border-radius:2px;margin:6px 0;"></div>';
const IMAGE_BLOCK =
  '<div style="height:72px;background:#c4c4c4;border-radius:2px;margin-bottom:10px;"></div>';

function layoutParagraphs(...html: string[]): string {
  return html.join("");
}

/** Designed email shell. The colored band sits at the top so gallery cards read as a layout, not a blank page. */
function emailFrame(accent: string, rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;">
<tr><td style="background:${accent};padding:16px 18px;font-size:12px;letter-spacing:1.8px;text-transform:uppercase;color:#ffffff;">{{business.name}}</td></tr>
<tr><td style="padding:8px 10px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;">
${rows}
</table>
</td></tr></table>`;
}

function kicker(text: string): string {
  return `<tr><td style="padding:16px 16px 2px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8175;">${text}</td></tr>`;
}

function heading(text: string): string {
  return `<tr><td style="padding:4px 16px 10px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.1;color:#1c1917;">${text}</td></tr>`;
}

function copy(html: string): string {
  return `<tr><td style="padding:0 16px 14px;font-size:15px;line-height:1.5;color:#44403c;">${html}</td></tr>`;
}

function action(label: string, accent: string): string {
  return `<tr><td style="padding:2px 16px 8px;"><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="background:${accent};border-radius:8px;"><a href="mailto:{{sender.email}}" style="display:inline-block;padding:12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${label}</a></td></tr></table></td></tr>`;
}

function signoff(): string {
  return `<tr><td style="padding:10px 16px 18px;font-size:14px;line-height:1.45;color:#1c1917;">{{sender.name}}<br /><span style="color:#8a8175;">{{sender.email}}</span></td></tr>`;
}

const STARTER_THUMBNAIL_BY_ID: Record<string, string> = {
  "basic-blank": "/images/email-templates/blank.webp",
  "basic-one-column": "/images/email-templates/one-column.webp",
  "basic-two-column": "/images/email-templates/two-column.webp",
  "basic-two-column-image": "/images/email-templates/two-column-image.webp",
  "followup-check-in": "/images/email-templates/followup.webp",
  "followup-no-answer": "/images/email-templates/followup.webp",
  "welcome-thanks": "/images/email-templates/welcome.webp",
  "welcome-intro": "/images/email-templates/welcome.webp",
  "quotes-pricing": "/images/email-templates/quote.webp",
  "quotes-ready": "/images/email-templates/quote.webp",
  "notification-next-step": "/images/email-templates/notification.webp",
  "notification-appointment": "/images/email-templates/notification.webp",
};

export const EMAIL_TEMPLATE_STARTERS: readonly EmailTemplateStarter[] = [
  {
    id: "basic-blank",
    name: "Blank",
    category: "basic",
    subject: "",
    bodyText: "",
    bodyHtml: "<p><br /></p>",
    thumbnail: "blank",
  },
  {
    id: "basic-one-column",
    name: "One column",
    category: "basic",
    subject: "",
    bodyText:
      "A clear note\n\nSay what matters here.\n\nAdd the detail underneath.",
    bodyHtml: emailFrame(
      "#1c1917",
      [
        kicker("Note"),
        heading("A clear note"),
        copy(
          "<p style=\"margin:0 0 10px;\">Say what matters in the first line.</p><p style=\"margin:0;\">Add the detail underneath, then invite a reply.</p>",
        ),
        action("Continue", "#1c1917"),
        signoff(),
      ].join(""),
    ),
    thumbnail: "one_column",
  },
  {
    id: "basic-two-column",
    name: "Two column",
    category: "basic",
    subject: "",
    bodyText: "First point\nA short detail.\n\nSecond point\nA short detail.",
    bodyHtml: emailFrame(
      "#1c1917",
      `<tr><td style="padding:6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr>
<td width="50%" valign="top" style="padding:16px;background:#fff7ed;">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:1.4px;color:#c2410c;">01</p>
<p style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;line-height:1.15;color:#1c1917;">First point</p>
<p style="margin:0;font-size:14px;line-height:1.45;color:#44403c;">A short detail the reader can scan.</p>
</td>
<td width="50%" valign="top" style="padding:16px;background:#f5f5f4;">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:1.4px;color:#57534e;">02</p>
<p style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;line-height:1.15;color:#1c1917;">Second point</p>
<p style="margin:0;font-size:14px;line-height:1.45;color:#44403c;">A matching detail beside it.</p>
</td>
</tr>
</table>
</td></tr>`,
    ),
    thumbnail: "two_column",
  },
  {
    id: "basic-two-column-image",
    name: "Two column with image",
    category: "basic",
    subject: "",
    bodyText:
      "Image\n\nFirst point\nA short detail.\n\nSecond point\nA short detail.",
    bodyHtml: emailFrame(
      "#1c1917",
      `<tr><td style="padding:0;line-height:0;font-size:0;"><img src="${EMAIL_TEMPLATE_STOCK_IMAGE}" alt="Sunlit workspace" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" /></td></tr>
<tr><td style="padding:6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr>
<td width="50%" valign="top" style="padding:14px;border-right:1px solid #e7e5e4;">
<p style="margin:0 0 6px;font-family:Georgia,serif;font-size:20px;color:#1c1917;">First point</p>
<p style="margin:0;font-size:14px;line-height:1.45;color:#44403c;">A short detail under the image.</p>
</td>
<td width="50%" valign="top" style="padding:14px;">
<p style="margin:0 0 6px;font-family:Georgia,serif;font-size:20px;color:#1c1917;">Second point</p>
<p style="margin:0;font-size:14px;line-height:1.45;color:#44403c;">A matching detail beside it.</p>
</td>
</tr>
</table>
</td></tr>`,
    ),
    thumbnail: "two_column_image",
  },
  {
    id: "followup-check-in",
    name: "Follow-up check-in",
    category: "followup",
    subject: "Following up on your inquiry",
    bodyText: `Hi {{lead.first_name}},

Just checking in on your note to {{business.name}}. Happy to answer questions or help with the next step.

{{sender.name}}`,
    bodyHtml: emailFrame(
      "#c2410c",
      [
        kicker("Follow-up"),
        heading("Still here if you need us"),
        copy(
          "<p style=\"margin:0;\">Hi {{lead.first_name}}, just checking in on your note to {{business.name}}. Happy to answer questions or help with the next step.</p>",
        ),
        action("Reply", "#c2410c"),
        signoff(),
      ].join(""),
    ),
    thumbnail: "text",
  },
  {
    id: "followup-no-answer",
    name: "Tried reaching you",
    category: "followup",
    subject: "Trying to reach you",
    bodyText: `Hi {{lead.first_name}},

We tried you on {{date.today}} and missed you. Reply when you have a moment and we'll find a time.

{{sender.name}}
{{business.name}}`,
    bodyHtml: emailFrame(
      "#9a3412",
      [
        kicker("Missed you"),
        heading("We tried reaching you"),
        copy(
          "<p style=\"margin:0;\">Hi {{lead.first_name}}, we tried you on {{date.today}} and missed you. Reply when you have a moment and we'll find a time.</p>",
        ),
        action("Pick a time", "#9a3412"),
        signoff(),
      ].join(""),
    ),
    thumbnail: "text",
  },
  {
    id: "welcome-thanks",
    name: "Thanks for reaching out",
    category: "welcome",
    subject: "Thanks for contacting {{business.name}}",
    bodyText: `Hi {{lead.first_name}},

Thanks for writing {{business.name}}. We have your message and will reply shortly.

{{sender.name}}`,
    bodyHtml: emailFrame(
      "#0f766e",
      [
        kicker("Welcome"),
        heading("Thanks for reaching out"),
        copy(
          "<p style=\"margin:0;\">Hi {{lead.first_name}}, thanks for writing {{business.name}}. We have your message and will reply shortly.</p>",
        ),
        action("Add a detail", "#0f766e"),
        signoff(),
      ].join(""),
    ),
    thumbnail: "text",
  },
  {
    id: "welcome-intro",
    name: "Welcome introduction",
    category: "welcome",
    subject: "Welcome from {{business.name}}",
    bodyText: `Hi {{lead.first_name}},

Welcome to {{business.name}}. Tell us what you need and we'll point you the right way.

{{sender.name}}`,
    bodyHtml: emailFrame(
      "#115e59",
      [
        kicker("Hello"),
        heading("Welcome in"),
        copy(
          "<p style=\"margin:0;\">Hi {{lead.first_name}}, welcome to {{business.name}}. Tell us what you need and we'll point you the right way.</p>",
        ),
        action("Tell us more", "#115e59"),
        signoff(),
      ].join(""),
    ),
    thumbnail: "text",
  },
  {
    id: "quotes-pricing",
    name: "Quote / pricing",
    category: "quotes",
    subject: "Your quote from {{business.name}}",
    bodyText: `Hi {{lead.first_name}},

Here is your quote from {{business.name}}.

Service: [describe]
Estimate: [amount]

{{sender.name}}`,
    bodyHtml: emailFrame(
      "#1d4ed8",
      [
        kicker("Quote"),
        heading("Your quote"),
        copy(
          "<p style=\"margin:0 0 12px;\">Hi {{lead.first_name}}, here is what {{business.name}} can offer.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;background:#eff6ff;\"><tr><td style=\"padding:12px 14px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#1d4ed8;\">Service</td><td style=\"padding:12px 14px;font-size:15px;color:#1c1917;\">[describe]</td></tr><tr><td style=\"padding:12px 14px;border-top:1px solid #dbeafe;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#1d4ed8;\">Estimate</td><td style=\"padding:12px 14px;border-top:1px solid #dbeafe;font-family:Georgia,serif;font-size:22px;color:#1c1917;\">[amount]</td></tr></table>",
        ),
        action("Accept quote", "#1d4ed8"),
        signoff(),
      ].join(""),
    ),
    thumbnail: "text",
  },
  {
    id: "quotes-ready",
    name: "Quote ready to review",
    category: "quotes",
    subject: "Your quote is ready",
    bodyText: `Hi {{lead.first_name}},

Your quote from {{business.name}} is ready. Reply if anything looks off, or if you want to move ahead.

{{sender.name}}`,
    bodyHtml: emailFrame(
      "#1e40af",
      [
        kicker("Ready"),
        heading("Your quote is ready"),
        copy(
          "<p style=\"margin:0;\">Hi {{lead.first_name}}, your quote from {{business.name}} is ready. Reply if anything looks off, or if you want to move ahead.</p>",
        ),
        action("Review quote", "#1e40af"),
        signoff(),
      ].join(""),
    ),
    thumbnail: "text",
  },
  {
    id: "notification-next-step",
    name: "Next-step reminder",
    category: "notification",
    subject: "Next steps with {{business.name}}",
    bodyText: `Hi {{lead.first_name}},

Next steps with {{business.name}}:

1. [Step one]
2. [Step two]
3. [Step three]

{{sender.name}}`,
    bodyHtml: emailFrame(
      "#6d28d9",
      [
        kicker("Next steps"),
        heading("Here's what's next"),
        copy(
          "<p style=\"margin:0 0 12px;\">Hi {{lead.first_name}}, a short list from {{business.name}}.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;\"><tr><td style=\"width:36px;padding:8px 0;font-family:Georgia,serif;font-size:20px;color:#6d28d9;\">1</td><td style=\"padding:8px 0;font-size:15px;color:#1c1917;\">[Step one]</td></tr><tr><td style=\"width:36px;padding:8px 0;border-top:1px solid #ede9fe;font-family:Georgia,serif;font-size:20px;color:#6d28d9;\">2</td><td style=\"padding:8px 0;border-top:1px solid #ede9fe;font-size:15px;color:#1c1917;\">[Step two]</td></tr><tr><td style=\"width:36px;padding:8px 0;border-top:1px solid #ede9fe;font-family:Georgia,serif;font-size:20px;color:#6d28d9;\">3</td><td style=\"padding:8px 0;border-top:1px solid #ede9fe;font-size:15px;color:#1c1917;\">[Step three]</td></tr></table>",
        ),
        signoff(),
      ].join(""),
    ),
    thumbnail: "text",
  },
  {
    id: "notification-appointment",
    name: "Appointment confirmation",
    category: "notification",
    subject: "Confirming your appointment",
    bodyText: `Hi {{lead.first_name}},

This confirms your time with {{business.name}} on [date/time].

Reply to reschedule, or write {{sender.email}}.

{{sender.name}}`,
    bodyHtml: emailFrame(
      "#5b21b6",
      [
        kicker("Confirmed"),
        heading("You're on the calendar"),
        copy(
          "<p style=\"margin:0 0 12px;\">Hi {{lead.first_name}}, this confirms your time with {{business.name}}.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;background:#f5f3ff;\"><tr><td style=\"padding:14px 14px 4px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#6d28d9;\">When</td></tr><tr><td style=\"padding:0 14px 14px;font-family:Georgia,serif;font-size:22px;color:#1c1917;\">[date/time]</td></tr></table>",
        ),
        action("Reschedule", "#5b21b6"),
        signoff(),
      ].join(""),
    ),
    thumbnail: "text",
  },
];

/** Static preview art for a starter. The gallery renders bodyHtml instead. */
export function starterThumbnailImage(starter: EmailTemplateStarter): string {
  return (
    STARTER_THUMBNAIL_BY_ID[starter.id] ?? "/images/email-templates/blank.webp"
  );
}

/** Wireframe preview markup used only in gallery thumbnails (not sent in email). */
export function starterThumbnailPreview(
  thumbnail: EmailTemplateStarterThumbnail,
): string {
  switch (thumbnail) {
    case "blank":
      return "";
    case "one_column":
      return layoutParagraphs(PLACEHOLDER_LINE, PLACEHOLDER_LINE, PLACEHOLDER_SHORT);
    case "two_column":
      return `<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" style="padding-right:4px;">${PLACEHOLDER_LINE}${PLACEHOLDER_SHORT}</td>
<td width="50%" style="padding-left:4px;">${PLACEHOLDER_LINE}${PLACEHOLDER_SHORT}</td>
</tr></table>`;
    case "two_column_image":
      return `${IMAGE_BLOCK}<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" style="padding-right:4px;">${PLACEHOLDER_LINE}${PLACEHOLDER_SHORT}</td>
<td width="50%" style="padding-left:4px;">${PLACEHOLDER_LINE}${PLACEHOLDER_SHORT}</td>
</tr></table>`;
    case "text":
      return layoutParagraphs(PLACEHOLDER_SHORT, PLACEHOLDER_LINE, PLACEHOLDER_LINE, PLACEHOLDER_SHORT);
  }
}

export function getStarterById(
  id: string,
): EmailTemplateStarter | undefined {
  return EMAIL_TEMPLATE_STARTERS.find((starter) => starter.id === id);
}

export function startersByCategory(
  category: "all" | EmailTemplateStarterCategory,
): EmailTemplateStarter[] {
  if (category === "all") return [...EMAIL_TEMPLATE_STARTERS];
  return EMAIL_TEMPLATE_STARTERS.filter((starter) => starter.category === category);
}

export function draftFromStarter(starter: EmailTemplateStarter): {
  name: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
} {
  return {
    name: starter.name,
    subject: starter.subject ?? "",
    bodyText: starter.bodyText,
    bodyHtml: starter.bodyHtml,
  };
}
