import { render, screen } from "@testing-library/react";
import { HomeHero } from "./HomeHero";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("HomeHero", () => {
  it("renders hero items hidden before the entrance animation runs", () => {
    render(<HomeHero />);

    const heading = screen.getByRole("heading", { name: "Trashbox LLC" });
    const tagline = screen.getByText(/businesses of every size/i);
    const ctaGroup = screen
      .getByRole("link", { name: /Work With Us/i })
      .closest("[data-hero-item]");
    const devices = screen
      .getByRole("img", {
        name: "Texas Covenant Home Inspections website on a laptop beside the Calorie & Protein Tracker",
      })
      .closest("[data-hero-item]");

    for (const el of [heading, tagline, ctaGroup, devices]) {
      expect(el).toHaveAttribute("data-hero-item");
      expect(el).toHaveStyle({ opacity: "0", transform: "translateY(28px)" });
    }
  });
});
