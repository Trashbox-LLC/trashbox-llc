import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StubAuthProvider } from "@/lib/auth";
import { StubPortalProvider } from "@/lib/portal";
import { PortalRouteOutlet } from "./PortalRouteOutlet";

const usePathname = vi.fn(() => "/portal/login/");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

function renderOutlet(children = <p>Page slot</p>) {
  return render(
    <StubAuthProvider
      value={{
        status: "signedIn",
        configured: true,
        email: "owner@example.com",
      }}
    >
      <StubPortalProvider value={{ ready: true }}>
        <PortalRouteOutlet>{children}</PortalRouteOutlet>
      </StubPortalProvider>
    </StubAuthProvider>,
  );
}

describe("PortalRouteOutlet", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/portal/login/");
  });

  it("renders the org picker from the Next.js path on first paint", () => {
    usePathname.mockReturnValue("/portal/orgs/");
    renderOutlet();

    expect(
      screen.getByRole("heading", { name: /choose an organization/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Page slot")).not.toBeInTheDocument();
  });

  it("renders children on auth routes that are not workspace URLs", () => {
    renderOutlet();

    expect(screen.getByText("Page slot")).toBeInTheDocument();
  });
});
