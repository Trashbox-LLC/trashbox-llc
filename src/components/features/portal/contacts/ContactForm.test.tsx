import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TeamMember } from "@/lib/api";
import { emptyContactForm } from "./contact-display";
import { ContactForm } from "./ContactForm";

const members: TeamMember[] = [
  {
    email: "rep@example.com",
    role: "member",
    joinedAt: "2026-01-01T00:00:00.000Z",
    emailNotifications: true,
  },
];

function setup(props: Partial<React.ComponentProps<typeof ContactForm>> = {}) {
  const handlers = {
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };
  render(
    <ContactForm
      values={emptyContactForm()}
      members={members}
      submitLabel="Save"
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("ContactForm", () => {
  it("refuses to submit until the contact can be identified", () => {
    setup();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("adds the next unused label when a phone is added", async () => {
    const values = {
      ...emptyContactForm(),
      phones: [{ number: "+15551234567", label: "phone" }],
    };
    const handlers = setup({ values });
    await userEvent.click(screen.getByRole("button", { name: /add phone/i }));
    expect(handlers.onChange).toHaveBeenCalledWith({
      ...values,
      phones: [
        { number: "+15551234567", label: "phone" },
        { number: "", label: "mobile" },
      ],
    });
  });

  it("keeps the number when its label changes", async () => {
    const values = {
      ...emptyContactForm(),
      firstName: "Sam",
      phones: [{ number: "+15551234567", label: "phone" }],
    };
    const handlers = setup({ values });
    await userEvent.click(screen.getByRole("button", { name: /phone label 1/i }));
    await userEvent.click(screen.getByRole("option", { name: /^home$/i }));
    expect(handlers.onChange).toHaveBeenCalledWith({
      ...values,
      phones: [{ number: "+15551234567", label: "home" }],
    });
  });

  it("allows submitting once an email is present", () => {
    setup({ values: { ...emptyContactForm(), emails: "sam@example.com" } });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("allows submitting on a name alone", () => {
    setup({ values: { ...emptyContactForm(), firstName: "Sam" } });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("allows submitting on a company alone", () => {
    setup({ values: { ...emptyContactForm(), company: "Acme" } });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("treats whitespace as empty", () => {
    setup({ values: { ...emptyContactForm(), firstName: "   " } });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("reports each edited field up with the rest of the values intact", async () => {
    const values = { ...emptyContactForm(), lastName: "Reed" };
    const handlers = setup({ values });
    await userEvent.type(screen.getByLabelText("First name"), "S");
    expect(handlers.onChange).toHaveBeenCalledWith({
      ...values,
      firstName: "S",
    });
  });

  it("submits when the form is submitted", async () => {
    const handlers = setup({
      values: { ...emptyContactForm(), firstName: "Sam" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(handlers.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit while a save is in flight", () => {
    setup({ values: { ...emptyContactForm(), firstName: "Sam" }, busy: true });
    expect(screen.getByRole("button", { name: /Saving/ })).toBeDisabled();
  });

  it("cancels without submitting", async () => {
    const handlers = setup();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
    expect(handlers.onSubmit).not.toHaveBeenCalled();
  });

  it("surfaces a save error", () => {
    setup({ error: "Email already belongs to another contact" });
    expect(
      screen.getByText("Email already belongs to another contact"),
    ).toBeInTheDocument();
  });
});
