/** How far the faded figure sits behind the live one, matching the 81 over 91 trail. */
const TRAIL = 10;

export interface CountUpFrame {
  value: number;
  /** Prior figure drawn above the live one. Null before it can trail, and once the count lands. */
  ghost: number | null;
}

export function countUpFrame(progress: number, target: number): CountUpFrame {
  if (!Number.isFinite(progress) || !Number.isFinite(target) || target <= 0) {
    return { value: 0, ghost: null };
  }

  const t = Math.min(1, Math.max(0, progress));
  if (t === 0) return { value: 0, ghost: null };

  const landed = Math.round(target);
  if (t === 1) return { value: landed, ghost: null };

  const value = Math.round(t * target);
  const ghost = value - TRAIL;
  return { value, ghost: ghost >= 0 ? ghost : null };
}
