import { describe, expect, it } from "vitest";
import {
  EMAIL_CONTENT_LIMITS,
  TEMPLATE_VARIABLES,
  unknownTemplateVariables,
} from "@/lib/email-content";
import {
  EMAIL_TEMPLATE_STARTERS,
  EMAIL_TEMPLATE_STARTER_CATEGORIES,
  getStarterById,
  starterThumbnailImage,
  startersByCategory,
  type EmailTemplateStarterCategory,
} from "@/lib/email-template-starters";

const knownTokens = new Set(TEMPLATE_VARIABLES.map((v) => v.token));

describe("EMAIL_TEMPLATE_STARTERS", () => {
  it("includes blank and basic layout skeletons", () => {
    const basic = startersByCategory("basic");
    expect(basic.map((s) => s.name)).toEqual(
      expect.arrayContaining([
        "Blank",
        "One column",
        "Two column",
        "Two column with image",
      ]),
    );
  });

  it("includes reply starters across intent categories", () => {
    const categories: EmailTemplateStarterCategory[] = [
      "followup",
      "welcome",
      "quotes",
      "notification",
    ];
    for (const category of categories) {
      expect(startersByCategory(category).length).toBeGreaterThan(0);
    }
  });

  it("exposes every category in the nav catalog", () => {
    expect(EMAIL_TEMPLATE_STARTER_CATEGORIES.map((c) => c.id)).toEqual([
      "all",
      "basic",
      "followup",
      "welcome",
      "quotes",
      "notification",
    ]);
  });

  it("gives every starter a unique id, name, body, and thumbnail", () => {
    const ids = new Set<string>();
    for (const starter of EMAIL_TEMPLATE_STARTERS) {
      expect(starter.id).toBeTruthy();
      expect(ids.has(starter.id)).toBe(false);
      ids.add(starter.id);
      expect(starter.name.trim()).toBeTruthy();
      expect(starter.bodyText.trim().length + starter.bodyHtml.trim().length).toBeGreaterThan(
        0,
      );
      expect(starter.thumbnail).toBeTruthy();
      expect(starter.name.length).toBeLessThanOrEqual(EMAIL_CONTENT_LIMITS.name);
      if (starter.subject) {
        expect(starter.subject.length).toBeLessThanOrEqual(
          EMAIL_CONTENT_LIMITS.subject,
        );
      }
      expect(starter.bodyText.length).toBeLessThanOrEqual(
        EMAIL_CONTENT_LIMITS.bodyText,
      );
      expect(starter.bodyHtml.length).toBeLessThanOrEqual(
        EMAIL_CONTENT_LIMITS.bodyHtml,
      );
    }
  });

  it("only uses published merge-field tokens", () => {
    for (const starter of EMAIL_TEMPLATE_STARTERS) {
      const unknown = unknownTemplateVariables(
        `${starter.subject ?? ""} ${starter.bodyText} ${starter.bodyHtml}`,
      );
      expect(unknown).toEqual([]);
      for (const token of unknown) {
        expect(knownTokens.has(token)).toBe(true);
      }
    }
  });

  it("looks up starters by id", () => {
    const first = EMAIL_TEMPLATE_STARTERS[0];
    expect(first).toBeDefined();
    expect(getStarterById(first!.id)).toEqual(first);
    expect(getStarterById("missing")).toBeUndefined();
  });

  it("maps each starter to a gallery thumbnail image", () => {
    expect(starterThumbnailImage(getStarterById("basic-blank")!)).toBe(
      "/images/email-templates/blank.webp",
    );
    expect(starterThumbnailImage(getStarterById("basic-one-column")!)).toBe(
      "/images/email-templates/one-column.webp",
    );
    expect(starterThumbnailImage(getStarterById("basic-two-column")!)).toBe(
      "/images/email-templates/two-column.webp",
    );
    expect(
      starterThumbnailImage(getStarterById("basic-two-column-image")!),
    ).toBe("/images/email-templates/two-column-image.webp");
    expect(starterThumbnailImage(getStarterById("followup-check-in")!)).toBe(
      "/images/email-templates/followup.webp",
    );
    expect(starterThumbnailImage(getStarterById("welcome-thanks")!)).toBe(
      "/images/email-templates/welcome.webp",
    );
    expect(starterThumbnailImage(getStarterById("quotes-pricing")!)).toBe(
      "/images/email-templates/quote.webp",
    );
    expect(
      starterThumbnailImage(getStarterById("notification-next-step")!),
    ).toBe("/images/email-templates/notification.webp");
  });

  it("filters by category and returns all for the all filter", () => {
    expect(startersByCategory("all")).toHaveLength(EMAIL_TEMPLATE_STARTERS.length);
    expect(
      startersByCategory("basic").every((s) => s.category === "basic"),
    ).toBe(true);
  });
});
