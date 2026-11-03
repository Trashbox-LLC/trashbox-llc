import { render, screen } from "@testing-library/react";
import { PORTFOLIO_SITES } from "@/lib/portfolio";
import { SERVICE_PATHS } from "@/lib/sites";
import { HomePage } from "./HomePage";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("HomePage", () => {
  it("renders the hero and closing section without the other home sections", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /made for professionals/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /let.s build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /software that/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /what we build/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /hire us for a single project/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /selected outputs/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/aura capital/i)).not.toBeInTheDocument();
  });

  it("can use the skyline cover instead of the device mockup", () => {
    render(<HomePage hero="cover" />);

    expect(
      screen.getByRole("img", { name: "City skyline at dusk" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: "Texas Covenant Home Inspections website on a laptop beside the Calorie & Protein Tracker",
      }),
    ).not.toBeInTheDocument();
  });

  it("links the website and mobile spots and each client site", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: /sites that look sharp/i }),
    ).toHaveAttribute("href", SERVICE_PATHS.websites);
    expect(
      screen.getByRole("link", { name: /apps for the phone/i }),
    ).toHaveAttribute("href", SERVICE_PATHS.mobileApps);

    for (const site of PORTFOLIO_SITES) {
      expect(
        screen.getByRole("link", { name: `Visit ${site.name}` }),
      ).toHaveAttribute("href", site.href);
    }
  });
});
