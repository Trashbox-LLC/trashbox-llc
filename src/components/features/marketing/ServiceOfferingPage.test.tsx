import { render, screen } from "@testing-library/react";
import { ServiceOfferingPage } from "./ServiceOfferingPage";
import { getServiceOffering } from "./service-offerings";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("ServiceOfferingPage", () => {
  it("renders websites with showcase imagery and engagement sections", () => {
    const offering = getServiceOffering("websites");
    render(<ServiceOfferingPage offering={offering} />);

    expect(
      screen.getByRole("heading", { name: offering.headline }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: offering.image.alt })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: offering.oneOffTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /brand presence/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start a project/i }),
    ).toHaveAttribute("href", "/contact");
  });

  it("renders web applications with a process section", () => {
    const offering = getServiceOffering("webApplications");
    render(<ServiceOfferingPage offering={offering} />);

    expect(
      screen.getByRole("heading", { name: /how a build usually moves/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /scope the first release/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: offering.image.alt })).toBeInTheDocument();
  });

  it("renders mobile apps with a portfolio link and fit section", () => {
    const offering = getServiceOffering("mobileApps");
    render(<ServiceOfferingPage offering={offering} />);

    expect(
      screen.getByRole("link", { name: /see selected mobile work/i }),
    ).toHaveAttribute("href", "/apps");
    expect(
      screen.getByRole("heading", { name: /built for the hand/i }),
    ).toBeInTheDocument();
  });
});
