import { render, screen } from "@testing-library/react";
import { ReadyWhenYouAre } from "./ReadyWhenYouAre";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("ReadyWhenYouAre", () => {
  it("renders the closing CTA linking to the contact page", () => {
    render(<ReadyWhenYouAre />);

    expect(
      screen.getByRole("heading", { name: /ready when you are/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start a project/i }),
    ).toHaveAttribute("href", "/contact");
  });

  it("accepts a custom href", () => {
    render(<ReadyWhenYouAre href="/services/websites" />);

    expect(
      screen.getByRole("link", { name: /start a project/i }),
    ).toHaveAttribute("href", "/services/websites");
  });
});
