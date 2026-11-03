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

    await user.type(screen.getByPlaceholderText("Jane Smith"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("jane@example.com"), "ada@example.com");
    await user.type(screen.getByPlaceholderText("How can we help?"), "Hello there.");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(
      await screen.findByText(/thanks—we got your message/i),
    ).toBeInTheDocument();
  });

  it("sends the phone number with the message as typed", async () => {
    vi.mocked(submitContactForm).mockResolvedValue({
      success: true,
      message: "Thanks—we got your message.",
    });

    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("Jane Smith"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("jane@example.com"), "ada@example.com");
    await user.type(screen.getByPlaceholderText("(555) 555-0100"), "714-555-0100");
    await user.type(screen.getByPlaceholderText("How can we help?"), "Hello. Test 123");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(submitContactForm).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello. Test 123",
      metadata: { phone: "714-555-0100" },
    });
  });
});
