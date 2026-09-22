import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsShell } from "./SettingsShell";
import { EmailContentSettings } from "./EmailContentSettings";

const usePathname = vi.fn(() => "/portal/settings/general/");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("SettingsShell", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/portal/settings/general/");
  });

  it("shows settings chrome, sidebar, and section content", () => {
    render(
      <SettingsShell>
        <p>Section body</p>
      </SettingsShell>,
    );

    expect(
      screen.getByRole("heading", { name: /^settings$/i, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^general$/i, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Section body")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("falls back to the default section when pathname is null", () => {
    usePathname.mockReturnValue(null);

    expect(() =>
      render(
        <SettingsShell>
          <p>Section body</p>
        </SettingsShell>,
      ),
    ).not.toThrow();

    expect(
      screen.getByRole("heading", { name: /^settings$/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Section body")).toBeInTheDocument();
  });

  it("uses organization settings chrome for org scope", () => {
    usePathname.mockReturnValue("/portal/acme/settings/general/");

    render(
      <SettingsShell scope="org">
        <p>Org section body</p>
      </SettingsShell>,
    );

    expect(
      screen.getByRole("heading", {
        name: /organization settings/i,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Org section body")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /billing/i }),
    ).toBeInTheDocument();
  });

  it("lets the signature builder supply its own title", () => {
    usePathname.mockReturnValue("/portal/acme/site/settings/signatures/new/");

    render(
      <SettingsShell>
        <p>Builder</p>
      </SettingsShell>,
    );

    expect(
      screen.getByRole("heading", { name: /^settings$/i, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /^signatures$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Builder")).toBeInTheDocument();
  });

  it("keeps the group label and hides the snippets title on the builder", () => {
    usePathname.mockReturnValue("/portal/acme/site/settings/snippets/new/");

    render(
      <SettingsShell>
        <p>Builder</p>
      </SettingsShell>,
    );

    expect(
      screen.getAllByText(/^communication$/i).some((el) => el.tagName === "P"),
    ).toBe(true);
    expect(
      screen.queryByRole("heading", { name: /^snippets$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Builder")).toBeInTheDocument();
  });

  it("places the new signature action on the signatures title row", () => {
    usePathname.mockReturnValue("/portal/settings/signatures/");

    render(
      <SettingsShell>
        <EmailContentSettings
          kind="signature"
          items={[]}
          canManage
          onCreate={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      </SettingsShell>,
    );

    const heading = screen.getByRole("heading", {
      name: /^signatures$/i,
      level: 2,
    });
    expect(heading.parentElement).toContainElement(
      screen.getByRole("link", { name: /new signature/i }),
    );
  });
});
