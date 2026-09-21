import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { submitContactForm } from "@/lib/contact-form";
import { ContactForm } from "./ContactForm";

vi.mock("@/lib/contact-form", () => ({
  submitContactForm: vi.fn(),
}));

describe("ContactForm", () => {
  it("shows success message after a valid submission", async () => {
    vi.mocked(submitContactForm).mockResolvedValue({
      success: true,
      message: "Thanks—we got your message.",
    });

    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("Your name"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("you@company.com"), "ada@example.com");
    await user.type(
      screen.getByPlaceholderText("Share a short brief, timeline, or goals…"),
      "Need a marketing site for launch.",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/thanks—we got your message/i),
    ).toBeInTheDocument();
  });

  it("sends the chosen service as metadata and leaves the message as typed", async () => {
    vi.mocked(submitContactForm).mockResolvedValue({
      success: true,
      message: "Thanks—we got your message.",
    });

    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("Your name"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("you@company.com"), "ada@example.com");
    await user.click(screen.getByRole("combobox", { name: /what do you need/i }));
    await user.click(screen.getByRole("option", { name: "Web application" }));
    await user.type(
      screen.getByPlaceholderText("Share a short brief, timeline, or goals…"),
      "Hello. Test 123",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(submitContactForm).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello. Test 123",
      metadata: { service: "Web application" },
    });
  });

  it("exposes email and phone contact links", () => {
    render(<ContactForm />);

    expect(screen.getByRole("link", { name: /contact@trashbox\.io/i })).toHaveAttribute(
      "href",
      "mailto:contact@trashbox.io",
    );
    expect(screen.getByRole("link", { name: /714-586-1630/i })).toHaveAttribute(
      "href",
      "tel:+17145861630",
    );
  });
});
