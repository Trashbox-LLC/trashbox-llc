export interface PageIndicatorFrame {
  x: number;
  width: number;
}

export function pageIndicatorTarget({
  reducedMotion,
  navLeft,
  navWidth,
  link,
}: {
  reducedMotion: boolean;
  navLeft: number;
  navWidth: number;
  link: { left: number; width: number } | null;
}): PageIndicatorFrame | null {
  if (reducedMotion || navWidth <= 0 || !link || link.width <= 0) return null;
  return { x: link.left - navLeft, width: link.width };
}

export function indicatorMoved(
  previous: PageIndicatorFrame | null,
  next: PageIndicatorFrame,
): boolean {
  if (!previous) return false;
  return (
    Math.abs(previous.x - next.x) > 0.5 ||
    Math.abs(previous.width - next.width) > 0.5
  );
}
