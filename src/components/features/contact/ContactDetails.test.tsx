import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactDetails } from "./ContactDetails";

describe("ContactDetails", () => {
  it("offers email, a call, and a text to the same number", () => {
    render(<ContactDetails />);

    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute(
      "href",
      "mailto:contact@trashbox.io",
    );

    const phone = screen.getByRole("link", { name: /^phone/i });
    const text = screen.getByRole("link", { name: /^text/i });

    expect(phone).toHaveAttribute("href", "tel:+17145861630");
    expect(phone).toHaveTextContent("714-586-1630");
    expect(text).toHaveAttribute("href", "sms:+17145861630");
    expect(text).toHaveTextContent("714-586-1630");
  });
});
