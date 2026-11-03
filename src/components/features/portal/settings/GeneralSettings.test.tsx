import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GeneralSettings } from "./GeneralSettings";

describe("GeneralSettings", () => {
  it("shows signed-in email, client, and plan usage", () => {
    render(
      <GeneralSettings
        email="ezekielbleh@gmail.com"
        clientName="Trashbox Studios"
        tier="solo"
        active
        submissionsUsed={25}
        submissionLimit={500}
      />,
    );

    expect(screen.getByText(/^signed in$/i)).toBeInTheDocument();
    expect(screen.getByText("ezekielbleh@gmail.com")).toBeInTheDocument();
    expect(screen.getByText(/Client: Trashbox Studios/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan:/i)).toBeInTheDocument();
    expect(screen.getByText("solo")).toBeInTheDocument();
    expect(screen.getByText(/25/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it("marks inactive plans", () => {
    render(
      <GeneralSettings
        email="user@example.com"
        clientName="Acme"
        tier="team"
        active={false}
        submissionsUsed={10}
        submissionLimit={5000}
      />,
    );

    expect(screen.getByText(/inactive/i)).toBeInTheDocument();
  });

  it("omits plan row when tier is missing", () => {
    render(
      <GeneralSettings email="user@example.com" clientName="Acme" />,
    );

    expect(screen.queryByText(/Plan:/i)).not.toBeInTheDocument();
  });
});
