import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LeadInboxFilters } from "./LeadInboxFilters";

describe("LeadInboxFilters", () => {
  it("submits filter values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onApply = vi.fn();

    render(
      <LeadInboxFilters
        value={{ q: "", status: "", tag: "", assignedTo: "", formId: "" }}
        members={[
          {
            email: "sarah@example.com",
            role: "member",
            joinedAt: "2026-01-01",
            emailNotifications: false,
          },
        ]}
        forms={[
          {
            formId: "f1",
            clientId: "c1",
            name: "Contact",
            slug: "contact",
            active: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
        onChange={onChange}
        onApply={onApply}
      />,
    );

    const search = screen.getByLabelText(/search/i);
    expect(search).toHaveClass("search-clear-muted");
    expect(search).toHaveClass("placeholder:text-outline");
    await user.type(search, "estimate");
    expect(onChange).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^status$/i }));
    await user.click(
      within(screen.getByRole("listbox")).getByRole("option", {
        name: /contacted/i,
      }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "contacted" }),
    );

    await user.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(onApply).toHaveBeenCalled();
  });

  it("shows the member name on the assigned filter", () => {
    render(
      <LeadInboxFilters
        value={{
          q: "",
          status: "",
          tag: "",
          assignedTo: "sarah@example.com",
          formId: "",
        }}
        members={[
          {
            email: "sarah@example.com",
            role: "member",
            joinedAt: "2026-01-01",
            firstName: "Sarah",
            lastName: "Chen",
            emailNotifications: false,
          },
        ]}
        forms={[]}
        onChange={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    const assigned = screen.getByRole("button", { name: /assigned to/i });
    expect(assigned).toHaveTextContent("Sarah Chen");
    expect(assigned).toHaveTextContent("sarah@example.com");
  });
});
