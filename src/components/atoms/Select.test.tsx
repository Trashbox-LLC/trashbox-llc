import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

const options = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
];

describe("Select", () => {
  it("shows the selected label and calls onChange when an option is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <div>
        <label htmlFor="status">Status</label>
        <Select
          id="status"
          value="new"
          options={options}
          onChange={onChange}
        />
      </div>,
    );

    const trigger = screen.getByRole("button", { name: /status/i });
    expect(trigger).toHaveTextContent("New");

    await user.click(trigger);
    const listbox = screen.getByRole("listbox");
    await user.click(within(listbox).getByRole("option", { name: /contacted/i }));

    expect(onChange).toHaveBeenCalledWith("contacted");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape without changing the value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Select
        aria-label="Tag"
        value=""
        options={options}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /tag/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();

    render(
      <Select
        aria-label="Assignee"
        value=""
        options={options}
        onChange={vi.fn()}
        disabled
      />,
    );

    await user.click(screen.getByRole("button", { name: /assignee/i }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps status indicator glow visible (no overflow clip on trigger row)", async () => {
    const user = userEvent.setup();

    render(
      <Select
        aria-label="Status"
        value="new"
        options={[
          {
            value: "new",
            label: "New",
            indicatorClassName:
              "bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.65)]",
          },
          {
            value: "contacted",
            label: "Contacted",
            indicatorClassName:
              "bg-[#7EB6D4] shadow-[0_0_8px_2px_rgba(126,182,212,0.65)]",
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: /status/i });
    const triggerRow = trigger.querySelector("span.flex");
    expect(triggerRow).not.toBeNull();
    // truncate => overflow:hidden clips the status-dot glow on the left edge
    expect(triggerRow?.className).not.toMatch(/\btruncate\b/);
    expect(trigger.className).toMatch(/\bpl-/);

    await user.click(trigger);
    const option = screen.getByRole("option", { name: /contacted/i });
    expect(option.className).toMatch(/\bpl-/);
  });

  it("uses underline styling by default", () => {
    render(
      <Select
        aria-label="Status"
        value="new"
        options={options}
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: /status/i });
    expect(trigger.className).toMatch(/\bborder-b\b/);
    expect(trigger.className).toMatch(/\brounded-none\b/);
  });

  it("uses a full-width field trigger for the field variant", () => {
    render(
      <Select
        aria-label="Status"
        variant="field"
        value="new"
        options={options}
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: /status/i });
    expect(trigger.className).toMatch(/\brounded-md\b/);
    expect(trigger.className).toMatch(/\bw-full\b/);
    expect(trigger.className).not.toMatch(/\brounded-full\b/);
  });

  it("uses a soft pill trigger for the soft variant", () => {
    render(
      <Select
        aria-label="Status"
        variant="soft"
        value="new"
        options={options}
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: /status/i });
    expect(trigger.className).toMatch(/\brounded-full\b/);
    expect(trigger.className).not.toMatch(/\bborder-b\b/);
  });

  it("shows menuLabel in the list while keeping label on the trigger", async () => {
    const user = userEvent.setup();

    render(
      <Select
        aria-label="Assignee"
        variant="soft"
        value="owner@example.com"
        onChange={vi.fn()}
        options={[
          {
            value: "owner@example.com",
            label: "Olivia Owner",
            menuLabel: "Olivia Owner (owner@example.com)",
          },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: /assignee/i });
    expect(trigger).toHaveTextContent("Olivia Owner");
    expect(trigger).not.toHaveTextContent("owner@example.com");

    await user.click(trigger);
    expect(
      screen.getByRole("option", {
        name: /olivia owner \(owner@example\.com\)/i,
      }),
    ).toBeInTheDocument();
  });

  it("hides the dropdown icon when caret is off", () => {
    render(
      <Select
        aria-label="Status"
        value="contacted"
        options={options}
        onChange={vi.fn()}
        caret={false}
      />,
    );

    const trigger = screen.getByRole("button", { name: /status/i });
    expect(trigger).toHaveTextContent("Contacted");
    expect(trigger).not.toHaveTextContent("expand_more");
  });

  it("right-aligns the listbox when listboxAlign is end", async () => {
    const user = userEvent.setup();

    render(
      <Select
        aria-label="Assignee"
        variant="soft"
        listboxAlign="end"
        value=""
        options={options}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /assignee/i }));
    const listbox = screen.getByRole("listbox");
    expect(listbox.className).toMatch(/\bright-0\b/);
    expect(listbox.className).toMatch(/\bleft-auto\b/);
  });
});
