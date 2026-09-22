import { describe, expect, it } from "vitest";
import {
  EMAIL_CONTENT_LIMITS,
  TEMPLATE_VARIABLES,
  composeReplyHtml,
  contentBodyToHtml,
  decorateMergeFieldsHtml,
  extractReplyBody,
  extractReplySignature,
  htmlToPlainText,
  isMergeFieldVariant,
  matchSnippetShortcut,
  mergeFieldChipHtml,
  mergeFieldVariantId,
  parseMergeFieldVariant,
  plainTextToHtml,
  renderContentForInsert,
  PREVIEW_SAMPLE_CONTEXT,
  renderPreviewTemplate,
  renderTemplateVariables,
  replaceReplyBody,
  replaceReplySignature,
  sanitizeShortcutInput,
  snippetTriggerAtEnd,
  unknownTemplateVariables,
  withPreviewSamples,
} from "@/lib/email-content";

const context = {
  lead: { name: "Dana Lee Brooks", email: "dana@example.com" },
  business: { name: "Acme Hauling" },
  sender: { name: "Sales Team", email: "sales@acme.test" },
  now: new Date("2026-07-25T12:00:00.000Z"),
};

describe("renderPreviewTemplate", () => {
  it("replaces every catalog token with a sample value", () => {
    for (const variable of TEMPLATE_VARIABLES) {
      const rendered = renderPreviewTemplate(variable.token);
      expect(rendered).not.toBe(variable.token);
      expect(rendered).not.toContain("{{");
      expect(rendered.trim().length).toBeGreaterThan(0);
    }
    expect(renderPreviewTemplate("Hi {{lead.first_name}}")).toBe(
      `Hi ${PREVIEW_SAMPLE_CONTEXT.lead?.name?.split(" ")[0]}`,
    );
    expect(renderPreviewTemplate("Hi {{lead.nickname}}")).toBe(
      "Hi {{lead.nickname}}",
    );
  });
});

describe("withPreviewSamples", () => {
  it("keeps a provided business name and fills the other fields from the sample", () => {
    const merged = withPreviewSamples({ business: { name: "Acme Hauling" } });

    expect(
      renderTemplateVariables(
        "{{business.name}} {{sender.name}} {{sender.email}}",
        merged,
      ),
    ).toBe(
      `Acme Hauling ${PREVIEW_SAMPLE_CONTEXT.sender?.name} ${PREVIEW_SAMPLE_CONTEXT.sender?.email}`,
    );
  });
});

describe("renderTemplateVariables", () => {
  it("substitutes lead, business and sender tokens", () => {
    expect(
      renderTemplateVariables(
        "Hi {{lead.name}}, this is {{sender.name}} at {{business.name}}.",
        context,
      ),
    ).toBe("Hi Dana Lee Brooks, this is Sales Team at Acme Hauling.");
  });

  it("supports a first-name token", () => {
    expect(renderTemplateVariables("Hi {{lead.first_name}}!", context)).toBe(
      "Hi Dana!",
    );
  });

  it("tolerates whitespace inside the braces", () => {
    expect(renderTemplateVariables("Hi {{  lead.name  }}", context)).toBe(
      "Hi Dana Lee Brooks",
    );
  });

  it("renders every token in the published catalog", () => {
    for (const variable of TEMPLATE_VARIABLES) {
      expect(renderTemplateVariables(variable.token, context)).not.toBe(
        variable.token,
      );
    }
  });

  it("formats today's date", () => {
    expect(renderTemplateVariables("{{date.today}}", context)).toBe(
      "July 25, 2026",
    );
  });

  it("replaces a known token with an empty string when the value is missing", () => {
    expect(renderTemplateVariables("Hi {{lead.name}}!", {})).toBe("Hi !");
  });

  it("leaves unknown tokens untouched so typos stay visible", () => {
    expect(renderTemplateVariables("Hi {{lead.nickname}}", context)).toBe(
      "Hi {{lead.nickname}}",
    );
  });

  it("replaces every occurrence of a repeated token", () => {
    expect(
      renderTemplateVariables("{{lead.email}} / {{lead.email}}", context),
    ).toBe("dana@example.com / dana@example.com");
  });
});

