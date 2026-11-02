/** Scroll distance before a page without a hero image picks up the header background. */
export const HEADER_SCRIM_SCROLL_THRESHOLD = 12;

export function headerScrimOpacity({
  headerTop,
  headerBottom,
  mediaTop,
  scrollY,
}: {
  headerTop: number;
  headerBottom: number;
  /** Top of the hero image, or null when the page has no scrim target. */
  mediaTop: number | null;
  scrollY: number;
}): number {
  if (mediaTop !== null) {
    const height = headerBottom - headerTop;
    if (height <= 0) return 0;
    const overlap = headerBottom - mediaTop;
    return Math.min(1, Math.max(0, overlap / height));
  }

  return scrollY > HEADER_SCRIM_SCROLL_THRESHOLD ? 1 : 0;
}
