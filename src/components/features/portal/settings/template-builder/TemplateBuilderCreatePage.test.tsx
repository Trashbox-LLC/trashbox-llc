import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TemplateBuilderCreatePage } from "./TemplateBuilderCreatePage";

vi.mock("next/navigation", () => {
  const params = new URLSearchParams();
  return { useSearchParams: () => params };
});

describe("TemplateBuilderCreatePage", () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      "",
      "/portal/acme/site/settings/templates/builder/",
    );
  });

  it("opens a starter from the address query as editable components", () => {
    window.history.pushState(
      {},
      "",
      "/portal/acme/site/settings/templates/builder/?starter=followup-check-in",
    );

    render(<TemplateBuilderCreatePage />);

    expect(screen.getByLabelText(/template name/i)).toHaveValue(
      "Follow-up check-in",
    );
    expect(screen.getByText("Still here if you need us")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reply" })).toBeInTheDocument();
  });

  it("opens a blank page when the address has no starter", () => {
    render(<TemplateBuilderCreatePage />);

    expect(screen.getByLabelText(/template name/i)).toHaveValue("");
    expect(
      screen.queryByRole("link", { name: "Reply" }),
    ).not.toBeInTheDocument();
  });
});
