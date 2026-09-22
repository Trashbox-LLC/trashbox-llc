import { describe, expect, it } from "vitest";
import { formatSyncedAgo } from "./mailbox-sync-age";

const now = Date.parse("2026-09-22T15:32:09.000Z");

describe("formatSyncedAgo", () => {
  it("treats a sync under a minute as just now", () => {
    expect(formatSyncedAgo("2026-09-22T15:32:00.000Z", now)).toBe(
      "Synced just now",
    );
  });

  it("uses a singular minute", () => {
    expect(formatSyncedAgo("2026-09-22T15:31:09.000Z", now)).toBe(
      "Synced 1 minute ago",
    );
  });

  it("rounds a multi-hour sync down to whole hours", () => {
    expect(formatSyncedAgo("2026-09-22T13:32:09.000Z", now)).toBe(
      "Synced 2 hours ago",
    );
  });

  it("uses a singular day once a full day has passed", () => {
    expect(formatSyncedAgo("2026-09-21T15:32:09.000Z", now)).toBe(
      "Synced 1 day ago",
    );
  });

  it("returns nothing for an unreadable timestamp", () => {
    expect(formatSyncedAgo("not-a-date", now)).toBe("");
  });
});
