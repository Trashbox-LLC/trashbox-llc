import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
}));

vi.mock("./amplify", () => ({
  apiUrl: "https://api.trashbox.io",
}));

import { fetchAuthSession } from "aws-amplify/auth";
import {
  acceptTeamInvite,
  addSubmissionNote,
  deleteSubmissionNote,
  assigneeIdentity,
  teamMemberWithAccountName,
  createApiKey,
  createTeamInvite,
  createTeamRole,
  deleteApiKey,
  deleteTeamRole,
  getAccount,
  getTeam,
  getTeamRoles,
  hasPermission,
  listSubmissions,
  PERMISSIONS,
  PERMISSION_LABELS,
  updateSubmission,
  updateTeamRole,
} from "./api";

function sessionWithEmailToken() {
  const payload = btoa(JSON.stringify({ email: "owner@example.com" }));
  return {
    tokens: {
      idToken: {
        toString: () => `header.${payload}.sig`,
      },
    },
  };
}

describe("api key management", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthSession).mockResolvedValue(
      sessionWithEmailToken() as Awaited<ReturnType<typeof fetchAuthSession>>,
    );
  });

  it("createApiKey POSTs /account/api-key and returns the issued key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          apiKey: "fapi_new_key",
          hasApiKey: true,
          message: "Save this API key now — it will not be shown again.",
        }),
      }),
    );

    const result = await createApiKey();

    expect(result.apiKey).toBe("fapi_new_key");
    expect(result.hasApiKey).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/account/api-key",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("deleteApiKey DELETEs /account/api-key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          hasApiKey: false,
          message: "API key deleted",
        }),
      }),
    );

    const result = await deleteApiKey();

    expect(result.hasApiKey).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/account/api-key",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("getAccount includes hasApiKey when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          linked: true,
          email: "owner@example.com",
          hasApiKey: true,
          tier: "free",
          active: true,
          role: "owner",
        }),
      }),
    );

    const account = await getAccount();

    expect(account.hasApiKey).toBe(true);
    expect(account.role).toBe("owner");
  });
});

describe("CRM submissions API", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthSession).mockResolvedValue(
      sessionWithEmailToken() as Awaited<ReturnType<typeof fetchAuthSession>>,
    );
  });

  it("listSubmissions passes status, tag, q, and assignedTo filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          clientId: "c1",
          clientName: "Acme",
          items: [],
        }),
      }),
    );

    await listSubmissions({
      status: "contacted",
      tag: "sales",
      assignedTo: "sarah@example.com",
      q: "estimate",
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.trashbox.io/submissions?"),
      expect.any(Object),
    );
    const url = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(url).toContain("status=contacted");
    expect(url).toContain("tag=sales");
    expect(url).toContain("assignedTo=sarah%40example.com");
    expect(url).toContain("q=estimate");
  });

  it("updateSubmission PATCHes status and tags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          submissionId: "s1",
          status: "qualified",
          tags: ["vip"],
        }),
      }),
    );

    const result = await updateSubmission("s1", {
      status: "qualified",
      tags: ["vip"],
    });

    expect(result.status).toBe("qualified");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/submissions/s1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "qualified", tags: ["vip"] }),
      }),
    );
  });

  it("addSubmissionNote POSTs note body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          submissionId: "s1",
          notes: [
            {
              id: "n1",
              body: "Called customer July 15, requested estimate",
              authorEmail: "owner@example.com",
              createdAt: "2026-07-15T12:00:00.000Z",
            },
          ],
        }),
      }),
    );

    const result = await addSubmissionNote(
      "s1",
      "Called customer July 15, requested estimate",
    );

    expect(result.notes?.[0]?.body).toContain("requested estimate");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/submissions/s1/notes",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("deleteSubmissionNote DELETEs the note", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          clientId: "c1",
          submissionId: "s1",
          notes: [],
        }),
      }),
    );

    const result = await deleteSubmissionNote("s1", "n1");

    expect(result.notes).toEqual([]);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/submissions/s1/notes/n1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("permissions helpers", () => {
  it("hasPermission checks the caller's permission list", () => {
    expect(
      hasPermission(["manage_api_keys"], "manage_api_keys"),
    ).toBe(true);
    expect(
      hasPermission(["manage_api_keys"], "manage_team_members"),
    ).toBe(false);
    expect(hasPermission(undefined, "manage_api_keys")).toBe(false);
  });

  it("PERMISSION_LABELS are Title Case", () => {
    expect(PERMISSION_LABELS.manage_team_members).toBe("Manage Team Members");
    expect(PERMISSION_LABELS.manage_roles_and_permissions).toBe(
      "Manage Roles And Permissions",
    );
  });

  it("includes delete_contacts from the Form API", () => {
    expect(PERMISSIONS).toContain("delete_contacts");
    expect(PERMISSION_LABELS.delete_contacts).toBe("Delete Contacts");
  });
});

