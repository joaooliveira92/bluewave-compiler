import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { runCompilation } from "../src/main/compiler.js";

const FIXTURE_FILES: Record<string, string> = {
  "pack.json": JSON.stringify({
    name: "1880-test-scenario",
    version: "0.1.0",
    type: "fixture",
    files: {
      rulesets: ["rulesets.yaml"],
      countries: ["countries.yaml"],
      areas: ["areas.yaml"],
      routes: ["routes.yaml"],
      possessions: ["possessions.yaml"],
      ports: ["ports.yaml"],
      technologies: ["technologies.yaml"],
      fleets: ["fleets.yaml"],
      economies: ["economies.yaml"],
      constructions: ["constructions.yaml"],
      diplomacy: ["diplomacy.yaml"],
      research: ["research.yaml"],
    },
  }),
  "rulesets.yaml": `- id: "core"\n  name: "Core Rules"\n  version: "1.0"\n`,
  "countries.yaml": `- id: "GBR"\n  name: "United Kingdom"\n  tag: "GBR"\n- id: "FRA"\n  name: "France"\n  tag: "FRA"\n`,
  "areas.yaml": `- id: "lon"\n  name: "London"\n  type: "land"\n  controller: "GBR"\n- id: "par"\n  name: "Paris"\n  type: "land"\n  controller: "FRA"\n- id: "eng_ch"\n  name: "English Channel"\n  type: "sea"\n`,
  "routes.yaml": `- id: "lon-par"\n  from: "lon"\n  to: "par"\n  type: "sea"\n  distance: 300\n- id: "lon-eng_ch"\n  from: "lon"\n  to: "eng_ch"\n  type: "sea"\n  distance: 50\n- id: "par-eng_ch"\n  from: "par"\n  to: "eng_ch"\n  type: "sea"\n  distance: 100\n`,
  "possessions.yaml": `- id: "gbr-lon"\n  countryId: "GBR"\n  areaId: "lon"\n- id: "fra-par"\n  countryId: "FRA"\n  areaId: "par"\n`,
  "ports.yaml": `- id: "port-lon"\n  name: "Port of London"\n  areaId: "lon"\n  countryId: "GBR"\n  level: 5\n- id: "port-par"\n  name: "Port of Paris"\n  areaId: "par"\n  countryId: "FRA"\n  level: 3\n`,
  "technologies.yaml": `- id: "basic_steam"\n  name: "Basic Steam Turbine"\n  category: "propulsion"\n  cost: 100\n  year: 1880\n`,
  "fleets.yaml": `- id: "fleet-gbr-home"\n  nationId: "GBR"\n  name: "Home Fleet"\n  locationAreaId: "lon"\n  ships:\n    - id: "ship-hms-dreadnought"\n      name: "HMS Dreadnought"\n      classId: "battleship"\n      hitPoints: 100\n      maxHitPoints: 100\n      speed: 21\n      firepower: 10\n      armor: 12\n      isUnderConstruction: false\n      constructionProgress: 0\n      constructionTotalWork: 0\n- id: "fleet-fra-atlantic"\n  nationId: "FRA"\n  name: "Atlantic Fleet"\n  locationAreaId: "par"\n  ships:\n    - id: "ship-fs-courbet"\n      name: "FS Courbet"\n      classId: "battleship"\n      hitPoints: 90\n      maxHitPoints: 90\n      speed: 20\n      firepower: 9\n      armor: 11\n      isUnderConstruction: false\n      constructionProgress: 0\n      constructionTotalWork: 0\n`,
  "economies.yaml": `- nationId: "GBR"\n  treasury: 800\n  income: 150\n  expenses: 75\n- nationId: "FRA"\n  treasury: 600\n  income: 120\n  expenses: 60\n`,
  "constructions.yaml": `- id: "con-gbr-ship-battleship2"\n  nationId: "GBR"\n  type: "ship"\n  targetId: "ship-hms-thunderer"\n  totalWork: 200\n  completedWork: 50\n  startedAt: "1880-01"\n`,
  "diplomacy.yaml": `- nationA: "GBR"\n  nationB: "FRA"\n  relation: "neutral"\n  since: "1880-01"\n`,
  "research.yaml": `- nationId: "GBR"\n  currentProjectTechId: "basic_steam"\n  technologies:\n    - { techId: "basic_steam", investedPoints: 30, completed: false }\n- nationId: "FRA"\n  technologies: []\n`,
};

function writeFixture(dir: string): void {
  for (const [name, content] of Object.entries(FIXTURE_FILES)) {
    writeFileSync(resolve(dir, name), content, "utf8");
  }
}

describe("compiler module", () => {
  let fixtureDir: string;

  beforeAll(() => {
    fixtureDir = mkdtempSync(resolve(tmpdir(), "bw-desktop-test-"));
    mkdirSync(fixtureDir, { recursive: true });
    writeFixture(fixtureDir);
  });

  afterAll(() => {
    rmSync(fixtureDir, { recursive: true, force: true });
  });

  it("finds YAML files in a directory", () => {
    const files = findYamlFiles(fixtureDir);
    expect(files.length).toBeGreaterThan(0);
    const names = files.map((f) => f.name);
    expect(names).toContain("rulesets.yaml");
    expect(names).toContain("countries.yaml");
  });

  it("compiles a valid fixture successfully", () => {
    const signal = new AbortController().signal;
    const result = runCompilation(fixtureDir, signal);
    expect(result.success).toBe(true);
    expect(result.snapshotHash).toBeDefined();
    expect(result.contentArtifactHash).toBeDefined();
    expect(result.nations).toBeDefined();
    expect(result.nations!.length).toBeGreaterThan(0);
    expect(result.diagnostics).toEqual([]);
  });

  it("returns an error for a non-existent directory", () => {
    const signal = new AbortController().signal;
    const result = runCompilation("/nonexistent/path", signal);
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("returns diagnostics for invalid fixture", () => {
    const badDir = mkdtempSync(resolve(tmpdir(), "bw-desktop-bad-"));
    mkdirSync(badDir, { recursive: true });
    writeFileSync(resolve(badDir, "pack.json"), JSON.stringify({ name: "bad", version: "1", type: "fixture", files: {} }), "utf8");

    const signal = new AbortController().signal;
    const result = runCompilation(badDir, signal);
    expect(result.success).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);

    rmSync(badDir, { recursive: true, force: true });
  });

  it("aborts when signal is already aborted", () => {
    const controller = new AbortController();
    controller.abort();
    const result = runCompilation(fixtureDir, controller.signal);
    expect(result.success).toBe(false);
    expect(result.error).toContain("aborted");
  });
});