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

    expect(screen.queryByRole("button", { name: /^status$/i })).not.toBeInTheDocument();

    const search = screen.getByLabelText(/search/i);
    await user.type(search, "estimate");
    expect(onChange).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /add filter/i }));
    await user.click(screen.getByRole("menuitem", { name: /^status$/i }));
    await user.click(
      within(screen.getByRole("listbox")).getByRole("option", {
        name: /contacted/i,
      }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "contacted" }),
    );
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ status: "contacted" }),
    );
  });

  it("leaves an already shown filter out of the add menu", async () => {
    const user = userEvent.setup();
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
            emailNotifications: false,
          },
        ]}
        forms={[]}
        onChange={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add filter/i }));
    expect(
      screen.queryByRole("menuitem", { name: /assigned to/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /^tag$/i })).toBeInTheDocument();
  });

  it("clears a filter when it is removed", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <LeadInboxFilters
        value={{
          q: "",
          status: "",
          tag: "vip",
          assignedTo: "",
          formId: "",
        }}
        members={[]}
        forms={[]}
        onChange={vi.fn()}
        onApply={onApply}
      />,
    );

    await user.click(screen.getByRole("button", { name: /remove tag/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ tag: "" }),
    );
  });

  it("hides add filter when every filter is already set", () => {
    render(
      <LeadInboxFilters
        value={{
          q: "",
          status: "new",
          tag: "vip",
          assignedTo: "sarah@example.com",
          formId: "f1",
        }}
        members={[]}
        forms={[]}
        onChange={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /add filter/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^form$/i })).toBeInTheDocument();
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

    const assigned = screen.getByRole("button", { name: /^assigned to$/i });
    expect(assigned).toHaveTextContent("Sarah Chen");
    expect(assigned).toHaveTextContent("sarah@example.com");
  });
});
