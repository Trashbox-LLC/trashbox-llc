/** Labels given out in order when a number has none. */
export const PHONE_LABELS = [
  "phone",
  "mobile",
  "home",
  "work",
  "main",
  "school",
  "fax",
  "pager",
  "other",
] as const;

export interface ContactPhone {
  number: string;
  label: string;
}

export function defaultPhoneLabel(index: number): string {
  return PHONE_LABELS[index] ?? "other";
}

/** The next unused label, for a number someone is adding. */
export function nextPhoneLabel(used: string[]): string {
  const taken = new Set(used.map((label) => label.trim().toLowerCase()));
  return PHONE_LABELS.find((label) => !taken.has(label)) ?? "other";
}

export function labeledContactPhones(contact: {
  phones: string[];
  phoneLabels?: string[];
}): ContactPhone[] {
  return contact.phones.map((number, index) => ({
    number,
    label: contact.phoneLabels?.[index]?.trim() || defaultPhoneLabel(index),
  }));
}
