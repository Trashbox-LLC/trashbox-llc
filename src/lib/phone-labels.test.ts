import { describe, expect, it } from "vitest";
import {
  defaultPhoneLabel,
  labeledContactPhones,
  nextPhoneLabel,
} from "@/lib/phone-labels";

describe("defaultPhoneLabel", () => {
  it("starts at phone, then mobile, then home", () => {
    expect(defaultPhoneLabel(0)).toBe("phone");
    expect(defaultPhoneLabel(1)).toBe("mobile");
    expect(defaultPhoneLabel(2)).toBe("home");
  });

  it("uses other once the list runs out", () => {
    expect(defaultPhoneLabel(20)).toBe("other");
  });
});

describe("nextPhoneLabel", () => {
  it("skips labels already in use", () => {
    expect(nextPhoneLabel(["phone", "home"])).toBe("mobile");
  });
});

describe("labeledContactPhones", () => {
  it("fills missing labels from the default sequence", () => {
    expect(
      labeledContactPhones({
        phones: ["+15551111111", "+15552222222"],
      }),
    ).toEqual([
      { number: "+15551111111", label: "phone" },
      { number: "+15552222222", label: "mobile" },
    ]);
  });

  it("keeps a stored label", () => {
    expect(
      labeledContactPhones({
        phones: ["+15551111111"],
        phoneLabels: ["work"],
      }),
    ).toEqual([{ number: "+15551111111", label: "work" }]);
  });
});
