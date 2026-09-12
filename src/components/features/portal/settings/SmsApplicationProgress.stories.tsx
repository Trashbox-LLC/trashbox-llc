import type { Meta, StoryObj } from "@storybook/react";
import type { SmsApplication } from "@/lib/api";
import { SmsApplicationProgress } from "./SmsApplicationProgress";

const application: SmsApplication = {
  status: "pending_review",
  business: {
    companyName: "Austin Dumpsters LLC",
    companyWebsite: "https://austindumpsters.com",
    taxId: "12-3456789",
    addressLine1: "100 Main St",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    contactName: "Jane Doe",
    contactEmail: "jane@austindumpsters.com",
    contactPhone: "+15125550134",
    useCaseCategory: "Customer Care",
    useCaseDescription: "Quote replies.",
    optInType: "digital-form",
    optInDescription: "Checkbox on the quote form.",
    sampleMessages: ["We can deliver Thursday."],
    monthlyMessageVolume: "1,000",
  },
  submittedAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
  carrierAttempts: 0,
  canResubmit: false,
};

const meta = {
  title: "Features/Portal/Settings/SmsApplicationProgress",
  component: SmsApplicationProgress,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-background max-w-3xl p-8">
        <Story />
      </div>
    ),
  ],
  args: { application },
} satisfies Meta<typeof SmsApplicationProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InReview: Story = {};

export const WithNetworks: Story = {
  args: {
    application: { ...application, status: "submitted", carrierAttempts: 1 },
  },
};

export const Live: Story = {
  args: {
    application: { ...application, status: "approved", carrierAttempts: 1 },
  },
};

export const NeedsChanges: Story = {
  args: {
    application: {
      ...application,
      status: "changes_requested",
      carrierAttempts: 1,
    },
  },
};
