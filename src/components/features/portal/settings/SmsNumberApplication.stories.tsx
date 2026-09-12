import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import type { SmsApplicationBusiness } from "@/lib/api";
import { SmsNumberApplication } from "./SmsNumberApplication";

const business: SmsApplicationBusiness = {
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
  useCaseDescription:
    "Replying to quote requests submitted through our website contact form.",
  optInType: "digital-form",
  optInDescription:
    "Customers check a box agreeing to text replies on our quote form.",
  sampleMessages: ["We can deliver Thursday. Reply STOP to opt out."],
  monthlyMessageVolume: "1,000",
};

const meta = {
  title: "Features/Portal/Settings/SmsNumberApplication",
  component: SmsNumberApplication,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-background max-w-5xl p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    application: null,
    availableOnPlan: true,
    canManage: true,
    onApply: fn().mockResolvedValue(undefined),
    onWithdraw: fn().mockResolvedValue(undefined),
  },
} satisfies Meta<typeof SmsNumberApplication>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offer: Story = {};

export const ApplyForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /get a number/i }));
    await expect(
      canvas.getByLabelText(/legal business name/i),
    ).toBeInTheDocument();
  },
};

export const InReview: Story = {
  args: {
    application: {
      status: "pending_review",
      business,
      submittedAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-01T12:00:00.000Z",
      carrierAttempts: 0,
      canResubmit: false,
    },
  },
};

export const WithCarriers: Story = {
  args: {
    application: {
      status: "submitted",
      business,
      submittedAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-02T12:00:00.000Z",
      carrierAttempts: 1,
      canResubmit: false,
    },
  },
};

export const Active: Story = {
  args: {
    application: {
      status: "approved",
      business,
      submittedAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-05T12:00:00.000Z",
      carrierAttempts: 1,
      canResubmit: false,
      phoneNumber: "+18885550101",
      phoneNumberDisplay: "(888) 555-0101",
    },
  },
};

export const NeedsChanges: Story = {
  args: {
    application: {
      status: "changes_requested",
      business,
      submittedAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-04T12:00:00.000Z",
      carrierAttempts: 1,
      canResubmit: true,
      statusReason:
        "The carriers asked for updates to the business details before they will approve this number.",
    },
  },
};

export const NoAttemptsLeft: Story = {
  args: {
    application: {
      status: "changes_requested",
      business,
      submittedAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-08T12:00:00.000Z",
      carrierAttempts: 2,
      canResubmit: false,
      statusReason:
        "The carriers did not approve this registration. No attempts remain, so the number was released.",
    },
  },
};

export const ServerRejectedFields: Story = {
  args: {
    fieldErrors: ["companyWebsite", "contactPhone"],
    error: "Some required business details are missing or invalid",
  },
};

export const NotOnPlan: Story = {
  args: { availableOnPlan: false },
};

export const ReadOnlyMember: Story = {
  args: { canManage: false },
};
