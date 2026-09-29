import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
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

  it("selects the side image that was pressed when the press also moves", () => {
    render(<WorkCarousel />);
    const salus = screen.getByRole("button", {
      name: /salus integrative health/i,
    });

    fireEvent.pointerDown(salus, { clientX: 320, pointerId: 1 });
    fireEvent.pointerUp(salus, { clientX: 220, pointerId: 1 });
    fireEvent.click(salus);

    expect(
      screen.getByRole("link", { name: /visit salus integrative health/i }),
    ).toBeInTheDocument();
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

  it("keeps a small movement on the front image as a click", () => {
    render(<WorkCarousel />);
    const link = screen.getByRole("link", { name: /visit lacelle pastries/i });
    const capture = vi.spyOn(
      link.parentElement as HTMLElement,
      "setPointerCapture",
    );

    fireEvent.pointerDown(link, { clientX: 200, pointerId: 1 });
    fireEvent.pointerUp(link, { clientX: 210, pointerId: 1 });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);

    expect(capture).not.toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(false);
    expect(
      screen.getByRole("link", { name: /visit lacelle pastries/i }),
    ).toBeInTheDocument();
  });

  it("turns to the next site when the fan is swiped left", () => {
    render(<WorkCarousel />);
    const fan = screen.getByRole("link", { name: /visit lacelle pastries/i });

    fireEvent.pointerDown(fan, { clientX: 240, pointerId: 1 });
    fireEvent.pointerUp(fan, { clientX: 80, pointerId: 1 });

    expect(
      screen.getByRole("link", { name: /visit rj inspections/i }),
    ).toBeInTheDocument();
  });

  it("turns the fan when the front image is dragged and does not open the site", () => {
    render(<WorkCarousel />);
    const link = screen.getByRole("link", { name: /visit lacelle pastries/i });
    const drag = createEvent.dragStart(link, {
      bubbles: true,
      cancelable: true,
    });

    fireEvent.pointerDown(link, { clientX: 240, clientY: 30, pointerId: 1 });
    fireEvent(link, drag);
    fireEvent.pointerUp(link, { clientX: 80, clientY: 34, pointerId: 1 });

    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    screen
      .getByRole("link", { name: /visit rj inspections/i })
      .dispatchEvent(click);

    expect(drag.defaultPrevented).toBe(true);
    expect(click.defaultPrevented).toBe(true);
  });

  it("advances to the next site on its own", () => {
    vi.useFakeTimers();
    try {
      render(<WorkCarousel />);

      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(
        screen.getByRole("link", { name: /visit rj inspections/i }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
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
