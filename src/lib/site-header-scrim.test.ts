import { describe, expect, it } from "vitest";
import { headerScrimOpacity } from "./site-header-scrim";

const header = { headerTop: 0, headerBottom: 100 };

describe("headerScrimOpacity", () => {
  it("stays clear until the hero image reaches the header", () => {
    expect(
      headerScrimOpacity({ ...header, mediaTop: 180, scrollY: 400 }),
    ).toBe(0);
  });

  it("fades in as the hero image covers the header", () => {
    expect(
      headerScrimOpacity({ ...header, mediaTop: 100, scrollY: 80 }),
    ).toBe(0);
    expect(
      headerScrimOpacity({ ...header, mediaTop: 50, scrollY: 130 }),
    ).toBe(0.5);
    expect(
      headerScrimOpacity({ ...header, mediaTop: 0, scrollY: 180 }),
    ).toBe(1);
  });

  it("stays filled once the hero image has passed under the header", () => {
    expect(
      headerScrimOpacity({ ...header, mediaTop: -240, scrollY: 500 }),
    ).toBe(1);
  });

  it("ignores a zero-height header", () => {
    expect(
      headerScrimOpacity({
        headerTop: 40,
        headerBottom: 40,
        mediaTop: 0,
        scrollY: 100,
      }),
    ).toBe(0);
  });

  it("uses scroll position on pages without a hero image", () => {
    expect(
      headerScrimOpacity({ ...header, mediaTop: null, scrollY: 12 }),
    ).toBe(0);
    expect(
      headerScrimOpacity({ ...header, mediaTop: null, scrollY: 13 }),
    ).toBe(1);
  });
});
