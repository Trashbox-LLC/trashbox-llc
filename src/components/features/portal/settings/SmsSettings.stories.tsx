import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import type { AvailableSmsNumber, SmsOptOutEntry } from "@/lib/api";
import { SmsSettings } from "./SmsSettings";

const availableNumbers: AvailableSmsNumber[] = [
  {
    phoneNumber: "+18005550100",
    phoneNumberDisplay: "(800) 555-0100",
    numberType: "toll-free",
    twoWayEnabled: true,
    active: true,
  },
  {
    phoneNumber: "+18005550111",
    phoneNumberDisplay: "(800) 555-0111",
    numberType: "toll-free",
    twoWayEnabled: true,
    active: true,
  },
];

const optOuts: SmsOptOutEntry[] = [
  {
    phoneNumber: "+14255550182",
    phoneNumberDisplay: "(425) 555-0182",
    optedOutAt: "2026-09-01T12:00:00.000Z",
    keyword: "STOP",
  },
];

const meta = {
  title: "Features/Portal/Settings/SmsSettings",
  component: SmsSettings,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-background max-w-3xl p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    sms: {
      enabled: true,
      availableOnPlan: true,
      canManage: true,
      phoneNumber: "+18005550100",
      phoneNumberDisplay: "(800) 555-0100",
      numberType: "toll-free",
      registrationStatus: "verified",
      twoWayEnabled: true,
      status: "active",
      smsUsed: 42,
      smsLimit: 250,
    },
    availableNumbers: [],
    optOuts,
    onAssign: fn().mockResolvedValue(undefined),
    onUpdate: fn().mockResolvedValue(undefined),
    onRelease: fn().mockResolvedValue(undefined),
  },
} satisfies Meta<typeof SmsSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Verified: Story = {};

export const AwaitingCarrierVerification: Story = {
  args: {
    sms: {
      enabled: false,
      availableOnPlan: true,
      canManage: true,
      phoneNumber: "+18005550100",
      phoneNumberDisplay: "(800) 555-0100",
      numberType: "toll-free",
      registrationStatus: "pending",
      twoWayEnabled: false,
      status: "active",
      smsUsed: 0,
      smsLimit: 250,
    },
    optOuts: [],
  },
};

export const NoNumberYet: Story = {
  args: {
    sms: { enabled: false, availableOnPlan: true, canManage: true },
    availableNumbers,
    optOuts: [],
  },
};

export const PoolEmpty: Story = {
  args: {
    sms: { enabled: false, availableOnPlan: true, canManage: true },
    availableNumbers: [],
    optOuts: [],
  },
};

export const NotOnPlan: Story = {
  args: {
    sms: { enabled: false, availableOnPlan: false, canManage: true },
    optOuts: [],
  },
};

export const ReadOnlyMember: Story = {
  args: {
    sms: {
      enabled: true,
      availableOnPlan: true,
      canManage: false,
      phoneNumber: "+18005550100",
      phoneNumberDisplay: "(800) 555-0100",
      numberType: "toll-free",
      registrationStatus: "verified",
      twoWayEnabled: true,
      status: "active",
    },
  },
};
