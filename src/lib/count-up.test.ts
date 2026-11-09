import { describe, expect, it } from "vitest";
import { countUpFrame } from "./count-up";

describe("countUpFrame", () => {
  it("starts at zero with no trail", () => {
    expect(countUpFrame(0, 91)).toEqual({ value: 0, ghost: null });
  });

  it("trails the live figure by ten while the count is still moving", () => {
    expect(countUpFrame(0.995, 91)).toEqual({ value: 91, ghost: 81 });
    expect(countUpFrame(0.995, 60)).toEqual({ value: 60, ghost: 50 });
  });

  it("hides the trail until the figure has risen by ten", () => {
    expect(countUpFrame(0.05, 91)).toEqual({ value: 5, ghost: null });
  });

  it("lands on the target and clears the trail when the count finishes", () => {
    expect(countUpFrame(1, 85)).toEqual({ value: 85, ghost: null });
  });

  it("clamps progress that falls outside the count", () => {
    expect(countUpFrame(-0.4, 85)).toEqual({ value: 0, ghost: null });
    expect(countUpFrame(1.6, 85)).toEqual({ value: 85, ghost: null });
  });

  it("stays empty when there is no distance to count", () => {
    expect(countUpFrame(0.5, 0)).toEqual({ value: 0, ghost: null });
    expect(countUpFrame(Number.NaN, 91)).toEqual({ value: 0, ghost: null });
  });
});
