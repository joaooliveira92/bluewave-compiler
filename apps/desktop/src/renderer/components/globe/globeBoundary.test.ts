import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

/**
 * The shared globe is presentation-only (BW-ARC-001/002): it draws the static
 * world topology and reads theme CSS variables, and that is all. This allowlist
 * is the import-level proof that no campaign, nation or other authoritative
 * module can reach the decorative globe (ADR-0127).
 */
const globeDir = dirname(fileURLToPath(import.meta.url));

const ALLOWED_SPECIFIERS: readonly RegExp[] = [
  /^react$/u,
  /^motion\/react$/u,
  /^d3-geo$/u,
  /^d3-selection$/u,
  /^topojson-client$/u,
  /^@\/content\/world-110m\.json$/u,
  /^\.\/[A-Za-z]+\.js$/u,
];

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  for (const match of source.matchAll(/(?:from|import)\s+["']([^"']+)["']/gu)) {
    specifiers.push(match[1] as string);
  }
  return specifiers;
}

describe("shared globe module boundary", () => {
  const sources = readdirSync(globeDir).filter(
    (file) => /\.(?:ts|tsx)$/u.test(file) && !/\.test\.tsx?$/u.test(file),
  );

  it("contains the sphere shell, its hook and the decorative composition", () => {
    expect(sources).toEqual(
      expect.arrayContaining(["DecorativeGlobe.tsx", "GlobeShell.tsx", "useSvgGlobe.ts"]),
    );
  });

  it("imports only React, motion, d3 geo/selection, topojson and the static world data", () => {
    for (const file of sources) {
      const source = readFileSync(join(globeDir, file), "utf8");
      for (const specifier of importSpecifiers(source)) {
        expect(
          ALLOWED_SPECIFIERS.some((pattern) => pattern.test(specifier)),
          `${file} imports "${specifier}"`,
        ).toBe(true);
      }
    }
  });
});
