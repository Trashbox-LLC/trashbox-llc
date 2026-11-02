import type { Meta, StoryObj } from "@storybook/react";
import { SiteHeader } from "./SiteHeader";

const meta = {
  title: "Features/Marketing/SiteHeader",
  component: SiteHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[280px] bg-background">
        <Story />
        <div className="px-8 pt-32 font-body text-on-surface-variant">
          Page content sits below the fixed header.
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OverHeroImage: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-[160vh] bg-[#050505]">
        <Story />
        <div className="px-8 pt-48">
          <div
            data-header-scrim-target
            className="mx-auto h-[40vh] max-w-4xl bg-white/15"
          />
        </div>
      </div>
    ),
  ],
};

export const ServicesMenuOpen: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-[420px] bg-[#050505]">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector(
      'button[aria-controls="services-menu"]',
    ) as HTMLButtonElement | null;
    button?.click();
  },
};

export const MobileMenuOpen: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector(
      'button[aria-label="Open menu"]',
    ) as HTMLButtonElement | null;
    button?.click();
  },
};
