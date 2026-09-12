import { describe, expect, it } from "vitest";
import { formatPhoneDisplay } from "@/lib/phone";

describe("formatPhoneDisplay", () => {
  it("formats North American numbers for humans", () => {
    expect(formatPhoneDisplay("+14255550182")).toBe("(425) 555-0182");
  });

  it("leaves other country codes in E.164", () => {
    expect(formatPhoneDisplay("+442079460958")).toBe("+442079460958");
  });

  it("passes through values it cannot parse", () => {
    expect(formatPhoneDisplay("")).toBe("");
    expect(formatPhoneDisplay("not a phone")).toBe("not a phone");
  });
});
