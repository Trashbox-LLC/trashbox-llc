import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSelectedWorkspace } from "@/lib/portal-selection";
import { PortalHeader } from "./PortalHeader";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/portal/inbox/"),
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/portal", () => ({
  usePortal: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePortal } from "@/lib/portal";

function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: y,
  });
  window.dispatchEvent(new Event("scroll"));
}

describe("PortalHeader", () => {
  beforeEach(() => {
    setScrollY(0);
    localStorage.clear();
    sessionStorage.clear();
    setSelectedWorkspace("o1", "p1");
    vi.mocked(usePathname).mockReturnValue("/portal/inbox/");
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
    vi.mocked(usePortal).mockReturnValue({
      ready: true,
      clientName: "Marketing site",
      orgs: [
        {
          orgId: "o1",
          orgName: "Acme Co",
          orgSlug: "acme-co",
          role: "owner",
          tier: "free",
          active: true,
          hasBilling: false,
          projects: [
            {
              projectId: "p1",
              projectName: "Marketing site",
              projectSlug: "marketing-site",
            },
          ],
        },
      ],
      account: {
        linked: true,
        orgId: "o1",
        orgName: "Acme Co",
        orgSlug: "acme-co",
        projectId: "p1",
        projectName: "Marketing site",
        clientId: "p1",
        clientName: "Marketing site",
      },
      selectWorkspace: vi.fn(),
      members: [
        {
          email: "owner@example.com",
          role: "owner",
          joinedAt: "2024-01-01",
          firstName: "Ada",
          lastName: "Lovelace",
          emailNotifications: true,
        },
      ],
    } as ReturnType<typeof usePortal>);
  });

  it("is visible at the top of the page", () => {
    render(<PortalHeader />);
    const header = screen.getByRole("banner");
    expect(header.className).not.toMatch(/-translate-y-full/);
  });

  it("hides when scrolling down and reappears when scrolling up", () => {
    render(<PortalHeader />);
    const header = screen.getByRole("banner");

    act(() => {
      setScrollY(80);
    });
    expect(header.className).toMatch(/-translate-y-full/);

    act(() => {
      setScrollY(40);
    });
    expect(header.className).not.toMatch(/-translate-y-full/);
  });

  it("stays visible while the mobile menu is open", async () => {
    const user = userEvent.setup();
    render(<PortalHeader />);
    const header = screen.getByRole("banner");

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    act(() => {
      setScrollY(120);
    });
    expect(header.className).not.toMatch(/-translate-y-full/);
  });

  it("shows workspace breadcrumb and product nav when an org is selected", () => {
    window.history.replaceState(
      {},
      "",
      "/portal/acme-co/marketing-site/inbox/",
    );
    render(<PortalHeader />);
    expect(
      screen.getByRole("navigation", { name: /workspace/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /^portal$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /organization: acme co/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /project: marketing site/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^inbox$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^forms$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^settings$/i }),
    ).toBeInTheDocument();
  });

  it("uses org dashboard nav without a project crumb on org home", () => {
    window.history.replaceState({}, "", "/portal/acme-co/");
    setSelectedWorkspace("o1", null);
    render(<PortalHeader />);

    expect(
      screen.getByRole("button", { name: /organization: acme co/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /project:/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^projects$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^members$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^settings$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^inbox$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^forms$/i }),
    ).not.toBeInTheDocument();
  });

  it("soft-navigates the logo to the org picker when signed in", async () => {
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, "pushState");
    render(<PortalHeader />);
    const logo = screen.getByRole("link", { name: /trashbox.*home/i });
    expect(logo.getAttribute("href")).toMatch(/\/portal\/orgs\/?$/);
    await user.click(logo);
    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      expect.stringMatching(/\/portal\/orgs\/?$/),
    );
  });

  it("uses a compact bar height", () => {
    render(<PortalHeader />);
    const bar = screen.getByRole("banner").querySelector(":scope > div > div");
    expect(bar?.className).toMatch(/\bpy-2\b/);
    expect(bar?.className).not.toMatch(/\bpy-5\b/);
    expect(bar?.className).not.toMatch(/\bmd:py-6\b/);
  });

  it("does not show a Platform link", () => {
    render(<PortalHeader />);
    expect(
      screen.queryByRole("link", { name: /^platform$/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/back to platform/i)).not.toBeInTheDocument();
  });

  it("shows an account menu instead of a bare Sign out button", async () => {
    const user = userEvent.setup();
    const signOutUser = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      configured: true,
      status: "signedIn",
      email: "owner@example.com",
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      confirmSignUpCode: vi.fn(),
      resendCode: vi.fn(),
      signOutUser,
    } as ReturnType<typeof useAuth>);

    render(<PortalHeader />);

    expect(
      screen.queryByRole("button", { name: /^sign out$/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /account menu/i }));
    const panel = screen.getByRole("menu");
    expect(within(panel).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(within(panel).getByText("owner@example.com")).toBeInTheDocument();
    expect(within(panel).queryByText("Acme Co")).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /sign out/i }));
    expect(signOutUser).toHaveBeenCalledTimes(1);
  });

  it("does not render workspace nav on login while auth is loading even with a stored org", () => {
    vi.mocked(usePathname).mockReturnValue("/portal/login/");
    vi.mocked(useAuth).mockReturnValue({
      configured: true,
      status: "loading",
      email: null,
      signInWithPassword: vi.fn(),
      signUpWithPassword: vi.fn(),
      confirmSignUpCode: vi.fn(),
      resendCode: vi.fn(),
      signOutUser: vi.fn(),
    } as ReturnType<typeof useAuth>);

    render(<PortalHeader />);

    expect(document.querySelector('nav[aria-label="Portal"]')).toBeNull();
  });
});
