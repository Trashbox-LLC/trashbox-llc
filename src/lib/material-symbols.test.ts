import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MATERIAL_SYMBOLS_STYLESHEET } from "./material-symbols";

const srcDir = dirname(fileURLToPath(import.meta.url));

describe("Material Symbols stylesheet", () => {
  it("loads a variable icon font with ligatures, not a static cut", () => {
    expect(MATERIAL_SYMBOLS_STYLESHEET).toContain("fonts.googleapis.com");
    expect(MATERIAL_SYMBOLS_STYLESHEET).toContain("Material+Symbols+Outlined");
    expect(MATERIAL_SYMBOLS_STYLESHEET).toContain("100..700");
    expect(MATERIAL_SYMBOLS_STYLESHEET).toContain("display=block");
  });

  it("is wired into the app layout and icon CSS", () => {
    const layout = readFileSync(join(srcDir, "../app/layout.tsx"), "utf8");
    const css = readFileSync(join(srcDir, "../styles/globals.css"), "utf8");

    expect(layout).toContain("MATERIAL_SYMBOLS_STYLESHEET");
    expect(css).toContain('font-feature-settings: "liga"');
  });
});
