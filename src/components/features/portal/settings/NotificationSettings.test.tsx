import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  NOTIFICATION_EVENTS,
  type NotificationSettings as NotificationSettingsMap,
} from "@/lib/api";
import { NotificationSettings } from "./NotificationSettings";

function allOff(): NotificationSettingsMap {
  return Object.fromEntries(
    NOTIFICATION_EVENTS.map((event) => [event, { push: false, email: false }]),
  ) as NotificationSettingsMap;
}

function setup(
  props: Partial<React.ComponentProps<typeof NotificationSettings>> = {},
) {
  const onToggle = vi.fn();
  render(
    <NotificationSettings settings={allOff()} onToggle={onToggle} {...props} />,
  );
  return onToggle;
}

describe("NotificationSettings", () => {
  it("offers a push and email toggle for every event", () => {
    setup();
    expect(screen.getAllByRole("checkbox")).toHaveLength(
      NOTIFICATION_EVENTS.length * 2,
    );
  });

  it("reports which event and channel was turned on", async () => {
    const onToggle = setup();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "New lead arrives push" }),
    );
    expect(onToggle).toHaveBeenCalledWith("lead_created", "push", true);
  });

  it("reports turning a channel back off", async () => {
    const settings = allOff();
    settings.lead_created.email = true;
    const onToggle = setup({ settings });
    await userEvent.click(
      screen.getByRole("checkbox", { name: "New lead arrives email" }),
    );
    expect(onToggle).toHaveBeenCalledWith("lead_created", "email", false);
  });

  it("reflects the stored state of each toggle", () => {
    const settings = allOff();
    settings.sms_inbound.push = true;
    setup({ settings });
    expect(
      screen.getByRole("checkbox", { name: "Inbound text push" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Inbound text email" }),
    ).not.toBeChecked();
  });

  it("locks push when no device has registered", () => {
    setup({ pushUnavailable: true });
    expect(
      screen.getByRole("checkbox", { name: "New lead arrives push" }),
    ).toBeDisabled();
  });

  it("leaves email editable when push is unavailable", () => {
    setup({ pushUnavailable: true });
    expect(
      screen.getByRole("checkbox", { name: "New lead arrives email" }),
    ).toBeEnabled();
  });

  it("locks everything while a save is in flight", () => {
    setup({ busy: true });
    for (const box of screen.getAllByRole("checkbox")) {
      expect(box).toBeDisabled();
    }
  });

  it("shows nothing to toggle while loading", () => {
    setup({ loading: true });
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("surfaces a save error", () => {
    setup({ error: "Boom" });
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });
});
