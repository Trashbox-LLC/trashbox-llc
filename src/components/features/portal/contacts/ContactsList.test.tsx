import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Contact, TeamMember } from "@/lib/api";
import {
  ContactsList,
  type ContactsListFilters,
} from "./ContactsList";

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

const member: TeamMember = {
  email: "rep@example.com",
  role: "member",
  joinedAt: "2026-01-01T00:00:00.000Z",
  emailNotifications: true,
};

const filters: ContactsListFilters = {
  q: "",
  sort: "name",
  ownerEmail: "",
  tag: "",
};

function setup(props: Partial<React.ComponentProps<typeof ContactsList>> = {}) {
  const handlers = {
    onFiltersChange: vi.fn(),
    onApply: vi.fn(),
    onSelect: vi.fn(),
    onNew: vi.fn(),
    onLoadMore: vi.fn(),
    onSearchOrg: vi.fn(),
    onClearOrgSearch: vi.fn(),
  };
  render(
    <ContactsList
      contacts={[contact()]}
      total={1}
      members={[member]}
      tags={[]}
      filters={filters}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("ContactsList", () => {
  it("reports the contact a row was clicked for", async () => {
    const handlers = setup({
      contacts: [
        contact({ contactId: "a", displayName: "Alpha" }),
        contact({ contactId: "b", displayName: "Bravo" }),
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: /Bravo/ }));
    expect(handlers.onSelect).toHaveBeenCalledWith("b");
  });

  it("applies filters on submit rather than on every keystroke", async () => {
    const handlers = setup();
    await userEvent.type(screen.getByLabelText("Search"), "sam");
    expect(handlers.onApply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(handlers.onApply).toHaveBeenCalledTimes(1);
  });

  it("passes typed search text up as a filter change", async () => {
    const handlers = setup();
    await userEvent.type(screen.getByLabelText("Search"), "s");
    expect(handlers.onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      q: "s",
    });
  });

  it("groups alphabetically when sorting by name", () => {
    setup({
      contacts: [
        contact({ contactId: "a", displayName: "Alpha" }),
        contact({ contactId: "b", displayName: "Bravo" }),
      ],
    });
    expect(
      screen.getAllByTestId("contact-group-letter").map((el) => el.textContent),
    ).toEqual(["A", "B"]);
  });

  it("drops the letter headings for the other sorts", () => {
    setup({
      filters: { ...filters, sort: "recent" },
      contacts: [contact({ displayName: "Alpha" })],
    });
    expect(screen.queryByTestId("contact-group-letter")).not.toBeInTheDocument();
  });

  it("hides the org-wide search unless the viewer may use it", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: /Search all projects/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps the org-wide search disabled without a query", () => {
    setup({ canSearchOrg: true });
    expect(
      screen.getByRole("button", { name: /Search all projects/ }),
    ).toBeDisabled();
  });

  it("runs the org-wide search once there is a query", async () => {
    const handlers = setup({
      canSearchOrg: true,
      filters: { ...filters, q: "sam" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: /Search all projects/ }),
    );
    expect(handlers.onSearchOrg).toHaveBeenCalledTimes(1);
  });

  it("shows which project an org-wide match came from", () => {
    setup({
      orgMatches: [
        {
          contact: contact({ displayName: "Other Sam" }),
          projectId: "p2",
          projectName: "Second Project",
        },
      ],
    });
    expect(screen.getByText("Second Project")).toBeInTheDocument();
  });

  it("distinguishes an empty org-wide search from one that never ran", () => {
    setup({ orgMatches: [] });
    expect(
      screen.getByText(/No matches in your other projects/),
    ).toBeInTheDocument();
  });

  it("offers to load more only when the server said there is more", () => {
    setup({ hasMore: true });
    expect(
      screen.getByRole("button", { name: "Load more" }),
    ).toBeInTheDocument();
  });

  it("explains an empty list differently when filters are active", () => {
    setup({ contacts: [], total: 0, filters: { ...filters, q: "zzz" } });
    expect(screen.getByText(/No contacts match those filters/)).toBeInTheDocument();
  });

  it("shows a plain empty state when no filters are set", () => {
    setup({ contacts: [], total: 0 });
    expect(screen.getByText(/No contacts yet/)).toBeInTheDocument();
  });

  it("surfaces a load error", () => {
    setup({ error: "Boom" });
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });
});
