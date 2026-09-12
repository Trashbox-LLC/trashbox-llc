/**
 * Mirror of the Form API's segment accounting so the composer can show the
 * same billable count the send endpoint will meter.
 */

/** Longest body the carriers will accept as one concatenated message. */
export const MAX_SMS_BODY_LENGTH = 1600;

const GSM7_SINGLE_SEGMENT = 160;
const GSM7_CONCAT_SEGMENT = 153;
const UCS2_SINGLE_SEGMENT = 70;
const UCS2_CONCAT_SEGMENT = 67;

const GSM7_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
);

/** Escape-prefixed characters that occupy two GSM-7 septets. */
const GSM7_EXTENDED = new Set("^{}\\[~]|€");

/** Septet count, or null when the body needs UCS-2 encoding. */
function gsm7Septets(body: string): number | null {
  let septets = 0;
  for (const char of body) {
    if (GSM7_BASIC.has(char)) {
      septets += 1;
    } else if (GSM7_EXTENDED.has(char)) {
      septets += 2;
    } else {
      return null;
    }
  }
  return septets;
}

/** Billable segments for a body, matching how carriers split concatenations. */
export function smsSegmentCount(body: string): number {
  if (!body) return 0;

  const septets = gsm7Septets(body);
  if (septets !== null) {
    return septets <= GSM7_SINGLE_SEGMENT
      ? 1
      : Math.ceil(septets / GSM7_CONCAT_SEGMENT);
  }

  // UCS-2 is billed per UTF-16 code unit, so astral characters cost two.
  const units = body.length;
  return units <= UCS2_SINGLE_SEGMENT
    ? 1
    : Math.ceil(units / UCS2_CONCAT_SEGMENT);
}
