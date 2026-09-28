import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkCarousel } from "./WorkCarousel";

describe("WorkCarousel", () => {
  it("opens on Lacelle and links to the live site", () => {
    render(<WorkCarousel />);

    expect(
      screen.getByRole("link", { name: /visit lacelle pastries/i }),
    ).toHaveAttribute("href", "https://lacelle-pastries.vercel.app/");
    expect(screen.getByText("04 / 06")).toBeInTheDocument();
  });

  it("moves to the next and previous site", async () => {
    const user = userEvent.setup();
    render(<WorkCarousel />);

    await user.click(screen.getByRole("button", { name: /next website/i }));

    expect(
      screen.getByRole("link", { name: /visit rj inspections/i }),
    ).toHaveAttribute("href", "https://www.rjinspectionstexas.com/");
    expect(
      screen.getByRole("button", { name: /^lacelle pastries$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("05 / 06")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous website/i }));

    expect(
      screen.getByRole("link", { name: /visit lacelle pastries/i }),
    ).toBeInTheDocument();
  });

  it("wraps from the last site back to the first", async () => {
    const user = userEvent.setup();
    render(<WorkCarousel />);

    await user.click(
      screen.getByRole("button", { name: /salus integrative health/i }),
    );
    await user.click(screen.getByRole("button", { name: /next website/i }));

    expect(
      screen.getByRole("link", { name: /visit riley musil/i }),
    ).toHaveAttribute("href", "https://rileymusil.com/");
    expect(screen.getByText("01 / 06")).toBeInTheDocument();
  });

  it("selects a visible side site and wraps backward from the first", async () => {
    const user = userEvent.setup();
    render(<WorkCarousel />);

    await user.click(
      screen.getByRole("button", { name: /monarch home inspections/i }),
    );

    expect(
      screen.getByRole("link", { name: /visit monarch home inspections/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous website/i }));
    await user.click(screen.getByRole("button", { name: /previous website/i }));
    await user.click(screen.getByRole("button", { name: /previous website/i }));

    expect(
      screen.getByRole("link", { name: /visit salus integrative health/i }),
    ).toHaveAttribute("href", "https://salus-integrative-health.vercel.app/");
  });

  it("changes site with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<WorkCarousel />);

    screen.getByRole("button", { name: /next website/i }).focus();
    await user.keyboard("{ArrowRight}");

    expect(
      screen.getByRole("link", { name: /visit rj inspections/i }),
    ).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");

    expect(
      screen.getByRole("link", { name: /visit lacelle pastries/i }),
    ).toBeInTheDocument();
  });
});
