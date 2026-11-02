import { describe, expect, it } from "vitest";
import { indicatorMoved, pageIndicatorTarget } from "./page-indicator";

const shown = {
  reducedMotion: false,
  navLeft: 100,
  navWidth: 480,
  link: { left: 248, width: 72 },
};

describe("pageIndicatorTarget", () => {
  it("places the underline under the current tab", () => {
    expect(pageIndicatorTarget(shown)).toEqual({ x: 148, width: 72 });
  });

  it("hides the traveling underline when it should stay put", () => {
    expect(pageIndicatorTarget({ ...shown, reducedMotion: true })).toBeNull();
    expect(pageIndicatorTarget({ ...shown, navWidth: 0 })).toBeNull();
    expect(pageIndicatorTarget({ ...shown, link: null })).toBeNull();
    expect(
      pageIndicatorTarget({ ...shown, link: { left: 248, width: 0 } }),
    ).toBeNull();
  });
});

describe("indicatorMoved", () => {
  it("treats the first placement as a set, not a slide", () => {
    expect(indicatorMoved(null, { x: 148, width: 72 })).toBe(false);
  });

  it("slides when the current tab changes position", () => {
    expect(
      indicatorMoved({ x: 148, width: 72 }, { x: 240, width: 40 }),
    ).toBe(true);
    expect(
      indicatorMoved({ x: 148, width: 72 }, { x: 148.2, width: 72 }),
    ).toBe(false);
  });
});
