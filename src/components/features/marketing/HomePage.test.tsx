import { render, screen } from "@testing-library/react";
import { HomePage } from "./HomePage";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("HomePage", () => {
  it("renders hero, about, and cta sections without selected outputs", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Trashbox Studios" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /software that/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /what we build/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /hire us for a single project/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /let.s build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /selected outputs/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/aura capital/i)).not.toBeInTheDocument();
  });
});