describe("unknownTemplateVariables", () => {
  it("returns nothing for supported tokens", () => {
    expect(unknownTemplateVariables("{{lead.name}} {{business.name}}")).toEqual(
      [],
    );
  });

  it("reports unsupported tokens once each", () => {
    expect(
      unknownTemplateVariables("{{lead.nickname}} {{lead.nickname}} {{oops}}"),
    ).toEqual(["{{lead.nickname}}", "{{oops}}"]);
  });

  it("builds merge-field palette variant ids and chip html", () => {
    expect(mergeFieldVariantId("{{lead.first_name}}")).toBe(
      "merge-lead.first_name",
    );
    expect(isMergeFieldVariant("merge-lead.first_name")).toBe(true);
    expect(parseMergeFieldVariant("merge-lead.first_name")?.label).toBe(
      "Lead first name",
    );
    expect(mergeFieldChipHtml("{{lead.first_name}}")).toContain(
      'data-tb-merge="lead.first_name"',
    );
    expect(mergeFieldChipHtml("{{lead.first_name}}")).toContain(
      "{{lead.first_name}}",
    );
    expect(mergeFieldChipHtml("{{lead.first_name}}")).toContain(
      'contenteditable="false"',
    );
  });

  it("decorates bare merge tokens without double-wrapping chips", () => {
    const decorated = decorateMergeFieldsHtml(
      "<p>Hi {{lead.first_name}}</p>",
    );
    expect(decorated).toContain('data-tb-merge="lead.first_name"');
    expect(decorateMergeFieldsHtml(decorated)).toBe(decorated);
  });
});

describe("sanitizeShortcutInput", () => {
  it("lowercases and drops a leading slash", () => {
    expect(sanitizeShortcutInput("/Business-Hours")).toBe("business-hours");
  });

  it("turns spaces into hyphens", () => {
    expect(sanitizeShortcutInput("business hours")).toBe("business-hours");
  });

  it("strips characters the API would reject instead of erroring", () => {
    expect(sanitizeShortcutInput("hours!?")).toBe("hours");
  });

  it("drops leading hyphens and underscores", () => {
    expect(sanitizeShortcutInput("--hours")).toBe("hours");
  });

  it("truncates to the API limit", () => {
    const long = "a".repeat(EMAIL_CONTENT_LIMITS.shortcut + 10);
    expect(sanitizeShortcutInput(long)).toHaveLength(
      EMAIL_CONTENT_LIMITS.shortcut,
    );
  });

  it("returns an empty string for input with nothing usable", () => {
    expect(sanitizeShortcutInput("!!!")).toBe("");
  });
});

describe("plainTextToHtml", () => {
  it("escapes markup so bodies cannot inject HTML", () => {
    expect(plainTextToHtml("<b>hi</b> & bye")).toBe(
      "&lt;b&gt;hi&lt;/b&gt; &amp; bye",
    );
  });

  it("converts newlines to line breaks", () => {
    expect(plainTextToHtml("one\ntwo")).toBe("one<br />two");
  });
});

describe("contentBodyToHtml", () => {
  it("prefers stored rich text when present", () => {
    expect(
      contentBodyToHtml({ bodyText: "Hi", bodyHtml: "<p>Hi</p>" }),
    ).toBe("<p>Hi</p>");
  });

  it("falls back to escaped plain text", () => {
    expect(contentBodyToHtml({ bodyText: "a < b" })).toBe("a &lt; b");
  });
});

describe("renderContentForInsert", () => {
  it("renders merge fields in both the text and html bodies", () => {
    const result = renderContentForInsert(
      {
        bodyText: "Hi {{lead.first_name}}",
        bodyHtml: "<p>Hi {{lead.first_name}}</p>",
      },
      context,
    );
    expect(result.text).toBe("Hi Dana");
    expect(result.html).toBe("<p>Hi Dana</p>");
  });

  it("derives html from text when no rich text was stored", () => {
    const result = renderContentForInsert(
      { bodyText: "Hi {{lead.first_name}}\nThanks" },
      context,
    );
    expect(result.text).toBe("Hi Dana\nThanks");
    expect(result.html).toBe("Hi Dana<br />Thanks");
  });
});

