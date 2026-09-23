import { describe, expect, it } from "vitest";
import type { Contact } from "@/lib/api";
import {
  contactFormToInput,
  contactInitials,
  contactSubtitle,
  contactToForm,
  groupContactsByLetter,
  parseIdentityList,
} from "./contact-display";

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    clientId: "c1",
    contactId: "id",
    displayName: "Sam Reed",
    emails: [],
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

describe("contactInitials", () => {
  it("takes the first letter of the first two words", () => {
    expect(contactInitials("Sam Reed")).toBe("SR");
  });

  it("uses a single letter for a one-word name", () => {
    expect(contactInitials("Acme")).toBe("A");
  });

  it("skips past a leading symbol to the first letter", () => {
    expect(contactInitials("+15551234567")).toBe("1");
  });

  it("falls back to a placeholder for an empty name", () => {
    expect(contactInitials("")).toBe("?");
  });

  it("ignores a third word", () => {
    expect(contactInitials("Ana Maria de la Cruz")).toBe("AM");
  });
});

describe("contactSubtitle", () => {
  it("joins job title and company", () => {
    expect(
      contactSubtitle(contact({ jobTitle: "Owner", company: "Acme Roofing" })),
    ).toBe("Owner at Acme Roofing");
  });

  it("uses the company alone when there is no title", () => {
    expect(contactSubtitle(contact({ company: "Acme Roofing" }))).toBe(
      "Acme Roofing",
    );
  });

  it("uses the title alone when there is no company", () => {
    expect(contactSubtitle(contact({ jobTitle: "Owner" }))).toBe("Owner");
  });

  it("falls back to the primary email", () => {
    expect(contactSubtitle(contact({ emails: ["sam@example.com"] }))).toBe(
      "sam@example.com",
    );
  });

  it("formats the primary phone when there is nothing else", () => {
    expect(contactSubtitle(contact({ phones: ["+15551234567"] }))).toBe(
      "(555) 123-4567",
    );
  });

  it("returns nothing when there is no supporting detail", () => {
    expect(contactSubtitle(contact())).toBe("");
  });
});

describe("groupContactsByLetter", () => {
  it("groups by the first letter of the display name", () => {
    const groups = groupContactsByLetter([
      contact({ contactId: "a", displayName: "Alpha" }),
      contact({ contactId: "b", displayName: "Bravo" }),
      contact({ contactId: "a2", displayName: "avery" }),
    ]);
    expect(groups.map((g) => g.letter)).toEqual(["A", "B"]);
    expect(groups[0].contacts.map((c) => c.contactId)).toEqual(["a", "a2"]);
  });

  it("collects names that do not start with a letter under #", () => {
    const groups = groupContactsByLetter([
      contact({ contactId: "n", displayName: "42 Holdings" }),
    ]);
    expect(groups[0].letter).toBe("#");
  });

  it("preserves the order it was given within a group", () => {
    const groups = groupContactsByLetter([
      contact({ contactId: "second", displayName: "Ab" }),
      contact({ contactId: "first", displayName: "Aa" }),
    ]);
    expect(groups[0].contacts.map((c) => c.contactId)).toEqual([
      "second",
      "first",
    ]);
  });

  it("returns nothing for an empty list", () => {
    expect(groupContactsByLetter([])).toEqual([]);
  });
});

