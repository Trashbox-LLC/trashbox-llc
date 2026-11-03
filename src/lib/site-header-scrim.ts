/** Scroll distance before a page without hero text picks up the header background. */
export const HEADER_SCRIM_SCROLL_THRESHOLD = 12;

export function headerScrimOpacity({
  headerTop,
  headerBottom,
  textTop,
  scrollY,
}: {
  headerTop: number;
  headerBottom: number;
  /** Top of the hero text, or null when the page has no scrim target. */
  textTop: number | null;
  scrollY: number;
}): number {
  if (textTop !== null) {
    const height = headerBottom - headerTop;
    if (height <= 0) return 0;
    const gap = textTop - headerBottom;
    if (gap <= 0) return 1;
    const restingGap = gap + scrollY;
    const lead = Math.min(height, restingGap);
    if (lead <= 0 || gap >= lead) return 0;
    return 1 - gap / lead;
  }

  return scrollY > HEADER_SCRIM_SCROLL_THRESHOLD ? 1 : 0;
}
