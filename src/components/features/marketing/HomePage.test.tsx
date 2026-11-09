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

  it("uses the late-day skyline as the homepage hero", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("img", { name: "Downtown towers in late-day sun" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: "Texas Covenant Home Inspections website on a laptop beside the Calorie & Protein Tracker",
      }),
    ).not.toBeInTheDocument();
  });

  it("can still show the device mockup hero", () => {
    render(<HomePage hero="devices" />);

    expect(
      screen.getByRole("img", {
        name: "Texas Covenant Home Inspections website on a laptop beside the Calorie & Protein Tracker",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "City skyline at dusk" }),
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
