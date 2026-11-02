import { render, screen } from "@testing-library/react";
import { ServicesPage } from "./ServicesPage";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("ServicesPage", () => {
  it("lists service offerings and links to the contact page", () => {
    render(<ServicesPage />);

    expect(
      screen.getByRole("heading", { name: /build once/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^websites$/i })).toHaveAttribute(
      "href",
      "/services/websites",
    );
    expect(
      screen.getByRole("link", { name: /^web applications$/i }),
    ).toHaveAttribute("href", "/services/web-applications");
    expect(screen.getByRole("link", { name: /^systems$/i })).toHaveAttribute(
      "href",
      "/services/systems",
    );
    expect(screen.getByRole("link", { name: /^mobile apps$/i })).toHaveAttribute(
      "href",
      "/services/mobile-apps",
    );
    expect(
      screen.getByRole("link", { name: /^ai integration$/i }),
    ).toHaveAttribute("href", "/services/ai-integration");
    expect(
      screen.getByRole("link", { name: /start a project/i }),
    ).toHaveAttribute("href", "/contact");
  });
});
