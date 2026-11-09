import type { Meta, StoryObj } from "@storybook/react";
import { DEFAULT_HOME_DEV_SETTINGS } from "./home-dev-settings";
import { HomeDevSettings } from "./HomeDevSettings";

const meta = {
  title: "Features/Marketing/HomeDevSettings",
  component: HomeDevSettings,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    value: DEFAULT_HOME_DEV_SETTINGS,
    onChange: () => {},
  },
} satisfies Meta<typeof HomeDevSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PublishedWhite: Story = {
  args: {
    value: {
      ...DEFAULT_HOME_DEV_SETTINGS,
      coverId: "night",
      headline: "solid",
      layout: "published",
      kicker: {
        ...DEFAULT_HOME_DEV_SETTINGS.kicker,
        size: "lg",
        weight: "bold",
        color: "white",
      },
    },
  },
};