describe("team API", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthSession).mockResolvedValue(
      sessionWithEmailToken() as Awaited<ReturnType<typeof fetchAuthSession>>,
    );
  });

  it("getTeam fetches roster", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          clientId: "c1",
          clientName: "Acme",
          role: "owner",
          permissions: ["manage_api_keys", "manage_team_members"],
          roles: [
            {
              id: "admin",
              name: "Admin",
              system: true,
              permissions: ["manage_api_keys"],
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
            },
          ],
          members: [
            {
              email: "owner@example.com",
              role: "owner",
              joinedAt: "2026-01-01",
              emailNotifications: true,
            },
          ],
          invites: [],
          memberLimit: 5,
          memberCount: 1,
        }),
      }),
    );

    const team = await getTeam();
    expect(team.role).toBe("owner");
    expect(team.memberLimit).toBe(5);
    expect(team.permissions).toContain("manage_api_keys");
    expect(team.roles).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/team",
      expect.any(Object),
    );
  });

  it("getTeamRoles fetches role catalog", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          roles: [
            {
              id: "member",
              name: "Member",
              system: true,
              permissions: [],
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
            },
          ],
          permissions: ["manage_roles_and_permissions"],
        }),
      }),
    );

    const result = await getTeamRoles();
    expect(result.roles[0]?.id).toBe("member");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/team/roles",
      expect.any(Object),
    );
  });

  it("createTeamRole POSTs name and permissions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          role: {
            id: "r1",
            name: "Support",
            system: false,
            permissions: ["manage_team_members"],
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        }),
      }),
    );

    await createTeamRole({
      name: "Support",
      permissions: ["manage_team_members"],
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/team/roles",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Support",
          permissions: ["manage_team_members"],
        }),
      }),
    );
  });

  it("updateTeamRole PATCHes role", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          role: {
            id: "r1",
            name: "Support Lead",
            system: false,
            permissions: [],
            createdAt: "2026-01-01",
            updatedAt: "2026-01-02",
          },
        }),
      }),
    );

    await updateTeamRole("r1", { name: "Support Lead", permissions: [] });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/team/roles/r1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Support Lead", permissions: [] }),
      }),
    );
  });

  it("deleteTeamRole DELETEs role", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );

    await deleteTeamRole("r1");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/team/roles/r1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("createTeamInvite POSTs email and options", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          invite: {
            email: "teammate@example.com",
            role: "member",
            roleId: "member",
            invitedBy: "owner@example.com",
            createdAt: "2026-07-16",
            expiresAt: "2026-07-23",
            emailNotifications: true,
            name: "Teammate",
          },
        }),
      }),
    );

    await createTeamInvite({
      email: "teammate@example.com",
      name: "Teammate",
      emailNotifications: true,
      roleId: "member",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/team/invites",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "teammate@example.com",
          name: "Teammate",
          emailNotifications: true,
          roleId: "member",
        }),
      }),
    );
  });

  it("updateTeamMember PATCHes member prefs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          member: {
            email: "teammate@example.com",
            role: "admin",
            roleId: "admin",
            joinedAt: "2026-01-01",
            emailNotifications: false,
            name: "Teammate",
          },
        }),
      }),
    );

    const { updateTeamMember } = await import("./api");
    await updateTeamMember("teammate@example.com", {
      roleId: "admin",
      emailNotifications: false,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/team/members/teammate%40example.com",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          roleId: "admin",
          emailNotifications: false,
        }),
      }),
    );
  });

  it("acceptTeamInvite POSTs token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, clientId: "c1" }),
      }),
    );

    const result = await acceptTeamInvite("abc123");
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.trashbox.io/team/accept",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "abc123" }),
      }),
    );
  });
});

describe("assigneeIdentity", () => {
  const members = [
    {
      email: "owner@example.com",
      firstName: "Ezekiel",
      lastName: "Mohr",
    },
    { email: "nameless@example.com" },
  ];

  it("pairs a member name with their email", () => {
    expect(assigneeIdentity("owner@example.com", members)).toEqual({
      name: "Ezekiel Mohr",
      email: "owner@example.com",
    });
  });

  it("returns the email once when the member has no name", () => {
    expect(assigneeIdentity("nameless@example.com", members)).toEqual({
      name: "nameless@example.com",
      email: null,
    });
  });

  it("fills a missing membership name from the signed-in profile", () => {
    const [member] = members;
    expect(
      teamMemberWithAccountName(
        { ...member, firstName: undefined, lastName: undefined },
        {
          email: "owner@example.com",
          firstName: "Ezekiel",
          lastName: "Mohr",
        },
      ),
    ).toMatchObject({ firstName: "Ezekiel", lastName: "Mohr" });
  });
});
