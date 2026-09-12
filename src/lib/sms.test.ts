import { describe, expect, it } from "vitest";
import { MAX_SMS_BODY_LENGTH, smsSegmentCount } from "@/lib/sms";

describe("smsSegmentCount", () => {
  it("counts nothing for an empty body", () => {
    expect(smsSegmentCount("")).toBe(0);
  });

  it("fits 160 GSM-7 characters in one segment", () => {
    expect(smsSegmentCount("a".repeat(160))).toBe(1);
  });

  it("splits past 160 into 153-character segments", () => {
    expect(smsSegmentCount("a".repeat(161))).toBe(2);
    expect(smsSegmentCount("a".repeat(306))).toBe(2);
    expect(smsSegmentCount("a".repeat(307))).toBe(3);
  });

  it("charges two septets for GSM-7 extension characters", () => {
    expect(smsSegmentCount("€".repeat(80))).toBe(1);
    expect(smsSegmentCount("€".repeat(81))).toBe(2);
  });

  it("drops to 70 characters per segment once a body needs UCS-2", () => {
    expect(smsSegmentCount("ç".repeat(70))).toBe(1);
    expect(smsSegmentCount("ç".repeat(71))).toBe(2);
  });

  it("bills astral characters as two UTF-16 units", () => {
    expect(smsSegmentCount("🗑".repeat(35))).toBe(1);
    expect(smsSegmentCount("🗑".repeat(36))).toBe(2);
  });
});

describe("MAX_SMS_BODY_LENGTH", () => {
  it("matches the carrier concatenation ceiling the API enforces", () => {
    expect(MAX_SMS_BODY_LENGTH).toBe(1600);
  });
});
