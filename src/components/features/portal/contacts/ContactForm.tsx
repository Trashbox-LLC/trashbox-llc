"use client";

import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Select, type SelectOption } from "@/components/atoms/Select";
import { ContactAvatar } from "@/components/features/portal/contacts/ContactAvatar";
import { type ContactFormValues } from "@/components/features/portal/contacts/contact-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { teamMemberDisplayName, type TeamMember } from "@/lib/api";
import { PHONE_LABELS, nextPhoneLabel } from "@/lib/phone-labels";

function phoneLabelTitle(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Phone";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function phoneLabelOptions(current: string): SelectOption[] {
  const known = new Set<string>(PHONE_LABELS);
  const options = PHONE_LABELS.map((label) => ({
    value: label,
    label: phoneLabelTitle(label),
  }));
  const extra = current.trim().toLowerCase();
  if (extra && !known.has(extra)) {
    return [{ value: extra, label: phoneLabelTitle(extra) }, ...options];
  }
  return options;
}

/**
 * Grouped card of rows, the way a phone contact editor reads: an inset rounded
 * block whose rows are divided by hairlines rather than each being its own box.
 */
function FieldGroup({ children }: { children: ReactNode }) {
  return (
    <div className="border-outline-variant/10 bg-surface-container-low divide-outline-variant/10 divide-y overflow-hidden rounded-xl border shadow-sm">
      {children}
    </div>
  );
}

/** One labelled row inside a `FieldGroup`. */
function FieldRow({
  label,
  htmlFor,
  children,
  align = "center",
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={
        align === "start"
          ? "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4"
          : "flex flex-col gap-1 px-4 py-1.5 sm:flex-row sm:items-center sm:gap-4"
      }
    >
      <label
        htmlFor={htmlFor}
        className={`font-label text-outline shrink-0 text-[10px] tracking-widest uppercase sm:w-28 ${
          align === "start" ? "sm:pt-3" : ""
        }`}
      >
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const rowInputClass =
  "h-auto border-0 bg-transparent px-0 py-2.5 text-sm shadow-none placeholder:text-outline focus-visible:ring-0";

interface ContactFormProps {
  values: ContactFormValues;
  members: TeamMember[];
  busy?: boolean;
  error?: string | null;
  submitLabel: string;
  onChange: (next: ContactFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ContactForm({
  values,
  members,
  busy = false,
  error = null,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: ContactFormProps) {
  const set = <K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) => onChange({ ...values, [key]: value });

  const identified =
    values.emails.trim() !== "" ||
    values.phones.some((phone) => phone.number.trim() !== "") ||
    values.firstName.trim() !== "" ||
    values.lastName.trim() !== "" ||
    values.company.trim() !== "";

  // Mirrors the saved display name so the monogram updates while typing.
  const previewName =
    [values.firstName.trim(), values.lastName.trim()].filter(Boolean).join(" ") ||
    values.company.trim() ||
    values.emails.trim().split(/[\n,]/)[0]?.trim() ||
    values.phones.find((phone) => phone.number.trim())?.number.trim() ||
    "";

  return (
    <form
      className="mx-auto max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {error && (
        <p className="border-error/40 bg-error/10 text-error rounded border p-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        <ContactAvatar displayName={previewName} size="xl" />
        {previewName && (
          <p className="font-headline max-w-full truncate text-lg font-bold text-white">
            {previewName}
          </p>
        )}
      </div>

      <FieldGroup>
        <FieldRow label="First name" htmlFor="contact-first-name">
          <Input
            id="contact-first-name"
            value={values.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className={rowInputClass}
          />
        </FieldRow>
        <FieldRow label="Last name" htmlFor="contact-last-name">
          <Input
            id="contact-last-name"
            value={values.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className={rowInputClass}
          />
        </FieldRow>
        <FieldRow label="Company" htmlFor="contact-company">
          <Input
            id="contact-company"
            value={values.company}
            onChange={(e) => set("company", e.target.value)}
            className={rowInputClass}
          />
        </FieldRow>
        <FieldRow label="Job title" htmlFor="contact-job-title">
          <Input
            id="contact-job-title"
            value={values.jobTitle}
            onChange={(e) => set("jobTitle", e.target.value)}
            className={rowInputClass}
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup>
        <FieldRow label="Email" htmlFor="contact-emails" align="start">
          <Textarea
            id="contact-emails"
            rows={2}
            value={values.emails}
            onChange={(e) => set("emails", e.target.value)}
            placeholder={"sam@example.com\nsam.reed@work.com"}
            className="placeholder:text-outline min-h-0 resize-y border-0 bg-transparent px-0 py-2.5 text-sm shadow-none focus-visible:ring-0"
          />
          <p className="text-outline pb-2 text-xs">One per line</p>
        </FieldRow>
        <FieldRow label="Phone" htmlFor="contact-phone-0" align="start">
          <div className="flex w-full flex-col gap-2 py-2">
            {values.phones.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  id={index === 0 ? "contact-phone-0" : undefined}
                  aria-label={`Phone label ${index + 1}`}
                  variant="inline"
                  value={phone.label.trim().toLowerCase() || "phone"}
                  options={phoneLabelOptions(phone.label)}
                  onChange={(label) =>
                    set(
                      "phones",
                      values.phones.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label } : item,
                      ),
                    )
                  }
                />
                <Input
                  aria-label={`Phone number ${index + 1}`}
                  value={phone.number}
                  onChange={(e) =>
                    set(
                      "phones",
                      values.phones.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, number: e.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="+1 555 123 4567"
                  className={rowInputClass}
                />
                <button
                  type="button"
                  aria-label={`Remove phone ${index + 1}`}
                  onClick={() =>
                    set(
                      "phones",
                      values.phones.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="text-outline hover:text-white"
                >
                  <MaterialIcon name="close" className="text-base" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                set("phones", [
                  ...values.phones,
                  {
                    number: "",
                    label: nextPhoneLabel(values.phones.map((phone) => phone.label)),
                  },
                ])
              }
              className="text-primary w-fit text-sm"
            >
              Add phone
            </button>
          </div>
        </FieldRow>
      </FieldGroup>

      <FieldGroup>
        <FieldRow label="Address" htmlFor="contact-address">
          <Input
            id="contact-address"
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
            className={rowInputClass}
          />
        </FieldRow>
        <FieldRow label="Website" htmlFor="contact-website">
          <Input
            id="contact-website"
            value={values.website}
            onChange={(e) => set("website", e.target.value)}
            className={rowInputClass}
          />
        </FieldRow>
        <FieldRow label="Tags" htmlFor="contact-tags">
          <Input
            id="contact-tags"
            value={values.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="vip, repeat"
            className={rowInputClass}
          />
        </FieldRow>
        <FieldRow label="Owner" htmlFor="contact-owner-select">
          <Select
            id="contact-owner-select"
            variant="soft"
            value={values.ownerEmail}
            onChange={(ownerEmail) => set("ownerEmail", ownerEmail)}
            options={[
              { value: "", label: "Unassigned" },
              ...members.map((member) => {
                const label = teamMemberDisplayName(member);
                return {
                  value: member.email,
                  label,
                  menuLabel:
                    label === member.email
                      ? member.email
                      : `${label} (${member.email})`,
                };
              }),
            ]}
          />
        </FieldRow>
      </FieldGroup>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-on-surface-variant rounded font-label font-medium hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={busy || !identified}
          className="rounded bg-white font-label font-medium text-background shadow-sm hover:bg-white/90 hover:text-background"
        >
          {busy ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