describe("matchSnippetShortcut", () => {
  const snippets = [
    { id: "1", shortcut: "hours", name: "Hours" },
    { id: "2", shortcut: "", name: "No shortcut" },
  ];

  it("finds a snippet by shortcut with or without a slash", () => {
    expect(matchSnippetShortcut(snippets, "hours")?.id).toBe("1");
    expect(matchSnippetShortcut(snippets, "/hours")?.id).toBe("1");
  });

  it("ignores case", () => {
    expect(matchSnippetShortcut(snippets, "/HOURS")?.id).toBe("1");
  });

  it("returns undefined for an unknown shortcut", () => {
    expect(matchSnippetShortcut(snippets, "/pricing")).toBeUndefined();
  });

  it("never matches snippets without a shortcut", () => {
    expect(matchSnippetShortcut(snippets, "")).toBeUndefined();
  });
});

describe("snippetTriggerAtEnd", () => {
  it("returns the shortcut when the text ends with /shortcut", () => {
    expect(snippetTriggerAtEnd("See you /hours")).toBe("hours");
  });

  it("works when the slash token is the whole text", () => {
    expect(snippetTriggerAtEnd("/hours")).toBe("hours");
  });

  it("returns null when there is no trailing slash token", () => {
    expect(snippetTriggerAtEnd("hello hours")).toBeNull();
    expect(snippetTriggerAtEnd("hello /hours more")).toBeNull();
  });
});

describe("composeReplyHtml", () => {
  it("wraps body and signature so the signature can be swapped later", () => {
    expect(composeReplyHtml("<p>Hi</p>", "<p>Thanks</p>")).toBe(
      '<div data-trashbox-body><p>Hi</p></div><div data-trashbox-signature><p>Thanks</p></div>',
    );
  });

  it("omits the signature block when none is selected", () => {
    expect(composeReplyHtml("<p>Hi</p>")).toBe(
      '<div data-trashbox-body><p>Hi</p></div>',
    );
  });
});

describe("replaceReplySignature", () => {
  it("swaps an existing signature block", () => {
    const html = composeReplyHtml("<p>Hi</p>", "<p>Old</p>");
    expect(replaceReplySignature(html, "<p>New</p>")).toBe(
      composeReplyHtml("<p>Hi</p>", "<p>New</p>"),
    );
  });

  it("appends a signature when the draft never had one", () => {
    expect(replaceReplySignature("<p>Hi</p>", "<p>Sig</p>")).toBe(
      composeReplyHtml("<p>Hi</p>", "<p>Sig</p>"),
    );
  });
});

describe("replaceReplyBody", () => {
  it("replaces the body while preserving the signature", () => {
    const html = composeReplyHtml("<p>Old</p>", "<p>Sig</p>");
    expect(replaceReplyBody(html, "<p>New</p>")).toBe(
      composeReplyHtml("<p>New</p>", "<p>Sig</p>"),
    );
  });
});

describe("extractReplyBody", () => {
  it("returns the body region inner HTML", () => {
    const html = composeReplyHtml("<p>Hi <strong>Ada</strong></p>", "<p>Sig</p>");
    expect(extractReplyBody(html)).toBe("<p>Hi <strong>Ada</strong></p>");
  });

  it("falls back to the full HTML when there is no body marker", () => {
    expect(extractReplyBody("<p>Loose</p>")).toBe("<p>Loose</p>");
  });
});

describe("extractReplySignature", () => {
  it("returns the signature region inner HTML", () => {
    const html = composeReplyHtml("<p>Hi</p>", "<p>Thanks</p>");
    expect(extractReplySignature(html)).toBe("<p>Thanks</p>");
  });

  it("returns empty string when there is no signature", () => {
    expect(extractReplySignature(composeReplyHtml("<p>Hi</p>"))).toBe("");
  });
});

describe("htmlToPlainText", () => {
  it("strips tags and preserves basic line breaks", () => {
    expect(htmlToPlainText("<p>Hi Ada</p><p>Thanks</p>")).toContain("Hi Ada");
    expect(htmlToPlainText("<p>Hi<br />Ada</p>")).toMatch(/Hi\s*Ada/);
  });
});
