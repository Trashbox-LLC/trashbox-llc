import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortalProvider } from "@/lib/portal";
import { SettingsSectionContent } from "./SettingsSectionContent";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getAccount: vi.fn(),
    getMailbox: vi.fn().mockResolvedValue({ connected: false }),
    getTeam: vi.fn().mockResolvedValue({
      clientId: "c1",
      clientName: "Acme",
      role: "owner",
      permissions: [
        "manage_sender_display_names",
        "allow_all_sender_display_names",
        "manage_team_members",
        "manage_roles_and_permissions",
        "manage_api_keys",
      ],
      roles: [
        {
          id: "admin",
          name: "Admin",
          system: true,
          permissions: [
            "manage_sender_display_names",
            "allow_all_sender_display_names",
            "manage_team_members",
            "manage_roles_and_permissions",
            "manage_api_keys",
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "member",
          name: "Member",
          system: true,
          permissions: [],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      members: [
        {
          email: "owner@example.com",
          role: "owner",
          joinedAt: "2026-01-01T00:00:00.000Z",
          emailNotifications: true,
        },
      ],
      invites: [],
      memberLimit: 5,
      memberCount: 1,
    }),
    listProjectTags: vi.fn().mockResolvedValue({ tags: ["vip", "follow up"] }),
    listSubmissions: vi.fn().mockResolvedValue({
      clientId: "c1",
      clientName: "Acme",
      items: [],
    }),
    listLeadMessages: vi
      .fn()
      .mockResolvedValue({ submissionId: "", items: [] }),
    listEmailTemplates: vi
      .fn()
      .mockResolvedValue({ items: [], canManage: true }),
    listEmailSignatures: vi
      .fn()
      .mockResolvedValue({ items: [], canManage: true }),
    listEmailSnippets: vi
      .fn()
      .mockResolvedValue({ items: [], canManage: true }),
  };
});

vi.mock("@/components/atoms/FadeIn", () => ({
  FadeIn: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { useAuth } from "@/lib/auth";
import { getAccount } from "@/lib/api";

describe("SettingsSectionContent", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      configured: true,
      status: "signedIn",
      email: "owner@example.com",
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      confirmSignUpCode: vi.fn(),
      resendCode: vi.fn(),
      signOutUser: vi.fn(),
    } as ReturnType<typeof useAuth>);

    vi.mocked(getAccount).mockResolvedValue({
      linked: true,
      email: "owner@example.com",
      clientName: "Acme",
      tier: "team",
      active: true,
      hasBilling: true,
      hasApiKey: true,
      role: "owner",
      submissionsUsed: 25,
      submissionLimit: 5000,
    });
  });

  it("renders account summary in the general section", async () => {
    render(
      <PortalProvider>
        <SettingsSectionContent sectionId="general" />
      </PortalProvider>,
    );

    expect(await screen.findByText(/^signed in$/i)).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Client: Acme/i)).toBeInTheDocument();
    expect(screen.getByText("team")).toBeInTheDocument();
  });

  it("renders api keys management in the api-keys section", async () => {
    render(
      <PortalProvider>
        <SettingsSectionContent sectionId="api-keys" />
      </PortalProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: /key active|no key issued/i }),
    ).toBeInTheDocument();
  });

  it("renders Sending Preferences in the sending-preferences section", async () => {
    render(
      <PortalProvider>
        <SettingsSectionContent sectionId="sending-preferences" />
      </PortalProvider>,
    );

    expect(
      await screen.findByText(/Create the Sender Display Names/i),
    ).toBeInTheDocument();
  });

  it.each([["snippets", /^snippets$/i]] as const)(
    "renders the %s section",
    async (sectionId, heading) => {
      render(
        <PortalProvider>
          <SettingsSectionContent sectionId={sectionId} />
        </PortalProvider>,
      );

      expect(await screen.findByText(heading)).toBeInTheDocument();
    },
  );

  it("renders the signatures section", async () => {
    render(
      <PortalProvider>
        <SettingsSectionContent sectionId="signatures" />
      </PortalProvider>,
    );

    expect(
      await screen.findByRole("link", { name: /new signature/i }),
    ).toBeInTheDocument();
  });

  it("renders the template gallery instead of the template instructions", async () => {
    render(
      <PortalProvider>
        <SettingsSectionContent sectionId="templates" />
      </PortalProvider>,
    );

    expect(
      await screen.findByRole("searchbox", { name: /search layouts/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/merge fields/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^close$/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the project tags", async () => {
    render(
      <PortalProvider>
        <SettingsSectionContent sectionId="tags" />
      </PortalProvider>,
    );

    expect(
      await screen.findByRole("button", { name: /remove vip/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove follow up/i }),
    ).toBeInTheDocument();
  });

  it("renders placeholders for unfinished project sections", async () => {
    render(
      <PortalProvider>
        <SettingsSectionContent sectionId="branding" />
      </PortalProvider>,
    );

    expect(
      await screen.findByText(/branding settings are coming soon/i),
    ).toBeInTheDocument();
  });
});
