/** Human-readable rendering; non-NANP numbers stay in E.164. */
export function formatPhoneDisplay(value: string): string {
  const nanp = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(value);
  if (!nanp) return value;
  return `(${nanp[1]}) ${nanp[2]}-${nanp[3]}`;
}
