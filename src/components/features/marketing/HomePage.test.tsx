import { render, screen } from "@testing-library/react";
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
});
