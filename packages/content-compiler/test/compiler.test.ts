import { describe, it, expect } from "vitest";
import { Compiler } from "../src/index.js";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

function createFixtureDir(): { path: string; cleanup: () => void } {
  const dir = resolve(tmpdir(), `bw-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return {
    path: dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function writeFixture(base: string, rel: string, content: string): string {
  const full = resolve(base, rel);
  mkdirSync(resolve(full, ".."), { recursive: true });
  writeFileSync(full, content, "utf8");
  return full;
}

/** A strict-NationSchema-compliant nation as a single YAML list item. */
function nationYaml(id: string, tag: string, name: string, isPlayable = false): string {
  return `
- id: "${id}"
  tag: "${tag}"
  name: "${name}"
  displayNameKey: "nation.${id}"
  isPlayable: ${isPlayable}
  slot: null
  presentation: { colorBg: "#C8102E", colorFg: "#FFFFFF" }
  identity:
    oneSentence: "x"
    fullIdentity: "x"
    strategicProblem: "x"
  regime:
    type: "monarchy"
    politicalSystem: "constitutional_monarchy"
    headOfState: "x"
    headOfGovernment: "x"
    leaderTitle: "x"
    navalPolicyActors: []
    governmentModifiers: []
    stabilityProfile: { level: "high", factors: [] }
    description: "x"
  strategicObjectives: { primary: "x", secondary: "x" }
  baseResources:
    gdpTier: "great_power"
    gdpDescription: "x"
    population: "x"
    industrialization: "industrial"
    industrializationDescription: "x"
  navalAppropriation: { budgetLevel: "moderate", justification: "x" }
  economy:
    description: "x"
    character: "x"
    strengths: []
    weaknesses: []
    industrialBase: "mature_global"
  navalInstitution:
    description: "x"
    character: []
    seniority: "senior_service"
  doctrine: { summary: "x", schools: [] }
  shipDesign: { summary: "x", principles: [], favoredTypes: [] }
  ai: { archetype: "status_quo_maritime_hegemon", behavior: [] }
  navalPurpose: "sustain_global_empire"
  coreAnxiety: "loss_of_sea_control_overstretch"
  gameplayFeel: "manage_supremacy"
  historicalAssumptions: []
`;
}

describe("Compiler", () => {
  it("compiles a valid content pack", () => {
    const fixture = createFixtureDir();
    try {
      writeFixture(
        fixture.path,
        "pack.json",
        JSON.stringify({
          name: "test-pack",
          version: "0.1.0",
          type: "fixture",
          files: {
            countries: ["countries.yaml"],
            areas: ["areas.yaml"],
            rulesets: ["rulesets.yaml"],
          },
        }),
      );

      writeFixture(fixture.path, "countries.yaml", nationYaml("uk", "GBR", "United Kingdom", true));

      writeFixture(
        fixture.path,
        "areas.yaml",
        `
- id: "lon"
  name: "London"
  type: "land"
  controller: "uk"
      `,
      );

      writeFixture(
        fixture.path,
        "rulesets.yaml",
        `
- id: "core"
  name: "Core Rules"
  version: "1.0"
      `,
      );

      const compiler = new Compiler();
      const collector = new DiagnosticCollector();
      const signal = new AbortController().signal;

      const output = compiler.compile(
        {
          manifestPath: "pack.json",
          contentDir: fixture.path,
          rulesetFiles: [resolve(fixture.path, "rulesets.yaml")],
          countryFiles: [resolve(fixture.path, "countries.yaml")],
          areaFiles: [resolve(fixture.path, "areas.yaml")],
          routeFiles: [],
          possessionFiles: [],
          portFiles: [],
          technologyFiles: [],
        },
        signal,
        collector,
      );

      expect(output).toBeDefined();
      expect(output!.pack.nations).toHaveLength(1);
      expect(output!.pack.nations[0]?.id).toBe("uk");
      expect(output!.rawHash).toHaveLength(64);
      expect(output!.envelopeHash).toHaveLength(64);
      expect(collector.hasErrors).toBe(false);
    } finally {
      fixture.cleanup();
    }
  });

  it("detects duplicate IDs", () => {
    const fixture = createFixtureDir();
    try {
      writeFixture(
        fixture.path,
        "pack.json",
        JSON.stringify({
          name: "test-pack",
          version: "0.1.0",
          type: "fixture",
          files: { countries: ["countries.yaml"] },
        }),
      );

      writeFixture(
        fixture.path,
        "countries.yaml",
        `${nationYaml("uk", "GBR", "United Kingdom")}${nationYaml("uk", "GBR", "United Kingdom")}`,
      );

      const compiler = new Compiler();
      const collector = new DiagnosticCollector();
      const signal = new AbortController().signal;

      const output = compiler.compile(
        {
          manifestPath: "pack.json",
          contentDir: fixture.path,
          rulesetFiles: [],
          countryFiles: [resolve(fixture.path, "countries.yaml")],
          areaFiles: [],
          routeFiles: [],
          possessionFiles: [],
          portFiles: [],
          technologyFiles: [],
        },
        signal,
        collector,
      );

      expect(output).toBeUndefined();
      expect(collector.hasErrors).toBe(true);
      expect(collector.errors.some((d) => d.code === "DUP-ID")).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  it("detects missing references", () => {
    const fixture = createFixtureDir();
    try {
      writeFixture(
        fixture.path,
        "pack.json",
        JSON.stringify({
          name: "test-pack",
          version: "0.1.0",
          type: "fixture",
          files: {
            possessions: ["possessions.yaml"],
            countries: ["countries.yaml"],
            areas: ["areas.yaml"],
          },
        }),
      );

      writeFixture(fixture.path, "countries.yaml", nationYaml("uk", "GBR", "United Kingdom"));
      writeFixture(fixture.path, "areas.yaml", `- id: "lon"\n  name: "London"\n  type: "land"\n`);
      writeFixture(
        fixture.path,
        "possessions.yaml",
        `- id: "uk-lon"\n  nationId: "uk"\n  areaId: "nonexistent"\n`,
      );

      const compiler = new Compiler();
      const collector = new DiagnosticCollector();
      const signal = new AbortController().signal;

      const output = compiler.compile(
        {
          manifestPath: "pack.json",
          contentDir: fixture.path,
          rulesetFiles: [],
          countryFiles: [resolve(fixture.path, "countries.yaml")],
          areaFiles: [resolve(fixture.path, "areas.yaml")],
          routeFiles: [],
          possessionFiles: [resolve(fixture.path, "possessions.yaml")],
          portFiles: [],
          technologyFiles: [],
        },
        signal,
        collector,
      );

      expect(output).toBeUndefined();
      expect(collector.hasErrors).toBe(true);
      expect(collector.errors.some((d) => d.code === "REF")).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  it("produces deterministic output on repeated compilation", () => {
    const fixture = createFixtureDir();
    try {
      writeFixture(
        fixture.path,
        "pack.json",
        JSON.stringify({
          name: "test-pack",
          version: "0.1.0",
          type: "fixture",
          files: { countries: ["countries.yaml"] },
        }),
      );

      writeFixture(fixture.path, "countries.yaml", nationYaml("uk", "GBR", "United Kingdom"));

      const compiler = new Compiler();
      const signal = new AbortController().signal;

      const collector1 = new DiagnosticCollector();
      const output1 = compiler.compile(
        {
          manifestPath: "pack.json",
          contentDir: fixture.path,
          rulesetFiles: [],
          countryFiles: [resolve(fixture.path, "countries.yaml")],
          areaFiles: [],
          routeFiles: [],
          possessionFiles: [],
          portFiles: [],
          technologyFiles: [],
        },
        signal,
        collector1,
      );

      const collector2 = new DiagnosticCollector();
      const output2 = compiler.compile(
        {
          manifestPath: "pack.json",
          contentDir: fixture.path,
          rulesetFiles: [],
          countryFiles: [resolve(fixture.path, "countries.yaml")],
          areaFiles: [],
          routeFiles: [],
          possessionFiles: [],
          portFiles: [],
          technologyFiles: [],
        },
        signal,
        collector2,
      );

      expect(output1).toBeDefined();
      expect(output2).toBeDefined();
      expect(output1!.rawHash).toBe(output2!.rawHash);
      expect(output1!.envelopeHash).toBe(output2!.envelopeHash);
    } finally {
      fixture.cleanup();
    }
  });

  it("supports cancellation via AbortSignal", () => {
    const fixture = createFixtureDir();
    try {
      writeFixture(
        fixture.path,
        "pack.json",
        JSON.stringify({
          name: "test-pack",
          version: "0.1.0",
          type: "fixture",
          files: { countries: ["countries.yaml"] },
        }),
      );

      writeFixture(fixture.path, "countries.yaml", nationYaml("uk", "GBR", "United Kingdom"));

      const compiler = new Compiler();
      const collector = new DiagnosticCollector();
      const controller = new AbortController();
      controller.abort();

      const output = compiler.compile(
        {
          manifestPath: "pack.json",
          contentDir: fixture.path,
          rulesetFiles: [],
          countryFiles: [resolve(fixture.path, "countries.yaml")],
          areaFiles: [],
          routeFiles: [],
          possessionFiles: [],
          portFiles: [],
          technologyFiles: [],
        },
        controller.signal,
        collector,
      );

      expect(output).toBeUndefined();
    } finally {
      fixture.cleanup();
    }
  });

  it("detects technology prerequisite cycle with TECHNOLOGY_PREREQUISITE_CYCLE", () => {
    const fixture = createFixtureDir();
    try {
      writeFixture(
        fixture.path,
        "pack.json",
        JSON.stringify({
          name: "test-pack",
          version: "0.1.0",
          type: "fixture",
          files: { technologies: ["technologies.yaml"] },
        }),
      );

      writeFixture(
        fixture.path,
        "technologies.yaml",
        `
- id: "tech_a"
  name: "Tech A"
  category: "hull"
  researchFieldId: "HULL_CONSTRUCTION"
- id: "tech_b"
  name: "Tech B"
  category: "hull"
  researchFieldId: "HULL_CONSTRUCTION"
  prerequisites:
    - { techId: "tech_c" }
- id: "tech_c"
  name: "Tech C"
  category: "hull"
  researchFieldId: "HULL_CONSTRUCTION"
  prerequisites:
    - { techId: "tech_b" }
      `,
      );

      const compiler = new Compiler();
      const collector = new DiagnosticCollector();
      const signal = new AbortController().signal;

      const output = compiler.compile(
        {
          manifestPath: "pack.json",
          contentDir: fixture.path,
          rulesetFiles: [],
          countryFiles: [],
          areaFiles: [],
          routeFiles: [],
          possessionFiles: [],
          portFiles: [],
          technologyFiles: [resolve(fixture.path, "technologies.yaml")],
        },
        signal,
        collector,
      );

      expect(output).toBeUndefined();
      expect(collector.hasErrors).toBe(true);
      expect(collector.errors.some((d) => d.code === "TECHNOLOGY_PREREQUISITE_CYCLE")).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });
});
