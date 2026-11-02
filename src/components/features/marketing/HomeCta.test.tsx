import { render, screen } from "@testing-library/react";
import { HomeCta } from "./HomeCta";

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

describe("HomeCta", () => {
  it("renders the closing call to action", () => {
    render(<HomeCta />);

    expect(screen.getByRole("heading", { name: /let.s build/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start your project/i })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("link", { name: /contact@trashbox\.io/i })).toHaveAttribute(
      "href",
      "mailto:contact@trashbox.io",
    );
    expect(screen.getByRole("link", { name: /714-586-1630/i })).toHaveAttribute(
      "href",
      "tel:+17145861630",
    );
  });
});
