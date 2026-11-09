import { render, screen } from "@testing-library/react";
import { HomeCoverHero } from "./HomeCoverHero";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("HomeCoverHero", () => {
  it("uses the skyline as cover art and leaves out the device mockup", () => {
    render(<HomeCoverHero />);

    expect(
      screen.getByRole("img", { name: "City skyline at dusk" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: "Texas Covenant Home Inspections website on a laptop beside the Calorie & Protein Tracker",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders hero items hidden before the entrance animation runs", () => {
    render(<HomeCoverHero />);

    const heading = screen.getByRole("heading", {
      name: /made for professionals/i,
    });
    const tagline = screen.getByText(
      /website design, creation, & digital marketing/i,
    );
    const ctaGroup = screen
      .getByRole("link", { name: /let's connect/i })
      .closest("[data-hero-item]");

    for (const el of [heading, tagline, ctaGroup]) {
      expect(el).toHaveAttribute("data-hero-item");
      expect(el).toHaveStyle({ opacity: "0", transform: "translateY(28px)" });
    }
  });
});
