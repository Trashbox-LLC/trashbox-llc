import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LeadSmsComposer } from "./LeadSmsComposer";

function setup(props: Partial<Parameters<typeof LeadSmsComposer>[0]> = {}) {
  const onSend = props.onSend ?? vi.fn().mockResolvedValue(undefined);
  render(
    <LeadSmsComposer
      toPhone="+14255550182"
      fromPhone="+18005550100"
      {...props}
      onSend={onSend}
    />,
  );
  return { onSend, user: userEvent.setup() };
}

describe("LeadSmsComposer", () => {
  it("cannot send an empty message", () => {
    setup();

    expect(screen.getByRole("button", { name: /send text/i })).toBeDisabled();
  });

  it("cannot send whitespace", async () => {
    const { user } = setup();

    await user.type(screen.getByRole("textbox", { name: /text message/i }), "  ");

    expect(screen.getByRole("button", { name: /send text/i })).toBeDisabled();
  });

  it("sends the trimmed body", async () => {
    const { onSend, user } = setup();

    await user.type(
      screen.getByRole("textbox", { name: /text message/i }),
      "  On my way  ",
    );
    await user.click(screen.getByRole("button", { name: /send text/i }));

    expect(onSend).toHaveBeenCalledWith("On my way");
  });

  it("clears the draft once the send succeeds", async () => {
    const { user } = setup();
    const input = screen.getByRole("textbox", { name: /text message/i });

    await user.type(input, "On my way");
    await user.click(screen.getByRole("button", { name: /send text/i }));

    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("keeps the draft when the send fails", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("nope"));
    const { user } = setup({ onSend });
    const input = screen.getByRole("textbox", { name: /text message/i });

    await user.type(input, "On my way");
    await user.click(screen.getByRole("button", { name: /send text/i }));

    await waitFor(() => expect(onSend).toHaveBeenCalled());
    expect(input).toHaveValue("On my way");
  });

  it("sends on Cmd + Enter", async () => {
    const { onSend, user } = setup();

    await user.type(screen.getByRole("textbox", { name: /text message/i }), "Hi");
    await user.keyboard("{Meta>}{Enter}{/Meta}");

    expect(onSend).toHaveBeenCalledWith("Hi");
  });

  it("reports the billable segment count as the body grows", async () => {
    const { user } = setup();
    const input = screen.getByRole("textbox", { name: /text message/i });

    await user.click(input);
    await user.paste("Hi");
    expect(screen.getByText(/1 segment/i)).toBeInTheDocument();

    await user.clear(input);
    await user.click(input);
    await user.paste("a".repeat(161));
    expect(screen.getByText(/2 segments/i)).toBeInTheDocument();
  });

  it("blocks sending while another send is in flight", () => {
    setup({ busy: true });

    expect(screen.getByRole("button", { name: /send text/i })).toBeDisabled();
  });
});
