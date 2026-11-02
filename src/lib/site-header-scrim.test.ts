import { describe, expect, it } from "vitest";
import { headerScrimOpacity } from "./site-header-scrim";

const header = { headerTop: 0, headerBottom: 100 };

describe("headerScrimOpacity", () => {
  it("stays clear until the hero text is a header-height away", () => {
    expect(
      headerScrimOpacity({ ...header, textTop: 200, scrollY: 0 }),
    ).toBe(0);
  });

  it("fades in as the hero text approaches and is solid when the text meets the header", () => {
    expect(
      headerScrimOpacity({ ...header, textTop: 150, scrollY: 50 }),
    ).toBe(0.5);
    expect(
      headerScrimOpacity({ ...header, textTop: 100, scrollY: 100 }),
    ).toBe(1);
  });

  it("fades across the open space when the text starts closer than the header is tall", () => {
    expect(
      headerScrimOpacity({ ...header, textTop: 120, scrollY: 0 }),
    ).toBe(0);
    expect(
      headerScrimOpacity({ ...header, textTop: 110, scrollY: 10 }),
    ).toBe(0.5);
    expect(
      headerScrimOpacity({ ...header, textTop: 100, scrollY: 20 }),
    ).toBe(1);
  });
  it("stays filled once the hero text has passed under the header", () => {
    expect(
      headerScrimOpacity({ ...header, textTop: -40, scrollY: 240 }),
    ).toBe(1);
  });

  it("ignores a zero-height header", () => {
    expect(
      headerScrimOpacity({
        headerTop: 40,
        headerBottom: 40,
        textTop: 0,
        scrollY: 100,
      }),
    ).toBe(0);
  });

  it("uses scroll position on pages without hero text", () => {
    expect(
      headerScrimOpacity({ ...header, textTop: null, scrollY: 12 }),
    ).toBe(0);
    expect(
      headerScrimOpacity({ ...header, textTop: null, scrollY: 13 }),
    ).toBe(1);
  });
});
