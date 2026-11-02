import { render, screen } from "@testing-library/react";
import { AboutPage } from "./AboutPage";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("AboutPage", () => {
  it("renders brand, mission, and founder story", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { name: /trashbox/i })).toBeInTheDocument();
    expect(screen.getByText(/businesses of every size/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ezekiel mohr/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /ezekiel mohr/i })).toBeInTheDocument();
    const tiltFrames = screen.getAllByTestId("tilt-media");
    expect(tiltFrames).toHaveLength(2);
    expect(tiltFrames[0]).toContainElement(
      screen.getByRole("img", { name: /ezekiel mohr/i }),
    );
    expect(tiltFrames[1]).toHaveTextContent(/ezekiel mohr/i);
    expect(screen.getAllByText(/kingwood/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/amazon leo/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start a project/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