describe("parseIdentityList", () => {
  it("splits on newlines and commas", () => {
    expect(parseIdentityList("a@example.com, b@example.com\nc@example.com")).toEqual([
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);
  });

  it("drops blank entries and surrounding whitespace", () => {
    expect(parseIdentityList("  a@example.com ,, \n  ")).toEqual([
      "a@example.com",
    ]);
  });

  it("keeps duplicates for the server to de-duplicate", () => {
    expect(parseIdentityList("a@example.com, a@example.com")).toEqual([
      "a@example.com",
      "a@example.com",
    ]);
  });

  it("returns nothing for an empty string", () => {
    expect(parseIdentityList("")).toEqual([]);
  });
});

describe("contactToForm", () => {
  it("puts each email and phone on its own line", () => {
    const form = contactToForm(
      contact({
        emails: ["a@example.com", "b@example.com"],
        phones: ["+15551234567"],
      }),
    );
    expect(form.emails).toBe("a@example.com\nb@example.com");
    expect(form.phones).toEqual([{ number: "+15551234567", label: "phone" }]);
  });

  it("keeps a stored phone label", () => {
    const form = contactToForm(
      contact({
        phones: ["+15551234567"],
        phoneLabels: ["mobile"],
      }),
    );
    expect(form.phones).toEqual([{ number: "+15551234567", label: "mobile" }]);
  });

  it("joins tags with a comma", () => {
    expect(contactToForm(contact({ tags: ["vip", "repeat"] })).tags).toBe(
      "vip, repeat",
    );
  });

  it("leaves the owner blank when the contact is unassigned", () => {
    expect(contactToForm(contact()).ownerEmail).toBe("");
  });

  it("starts every text field as a string rather than undefined", () => {
    const form = contactToForm(contact());
    expect(form.firstName).toBe("");
    expect(form.company).toBe("");
    expect(form.address).toBe("");
  });
});

describe("contactFormToInput", () => {
  const blank = contactToForm(contact());

  it("turns the identity textareas back into arrays", () => {
    const input = contactFormToInput({
      ...blank,
      emails: "a@example.com\nb@example.com",
      phones: [{ number: "555-123-4567", label: "mobile" }],
    });
    expect(input.emails).toEqual(["a@example.com", "b@example.com"]);
    expect(input.phones).toEqual(["555-123-4567"]);
    expect(input.phoneLabels).toEqual(["mobile"]);
  });

  it("drops a phone row that has no number", () => {
    const input = contactFormToInput({
      ...blank,
      phones: [
        { number: "", label: "phone" },
        { number: "555-123-4567", label: "home" },
      ],
    });
    expect(input.phones).toEqual(["555-123-4567"]);
    expect(input.phoneLabels).toEqual(["home"]);
  });

  it("splits tags on commas", () => {
    expect(contactFormToInput({ ...blank, tags: "vip, repeat" }).tags).toEqual([
      "vip",
      "repeat",
    ]);
  });

  it("sends null for an unassigned owner rather than an empty string", () => {
    expect(contactFormToInput(blank).ownerEmail).toBeNull();
  });

  it("keeps a chosen owner", () => {
    expect(
      contactFormToInput({ ...blank, ownerEmail: "rep@example.com" }).ownerEmail,
    ).toBe("rep@example.com");
  });

  it("omits text fields that were left empty", () => {
    const input = contactFormToInput(blank);
    expect("firstName" in input).toBe(false);
    expect("company" in input).toBe(false);
  });

  it("trims text fields it does send", () => {
    expect(contactFormToInput({ ...blank, firstName: "  Sam  " }).firstName).toBe(
      "Sam",
    );
  });

  it("round-trips a fully populated contact", () => {
    const original = contact({
      firstName: "Sam",
      lastName: "Reed",
      company: "Acme Roofing",
      jobTitle: "Owner",
      address: "1 Main St",
      website: "https://acme.test",
      emails: ["sam@example.com"],
      phones: ["+15551234567"],
      tags: ["vip"],
      ownerEmail: "rep@example.com",
    });
    const input = contactFormToInput(contactToForm(original));
    expect(input).toMatchObject({
      firstName: "Sam",
      lastName: "Reed",
      company: "Acme Roofing",
      jobTitle: "Owner",
      address: "1 Main St",
      website: "https://acme.test",
      emails: ["sam@example.com"],
      phones: ["+15551234567"],
      phoneLabels: ["phone"],
      tags: ["vip"],
      ownerEmail: "rep@example.com",
    });
  });
});
