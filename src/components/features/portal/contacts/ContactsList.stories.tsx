import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "storybook/test";
import type { Contact, TeamMember } from "@/lib/api";
import { ContactsList, type ContactsListFilters } from "./ContactsList";

const members: TeamMember[] = [
  {
    email: "owner@example.com",
    role: "owner",
    joinedAt: "2026-01-01",
    emailNotifications: true,
    firstName: "Olivia",
    lastName: "Owner",
  },
  {
    email: "sales@example.com",
    role: "member",
    joinedAt: "2026-01-01",
    emailNotifications: false,
    firstName: "Sam",
    lastName: "Sales",
  },
];

function contact(overrides: Partial<Contact>): Contact {
  return {
    clientId: "c1",
    contactId: "id",
    displayName: "Contact",
    emails: [],
    phones: [],
    tags: [],
    ownerEmail: null,
    source: "manual",
    notes: [],
    createdBy: "owner@example.com",
    createdAt: "2026-01-04T14:00:00.000Z",
    updatedAt: "2026-01-04T14:00:00.000Z",
    searchText: "",
    leadCount: 0,
    ...overrides,
  };
}

const contacts: Contact[] = [
  contact({
    contactId: "1",
    displayName: "Ada Lovelace",
    firstName: "Ada",
    lastName: "Lovelace",
    company: "Analytical Engines",
    jobTitle: "Founder",
    emails: ["ada@example.com"],
    phones: ["+15551234567"],
    tags: ["vip"],
    ownerEmail: "sales@example.com",
    leadCount: 3,
    source: "form",
  }),
  contact({
    contactId: "2",
    displayName: "Brian Kernighan",
    firstName: "Brian",
    lastName: "Kernighan",
    emails: ["brian@example.com"],
    leadCount: 1,
  }),
  contact({
    contactId: "3",
    displayName: "Carol Danvers",
    firstName: "Carol",
    lastName: "Danvers",
    company: "Alpha Flight",
    phones: ["+15559876543"],
    tags: ["repeat", "referral"],
  }),
  contact({
    contactId: "4",
    displayName: "42 Holdings",
    company: "42 Holdings",
    emails: ["ap@42holdings.example"],
  }),
];

const filters: ContactsListFilters = {
  q: "",
  sort: "name",
  ownerEmail: "",
  tag: "",
};

const meta = {
  title: "Features/Portal/Contacts/ContactsList",
  component: ContactsList,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-4xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    contacts,
    total: contacts.length,
    members,
    tags: ["vip", "repeat", "referral"],
    filters,
    onFiltersChange: fn(),
    onApply: fn(),
    onSelect: fn(),
    onNew: fn(),
    onLoadMore: fn(),
    onSearchOrg: fn(),
    onClearOrgSearch: fn(),
  },
} satisfies Meta<typeof ContactsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.filters);
    return (
      <ContactsList
        {...args}
        filters={value}
        onFiltersChange={(next) => {
          setValue(next);
          args.onFiltersChange(next);
        }}
      />
    );
  },
};

export const SortedByActivity: Story = {
  ...Default,
  args: { filters: { ...filters, sort: "recent" } },
};

export const WithOrgSearch: Story = {
  ...Default,
  args: {
    canSearchOrg: true,
    filters: { ...filters, q: "ada" },
    orgMatches: [
      {
        contact: contacts[0],
        projectId: "p2",
        projectName: "North Side Landscaping",
      },
    ],
  },
};

export const OrgSearchEmpty: Story = {
  ...Default,
  args: { canSearchOrg: true, filters: { ...filters, q: "zzz" }, orgMatches: [] },
};

export const Paginated: Story = { ...Default, args: { hasMore: true, total: 240 } };

export const Loading: Story = { ...Default, args: { loading: true, contacts: [] } };

export const Empty: Story = { ...Default, args: { contacts: [], total: 0 } };

export const FilteredEmpty: Story = {
  ...Default,
  args: { contacts: [], total: 0, filters: { ...filters, q: "nobody" } },
};

export const LoadFailed: Story = {
  ...Default,
  args: { error: "Failed to load contacts" },
};
