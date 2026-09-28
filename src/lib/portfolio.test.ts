import { describe, expect, it } from "vitest";
import {
  INITIAL_PORTFOLIO_INDEX,
  PORTFOLIO_SITES,
  coverflowOffset,
  coverflowPose,
  portfolioPositionLabel,
  stepPortfolioIndex,
} from "./portfolio";

describe("portfolio coverflow", () => {
  it("keeps the six built sites in fan order with Lacelle in front", () => {
    expect(PORTFOLIO_SITES.map((site) => site.name)).toEqual([
      "Riley Musil",
      "Texas Covenant Home Inspections",
      "Monarch Home Inspections",
      "Lacelle Pastries",
      "RJ Inspections",
      "Salus Integrative Health",
    ]);
    expect(PORTFOLIO_SITES[INITIAL_PORTFOLIO_INDEX]?.name).toBe(
      "Lacelle Pastries",
    );
    expect(
      PORTFOLIO_SITES.every((site) => site.href.startsWith("https://")),
    ).toBe(true);
  });

  it("wraps cards around the active one", () => {
    const count = PORTFOLIO_SITES.length;

    expect(coverflowOffset(0, 3, count)).toBe(-3);
    expect(coverflowOffset(5, 3, count)).toBe(2);
    expect(coverflowOffset(5, 0, count)).toBe(-1);
    expect(coverflowOffset(4, 0, count)).toBe(-2);
    expect(coverflowOffset(3, 0, count)).toBe(3);
  });

  it("steps through the fan and wraps at both ends", () => {
    const count = PORTFOLIO_SITES.length;

    expect(stepPortfolioIndex(3, 1, count)).toBe(4);
    expect(stepPortfolioIndex(5, 1, count)).toBe(0);
    expect(stepPortfolioIndex(0, -1, count)).toBe(5);
  });

  it("turns side cards away from the viewer and parks the far ones", () => {
    const center = coverflowPose(0);
    const right = coverflowPose(1);
    const left = coverflowPose(-1);
    const outer = coverflowPose(2);
    const parked = coverflowPose(-3);

    expect(center.rotate).toBe(0);
    expect(center.depth).toBeGreaterThan(0);
    expect(center.hidden).toBe(false);

    expect(right.shift).toBeGreaterThan(0);
    expect(left.shift).toBe(-right.shift);
    expect(left.rotate).toBe(-right.rotate);
    expect(left.depth).toBe(right.depth);
    expect(left.scale).toBe(right.scale);
    expect(Math.abs(outer.rotate)).toBeGreaterThan(Math.abs(right.rotate));
    expect(coverflowPose(-2).shift).toBe(-outer.shift);
    expect(coverflowPose(-2).rotate).toBe(-outer.rotate);
    expect(parked.hidden).toBe(true);
  });

  it("labels the active position", () => {
    expect(portfolioPositionLabel(3, 6)).toBe("04 / 06");
    expect(portfolioPositionLabel(0, 6)).toBe("01 / 06");
  });
});
