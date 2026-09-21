import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "storybook/test";
import { Select, type SelectOption } from "./Select";

const statusOptions: SelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New", indicatorClassName: "bg-primary" },
  { value: "contacted", label: "Contacted", indicatorClassName: "bg-[#7EB6D4]" },
  { value: "qualified", label: "Qualified", indicatorClassName: "bg-[#8FCB8F]" },
  { value: "won", label: "Won", indicatorClassName: "bg-[#D4B87E]" },
  { value: "lost", label: "Lost", indicatorClassName: "bg-error" },
];

const meta = {
  title: "Atoms/Select",
  component: Select,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-xs bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    "aria-label": "Status",
    options: statusOptions,
    value: "new",
    onChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <Select
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
};

export const WithIndicators: Story = {
  ...Default,
  args: {
    value: "qualified",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "contacted",
  },
};

export const EmptyValue: Story = {
  ...Default,
  args: {
    value: "",
  },
};

export const Soft: Story = {
  ...Default,
  args: {
    variant: "soft",
    value: "qualified",
  },
};

export const Field: Story = {
  ...Default,
  args: {
    variant: "field",
    value: "contacted",
  },
};
