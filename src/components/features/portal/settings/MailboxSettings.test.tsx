import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MailboxSettings } from "./MailboxSettings";

describe("MailboxSettings", () => {
  it("shows connect buttons when canManage and disconnected", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <MailboxSettings
        canManage
        mailbox={{ connected: false }}
        onConnect={onConnect}
        onDisconnect={vi.fn()}
        onSync={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /connect google workspace/i }),
    );
    expect(onConnect).toHaveBeenCalledWith("gmail");

    await user.click(
      screen.getByRole("button", { name: /connect microsoft 365/i }),
    );
    expect(onConnect).toHaveBeenCalledWith("microsoft");
  });

  it("hides connect without manage permission when disconnected", () => {
    render(
      <MailboxSettings
        canManage={false}
        mailbox={{ connected: false }}
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
        onSync={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /connect google workspace/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Manage Email Sender Display Names/i),
    ).toBeInTheDocument();
  });

  it("shows disconnect and sync when connected and canManage", async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn().mockResolvedValue(undefined);
    const onSync = vi.fn().mockResolvedValue(undefined);

    render(
      <MailboxSettings
        canManage
        mailbox={{
          connected: true,
          provider: "gmail",
          email: "sales@example.com",
          connectedBy: "owner@example.com",
          status: "connected",
          lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        }}
        onConnect={vi.fn()}
        onDisconnect={onDisconnect}
        onSync={onSync}
      />,
    );

    expect(screen.getByText("sales@example.com")).toBeInTheDocument();
    expect(screen.getByText(/synced 2 hours ago/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^sync$/i }));
    expect(onSync).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /disconnect/i }));
    expect(onDisconnect).toHaveBeenCalled();
  });

});
