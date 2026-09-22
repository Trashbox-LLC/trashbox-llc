export function formatSyncedAgo(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";

  const elapsed = Math.max(0, now - then);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Synced just now";
  if (minutes < 60) {
    return `Synced ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Synced ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `Synced ${days} ${days === 1 ? "day" : "days"} ago`;
}
