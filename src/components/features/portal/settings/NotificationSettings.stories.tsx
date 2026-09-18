import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "storybook/test";
import {
  NOTIFICATION_EVENTS,
  type NotificationSettings as NotificationSettingsMap,
} from "@/lib/api";
import { NotificationSettings } from "./NotificationSettings";

function settingsWith(
  overrides: Partial<NotificationSettingsMap> = {},
): NotificationSettingsMap {
  const base = Object.fromEntries(
    NOTIFICATION_EVENTS.map((event) => [event, { push: false, email: false }]),
  ) as NotificationSettingsMap;
  return { ...base, ...overrides };
}

const defaults = settingsWith({
  lead_created: { push: true, email: true },
  sms_inbound: { push: true, email: false },
  lead_assigned: { push: true, email: true },
});

const meta = {
  title: "Features/Portal/Settings/NotificationSettings",
  component: NotificationSettings,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: { settings: defaults, onToggle: fn() },
} satisfies Meta<typeof NotificationSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const [settings, setSettings] = useState(args.settings);
    return (
      <NotificationSettings
        {...args}
        settings={settings}
        onToggle={(event, channel, enabled) => {
          setSettings((prev) => ({
            ...prev,
            [event]: { ...prev[event], [channel]: enabled },
          }));
          args.onToggle(event, channel, enabled);
        }}
      />
    );
  },
};

export const EverythingOn: Story = {
  ...Default,
  args: {
    settings: Object.fromEntries(
      NOTIFICATION_EVENTS.map((event) => [event, { push: true, email: true }]),
    ) as NotificationSettingsMap,
  },
};

export const NoMobileDevice: Story = {
  ...Default,
  args: { pushUnavailable: true },
};

export const Saving: Story = { ...Default, args: { busy: true } };

export const Loading: Story = { ...Default, args: { loading: true } };

export const LoadFailed: Story = {
  ...Default,
  args: { error: "Failed to load notification settings" },
};
