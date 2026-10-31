import type { Meta, StoryObj } from "@storybook/react";
import { SplashScreen } from "./SplashScreen";

const meta = {
  title: "Features/Marketing/SplashScreen",
  component: SplashScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    persist: true,
  },
} satisfies Meta<typeof SplashScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fill: Story = {};
