import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HOME_DEV_STORAGE_KEY } from "./home-dev-settings";
import { HomePreview } from "./HomePreview";
import { SiteHeader } from "./SiteHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@gsap/react", () => ({
  useGSAP: () => {},
}));

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Dev settings" }));
}

describe("HomePreview", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("swaps the hero when another photo is chosen", async () => {
    const user = userEvent.setup();
    render(<HomePreview />);

    await openSettings(user);
    await user.click(
      screen.getByRole("button", {
        name: "Dallas skyline under a pink dusk sky",
      }),
    );

    expect(
      screen.getByRole("img", { name: "Dallas skyline under a pink dusk sky" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Downtown towers in late-day sun" }),
    ).not.toBeInTheDocument();
  });

  it("restyles the eyebrow from the settings", async () => {
    const user = userEvent.setup();
    render(<HomePreview />);

    await openSettings(user);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    await user.click(screen.getByRole("button", { name: "Eyebrow large" }));
    await user.click(screen.getByRole("button", { name: "Eyebrow grey" }));
    await user.click(screen.getByRole("button", { name: "Wide" }));
    await user.click(screen.getByRole("button", { name: "Eyebrow uppercase" }));

    const eyebrow = screen.getByText(
      /website design, creation, & digital marketing/i,
    );
    expect(eyebrow).toHaveAttribute("data-kicker-weight", "bold");
    expect(eyebrow).toHaveAttribute("data-kicker-size", "lg");
    expect(eyebrow).toHaveAttribute("data-kicker-color", "grey");
    expect(eyebrow).toHaveAttribute("data-kicker-tracking", "wide");
    expect(eyebrow).toHaveAttribute("data-kicker-case", "caps");
  });

  it("recolors the header from dev settings", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SiteHeader />
        <HomePreview />
      </>,
    );

    const header = screen.getByRole("navigation");
    expect(header).toHaveAttribute("data-header-tone", "grey");

    await openSettings(user);
    await user.click(screen.getByRole("button", { name: "All white" }));

    expect(header).toHaveAttribute("data-header-tone", "white");

    await user.click(screen.getByRole("button", { name: "All grey" }));

    expect(header).toHaveAttribute("data-header-tone", "grey");
  });

  it("uses a white headline when that option is on", async () => {
    const user = userEvent.setup();
    render(<HomePreview />);

    await openSettings(user);
    await user.click(
      screen.getByRole("button", { name: "White", exact: true }),
    );

    expect(
      screen.getByRole("button", { name: "White", exact: true }),
    ).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(document.querySelector("[data-headline]")).toHaveAttribute(
      "data-headline",
      "solid",
    );
  });

  it("shows the published homepage when that option is on", async () => {
    const user = userEvent.setup();
    render(<HomePreview />);

    await openSettings(user);
    await user.click(screen.getByRole("button", { name: "Published" }));

    expect(
      screen.getByRole("img", {
        name: "Texas Covenant Home Inspections website on a laptop beside the Calorie & Protein Tracker",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /sites that look sharp/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Published" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("returns to the full page from the published homepage", async () => {
    const user = userEvent.setup();
    render(<HomePreview />);

    await openSettings(user);
    await user.click(screen.getByRole("button", { name: "Published" }));
    await user.click(screen.getByRole("button", { name: "Full" }));

    expect(
      screen.getByRole("img", { name: "Downtown towers in late-day sun" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /sites that look sharp/i }),
    ).toBeInTheDocument();
  });

  it("restores saved settings", async () => {
    localStorage.setItem(
      HOME_DEV_STORAGE_KEY,
      JSON.stringify({
        coverId: "night",
        headline: "solid",
        layout: "full",
      }),
    );
    render(<HomePreview />);

    expect(
      await screen.findByRole("img", { name: "Downtown towers lit at night" }),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-headline]")).toHaveAttribute(
      "data-headline",
      "solid",
    );
  });
});
