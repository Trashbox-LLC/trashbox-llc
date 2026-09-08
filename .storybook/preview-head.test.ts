import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const storybookDir = dirname(fileURLToPath(import.meta.url));

describe("Storybook preview fonts", () => {
  it("loads Material Symbols Outlined so icon ligatures render as glyphs", () => {
    const head = readFileSync(join(storybookDir, "preview-head.html"), "utf8");

    expect(head).toContain("fonts.googleapis.com");
    expect(head).toContain("Material+Symbols+Outlined");
    expect(head).toContain("100..700");
    expect(head).toContain("display=block");
    expect(head).toContain("family=Manrope");
    expect(head).toContain("family=Space+Grotesk");
  });
});

describe("Storybook preview navigation guard", () => {
  it("stubs hard navigations so Chromatic capture stays on the story", () => {
    const preview = readFileSync(join(storybookDir, "preview.tsx"), "utf8");

    expect(preview).toContain("DisableHardNavigation");
    expect(preview).toContain("Location.prototype.assign");
    expect(preview).toContain("Location.prototype.replace");
  });
});
