import { describe, it, expect, afterEach } from "vite-plus/test";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { runContentCheck, runContentBuild } from "../src/commands.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const contentDir = resolve(repoRoot, "content", "production", "1880");
const manifest = resolve(contentDir, "pack.json");

const tempDirs: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(resolve(tmpdir(), "bw-content-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("content:check / content:build over the production pack", () => {
  it("content:check validates the whole surface and writes nothing", () => {
    const out = tempDir();
    expect(runContentCheck({ manifest, contentDir, outputDir: out, outputMode: "json" })).toBe(
      "success",
    );
    expect(readdirSync(out)).toHaveLength(0);
  });

  it("content:build emits one hash-pinned artifact covering both surfaces", () => {
    const out = tempDir();
    expect(runContentBuild({ manifest, contentDir, outputDir: out, outputMode: "human" })).toBe(
      "success",
    );

    const artifactPath = resolve(out, "content-artifact.json");
    const manifestPath = resolve(out, "content-manifest.json");
    expect(existsSync(artifactPath)).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);

    const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as Record<string, unknown>;
    expect(Array.isArray(artifact["nations"])).toBe(true);
    expect(Array.isArray(artifact["technologies"])).toBe(true);
    expect(typeof artifact["generatedBy"]).toBe("string");

    const shipBuilding = artifact["shipBuilding"] as Record<string, unknown>;
    expect(shipBuilding).toBeDefined();
    for (const key of ["components", "plants", "hullForms", "navalProfiles", "referenceDesigns"]) {
      expect(Array.isArray(shipBuilding[key])).toBe(true);
      expect((shipBuilding[key] as unknown[]).length).toBeGreaterThan(0);
    }
    const armament = shipBuilding["armament"] as Record<string, unknown>;
    for (const key of ["gunFamilies", "gunModels", "gunMounts", "ammunition"]) {
      expect((armament[key] as unknown[]).length).toBeGreaterThan(0);
    }

    const campaign = artifact["campaign"] as Record<string, unknown>;
    expect(campaign).toBeDefined();
    for (const key of ["fleets", "economies", "constructions", "research", "designs"]) {
      expect(Array.isArray(campaign[key])).toBe(true);
      expect((campaign[key] as unknown[]).length).toBeGreaterThan(0);
    }

    const manifestJson = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    expect(manifestJson["contentVersion"]).toBe("0.4.0");
    expect(typeof manifestJson["doNotEdit"]).toBe("string");
    expect(typeof manifestJson["bodyHash"]).toBe("string");
  });

  it("two builds over unchanged content are byte-identical", () => {
    const out1 = tempDir();
    const out2 = tempDir();
    runContentBuild({ manifest, contentDir, outputDir: out1, outputMode: "json" });
    runContentBuild({ manifest, contentDir, outputDir: out2, outputMode: "json" });
    expect(readFileSync(resolve(out1, "content-artifact.json"), "utf8")).toBe(
      readFileSync(resolve(out2, "content-artifact.json"), "utf8"),
    );
    expect(readFileSync(resolve(out1, "content-manifest.json"), "utf8")).toBe(
      readFileSync(resolve(out2, "content-manifest.json"), "utf8"),
    );
  });

  it("content:check and content:build reject a broken pack the same way", () => {
    const broken = tempDir();
    cpSync(contentDir, broken, { recursive: true });
    const brokenManifest = resolve(broken, "pack.json");
    const referenceDir = resolve(broken, "ship-building", "reference-designs", "uk");
    writeFileSync(
      resolve(referenceDir, "starters.yaml"),
      `
designs:
  - id: "rd_broken"
    name: "Broken"
    month: "1880-01"
    draft:
      hull: { hullFormId: "does_not_exist" }
      machinery: { plantId: "does_not_exist" }
`,
      "utf8",
    );
    const checkOut = tempDir();
    expect(
      runContentCheck({
        manifest: brokenManifest,
        contentDir: broken,
        outputDir: checkOut,
        outputMode: "json",
      }),
    ).toBe("validation-error");
    expect(
      runContentBuild({
        manifest: brokenManifest,
        contentDir: broken,
        outputDir: tempDir(),
        outputMode: "json",
      }),
    ).toBe("validation-error");
  });
});
