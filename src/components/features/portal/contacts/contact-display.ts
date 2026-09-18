import type { Contact, ContactInput } from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/phone";

export function contactInitials(displayName: string): string {
  const letters = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, "").charAt(0))
    .filter(Boolean)
    .join("");
  return letters.toUpperCase() || "?";
}

/** The supporting line under a contact's name in lists and headers. */
export function contactSubtitle(contact: Contact): string {
  const title = contact.jobTitle?.trim();
  const company = contact.company?.trim();
  if (title && company) return `${title} at ${company}`;
  if (company) return company;
  if (title) return title;
  const email = contact.emails[0];
  if (email) return email;
  const phone = contact.phones[0];
  if (phone) return formatPhoneDisplay(phone);
  return "";
}

export interface ContactLetterGroup {
  letter: string;
  contacts: Contact[];
}

/**
 * Alphabetical sections for the contact list. Order within a group is left as
 * given, so the server's sort decides it.
 */
export function groupContactsByLetter(
  contacts: Contact[],
): ContactLetterGroup[] {
  const groups = new Map<string, Contact[]>();

  for (const contact of contacts) {
    const first = contact.displayName.trim().charAt(0).toUpperCase();
    const letter = /^[A-Z]$/.test(first) ? first : "#";
    const bucket = groups.get(letter);
    if (bucket) bucket.push(contact);
    else groups.set(letter, [contact]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ letter, contacts: items }));
}

/** Emails and phones are entered one per line, but commas are forgiven. */
export function parseIdentityList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  address: string;
  website: string;
  emails: string;
  phones: string;
  tags: string;
  ownerEmail: string;
}

export function contactToForm(contact: Contact): ContactFormValues {
  return {
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    company: contact.company || "",
    jobTitle: contact.jobTitle || "",
    address: contact.address || "",
    website: contact.website || "",
    emails: contact.emails.join("\n"),
    phones: contact.phones.join("\n"),
    tags: contact.tags.join(", "),
    ownerEmail: contact.ownerEmail || "",
  };
}

export function emptyContactForm(): ContactFormValues {
  return {
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    address: "",
    website: "",
    emails: "",
    phones: "",
    tags: "",
    ownerEmail: "",
  };
}

/**
 * Empty text fields are omitted rather than sent as "", so a PATCH never has to
 * distinguish "cleared" from "untouched" for fields the form does not own.
 */
export function contactFormToInput(
  values: ContactFormValues,
): Partial<ContactInput> {
  const text = (value: string) => value.trim() || undefined;

  return {
    ...(text(values.firstName) ? { firstName: text(values.firstName) } : {}),
    ...(text(values.lastName) ? { lastName: text(values.lastName) } : {}),
    ...(text(values.company) ? { company: text(values.company) } : {}),
    ...(text(values.jobTitle) ? { jobTitle: text(values.jobTitle) } : {}),
    ...(text(values.address) ? { address: text(values.address) } : {}),
    ...(text(values.website) ? { website: text(values.website) } : {}),
    emails: parseIdentityList(values.emails),
    phones: parseIdentityList(values.phones),
    tags: parseIdentityList(values.tags),
    ownerEmail: text(values.ownerEmail) ?? null,
  };
}
