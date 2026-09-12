import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SmsStatusResponse } from "@/lib/api";
import { SmsSettings } from "./SmsSettings";

const assigned: SmsStatusResponse = {
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
};

function setup(props: Partial<Parameters<typeof SmsSettings>[0]> = {}) {
  const onAssign = vi.fn().mockResolvedValue(undefined);
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onRelease = vi.fn().mockResolvedValue(undefined);
  render(
    <SmsSettings
      sms={assigned}
      availableNumbers={[]}
      optOuts={[]}
      onAssign={onAssign}
      onUpdate={onUpdate}
      onRelease={onRelease}
      {...props}
    />,
  );
  return { onAssign, onUpdate, onRelease, user: userEvent.setup() };
}

describe("SmsSettings", () => {
  it("assigns the number the user picked", async () => {
    const { onAssign, user } = setup({
      sms: { enabled: false, availableOnPlan: true, canManage: true },
      availableNumbers: [
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
      ],
    });

    await user.click(screen.getByRole("button", { name: /available number/i }));
    await user.click(screen.getByRole("option", { name: /\(800\) 555-0111/ }));
    await user.click(screen.getByRole("button", { name: /assign/i }));

    expect(onAssign).toHaveBeenCalledWith("+18005550111");
  });

  it("cannot assign when the pool has no free numbers", () => {
    setup({
      sms: { enabled: false, availableOnPlan: true, canManage: true },
      availableNumbers: [],
    });

    expect(screen.getByRole("button", { name: /assign/i })).toBeDisabled();
  });

  it("marks a pending number verified once the carrier approves", async () => {
    const { onUpdate, user } = setup({
      sms: { ...assigned, enabled: false, registrationStatus: "pending" },
    });

    await user.click(screen.getByRole("button", { name: /mark verified/i }));

    expect(onUpdate).toHaveBeenCalledWith({ registrationStatus: "verified" });
  });

  it("offers no verify action once the number is verified", () => {
    setup();

    expect(
      screen.queryByRole("button", { name: /mark verified/i }),
    ).not.toBeInTheDocument();
  });

  it("pauses sending without releasing the number", async () => {
    const { onUpdate, user } = setup();

    await user.click(screen.getByRole("button", { name: /^disable$/i }));

    expect(onUpdate).toHaveBeenCalledWith({ disabled: true });
  });

  it("resumes a disabled number", async () => {
    const { onUpdate, user } = setup({
      sms: { ...assigned, enabled: false, status: "disabled" },
    });

    await user.click(screen.getByRole("button", { name: /^enable$/i }));

    expect(onUpdate).toHaveBeenCalledWith({ disabled: false });
  });

  it("releases the number", async () => {
    const { onRelease, user } = setup();

    await user.click(screen.getByRole("button", { name: /release/i }));

    expect(onRelease).toHaveBeenCalled();
  });

  it("hides every action from members who cannot manage the number", () => {
    setup({ sms: { ...assigned, canManage: false } });

    expect(
      screen.queryByRole("button", { name: /release/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^disable$/i }),
    ).not.toBeInTheDocument();
  });

  it("points at billing instead of a number picker on plans without texting", () => {
    setup({
      sms: { enabled: false, availableOnPlan: false, canManage: true },
    });

    expect(
      screen.queryByRole("button", { name: /assign/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plan/i })).toBeInTheDocument();
  });

  it("lists the contacts who replied STOP", () => {
    setup({
      optOuts: [
        {
          phoneNumber: "+14255550182",
          phoneNumberDisplay: "(425) 555-0182",
          optedOutAt: "2026-09-01T12:00:00.000Z",
          keyword: "STOP",
        },
      ],
    });

    expect(screen.getByText("(425) 555-0182")).toBeInTheDocument();
  });
});
