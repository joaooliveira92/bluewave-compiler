import { describe, it, expect } from "vitest";
import { CampaignCompiler } from "../src/index.js";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

function createFixtureDir(): { path: string; cleanup: () => void } {
  const dir = resolve(tmpdir(), `bw-campaign-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return {
    path: dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function writeFile(base: string, rel: string, content: string): void {
  const full = resolve(base, rel);
  mkdirSync(resolve(full, ".."), { recursive: true });
  writeFileSync(full, content, "utf8");
}

const FIXTURE = {
  pack: JSON.stringify({
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
    },
  }),

  rulesets: `
- id: "core"
  name: "Core Rules"
  version: "1.0"
`,

  countries: `
- id: "GBR"
  name: "United Kingdom"
  tag: "GBR"
- id: "FRA"
  name: "France"
  tag: "FRA"
`,

  areas: `
- id: "lon"
  name: "London"
  type: "land"
  controller: "GBR"
- id: "par"
  name: "Paris"
  type: "land"
  controller: "FRA"
- id: "eng_ch"
  name: "English Channel"
  type: "sea"
`,

  routes: `
- id: "lon-par"
  from: "lon"
  to: "par"
  type: "sea"
  distance: 300
- id: "lon-eng_ch"
  from: "lon"
  to: "eng_ch"
  type: "sea"
  distance: 50
- id: "par-eng_ch"
  from: "par"
  to: "eng_ch"
  type: "sea"
  distance: 100
`,

  possessions: `
- id: "gbr-lon"
  countryId: "GBR"
  areaId: "lon"
- id: "fra-par"
  countryId: "FRA"
  areaId: "par"
`,

  ports: `
- id: "port-lon"
  name: "Port of London"
  areaId: "lon"
  countryId: "GBR"
  level: 5
- id: "port-par"
  name: "Port of Paris"
  areaId: "par"
  countryId: "FRA"
  level: 3
`,

  technologies: `
- id: "basic_steam"
  name: "Basic Steam Turbine"
  category: "propulsion"
  cost: 100
  year: 1880
- id: "advanced_steam"
  name: "Advanced Steam Turbine"
  category: "propulsion"
  prerequisites:
    - { techId: "basic_steam" }
  cost: 200
  year: 1900
`,

  fleets: `
- id: "fleet-gbr-home"
  nationId: "GBR"
  name: "Home Fleet"
  locationAreaId: "lon"
  ships:
    - id: "ship-hms-dreadnought"
      name: "HMS Dreadnought"
      classId: "battleship"
      hitPoints: 100
      maxHitPoints: 100
      speed: 21
      firepower: 10
      armor: 12
      isUnderConstruction: false
      constructionProgress: 0
      constructionTotalWork: 0
    - id: "ship-hms-invincible"
      name: "HMS Invincible"
      classId: "battlecruiser"
      hitPoints: 80
      maxHitPoints: 80
      speed: 25
      firepower: 8
      armor: 6
      isUnderConstruction: false
      constructionProgress: 0
      constructionTotalWork: 0
- id: "fleet-fra-atlantic"
  nationId: "FRA"
  name: "Atlantic Fleet"
  locationAreaId: "par"
  ships:
    - id: "ship-fs-courbet"
      name: "FS Courbet"
      classId: "battleship"
      hitPoints: 90
      maxHitPoints: 90
      speed: 20
      firepower: 9
      armor: 11
      isUnderConstruction: false
      constructionProgress: 0
      constructionTotalWork: 0
`,

  economies: `
- nationId: "GBR"
  treasury: 800
  income: 150
  expenses: 75
- nationId: "FRA"
  treasury: 600
  income: 120
  expenses: 60
`,

  constructions: `
- id: "con-gbr-ship-battleship2"
  nationId: "GBR"
  type: "ship"
  targetId: "ship-hms-thunderer"
  totalWork: 200
  completedWork: 50
  startedAt: "1880-01"
`,

  diplomacy: `
- nationA: "GBR"
  nationB: "FRA"
  relation: "neutral"
  since: "1880-01"
`,

  research: `
- nationId: "GBR"
  currentProjectTechId: "basic_steam"
  technologies:
    - { techId: "basic_steam", investedPoints: 30, completed: false }
- nationId: "FRA"
  technologies: []
`,
};

describe("CampaignCompiler", () => {
  it("compiles a valid 1880 campaign fixture", () => {
    const fixture = createFixtureDir();
    try {
      writeFile(fixture.path, "pack.json", FIXTURE.pack);
      writeFile(fixture.path, "rulesets.yaml", FIXTURE.rulesets);
      writeFile(fixture.path, "countries.yaml", FIXTURE.countries);
      writeFile(fixture.path, "areas.yaml", FIXTURE.areas);
      writeFile(fixture.path, "routes.yaml", FIXTURE.routes);
      writeFile(fixture.path, "possessions.yaml", FIXTURE.possessions);
      writeFile(fixture.path, "ports.yaml", FIXTURE.ports);
      writeFile(fixture.path, "technologies.yaml", FIXTURE.technologies);
      writeFile(fixture.path, "fleets.yaml", FIXTURE.fleets);
      writeFile(fixture.path, "economies.yaml", FIXTURE.economies);
      writeFile(fixture.path, "constructions.yaml", FIXTURE.constructions);
      writeFile(fixture.path, "diplomacy.yaml", FIXTURE.diplomacy);
      writeFile(fixture.path, "research.yaml", FIXTURE.research);

      const compiler = new CampaignCompiler();
      const collector = new DiagnosticCollector();
      const signal = new AbortController().signal;

      const output = compiler.compile(
        {
          compilerInput: {
            manifestPath: "pack.json",
            contentDir: fixture.path,
            rulesetFiles: ["rulesets.yaml"],
            countryFiles: ["countries.yaml"],
            areaFiles: ["areas.yaml"],
            routeFiles: ["routes.yaml"],
            possessionFiles: ["possessions.yaml"],
            portFiles: ["ports.yaml"],
            technologyFiles: ["technologies.yaml"],
          },
          campaignFiles: {
            fleetFiles: ["fleets.yaml"],
            economyFiles: ["economies.yaml"],
            constructionFiles: ["constructions.yaml"],
            diplomacyFiles: ["diplomacy.yaml"],
            researchFiles: ["research.yaml"],
            designFiles: [],
          },
          rulesetVersion: "1.0",
          compatibilityVersion: "0.1.0",
        },
        signal,
        collector,
      );

      expect(collector.hasErrors).toBe(false);
      expect(output).toBeDefined();
      expect(output!.contentHash).toHaveLength(64);
      expect(output!.state.rawHash).toHaveLength(64);
      expect(output!.state.snapshot.turnNumber).toBe(0);
      expect(output!.state.snapshot.slots).toHaveLength(2);
      expect(output!.state.snapshot.slots[0]?.nationId).toBe("FRA");
      expect(output!.state.snapshot.slots[0]?.type).toBe("ai");
      expect(output!.state.snapshot.slots[1]?.nationId).toBe("GBR");
      expect(output!.state.snapshot.slots[1]?.type).toBe("playable");

      // Verify world state
      expect(output!.state.snapshot.world.areas).toHaveLength(3);
      expect(output!.state.snapshot.world.routes).toHaveLength(3);
      expect(output!.state.snapshot.world.ports).toHaveLength(2);

      // Verify nation states
      const nations = output!.state.snapshot.nations;
      expect(nations.size).toBe(2);

      const gbr = nations.get("GBR");
      expect(gbr).toBeDefined();
      expect(gbr!.treasury).toBe(800);
      expect(gbr!.income).toBe(150);
      expect(gbr!.expenses).toBe(75);
      expect(gbr!.fleets).toHaveLength(1);
      expect(gbr!.fleets[0]?.ships).toHaveLength(2);
      expect(gbr!.constructionProjects).toHaveLength(1);
      expect(gbr!.research.currentProjectTechId).toBe("basic_steam");
      expect(gbr!.research.technologies).toHaveLength(1);
      expect(gbr!.research.technologies[0]?.investedPoints).toBe(30);
      expect(gbr!.isPlayable).toBe(true);
      expect(gbr!.isAI).toBe(false);

      const fra = nations.get("FRA");
      expect(fra).toBeDefined();
      expect(fra!.treasury).toBe(600);
      expect(fra!.fleets).toHaveLength(1);
      expect(fra!.fleets[0]?.ships).toHaveLength(1);
      expect(fra!.isPlayable).toBe(false);
      expect(fra!.isAI).toBe(true);

      // Verify political state
      expect(output!.state.snapshot.politics.relations).toHaveLength(1);
      expect(output!.state.snapshot.politics.relations[0]?.relation).toBe("neutral");

      // Verify war state is empty initially
      expect(output!.state.snapshot.wars.wars).toHaveLength(0);
      expect(output!.state.snapshot.wars.battles).toHaveLength(0);

      // Verify intelligence shell
      expect(output!.state.snapshot.intelligence.shells).toEqual({});
    } finally {
      fixture.cleanup();
    }
  });

  it("produces deterministic output on repeated compilation", () => {
    const fixture = createFixtureDir();
    try {
      writeFile(fixture.path, "pack.json", FIXTURE.pack);
      writeFile(fixture.path, "rulesets.yaml", FIXTURE.rulesets);
      writeFile(fixture.path, "countries.yaml", FIXTURE.countries);
      writeFile(fixture.path, "areas.yaml", FIXTURE.areas);
      writeFile(fixture.path, "routes.yaml", FIXTURE.routes);
      writeFile(fixture.path, "possessions.yaml", FIXTURE.possessions);
      writeFile(fixture.path, "ports.yaml", FIXTURE.ports);
      writeFile(fixture.path, "technologies.yaml", FIXTURE.technologies);
      writeFile(fixture.path, "fleets.yaml", FIXTURE.fleets);
      writeFile(fixture.path, "economies.yaml", FIXTURE.economies);
      writeFile(fixture.path, "constructions.yaml", FIXTURE.constructions);
      writeFile(fixture.path, "diplomacy.yaml", FIXTURE.diplomacy);
      writeFile(fixture.path, "research.yaml", FIXTURE.research);

      const compiler = new CampaignCompiler();
      const signal = new AbortController().signal;

      const run = () => {
        const collector = new DiagnosticCollector();
        return compiler.compile(
          {
            compilerInput: {
              manifestPath: "pack.json",
              contentDir: fixture.path,
              rulesetFiles: ["rulesets.yaml"],
              countryFiles: ["countries.yaml"],
              areaFiles: ["areas.yaml"],
              routeFiles: ["routes.yaml"],
              possessionFiles: ["possessions.yaml"],
              portFiles: ["ports.yaml"],
              technologyFiles: ["technologies.yaml"],
            },
            campaignFiles: {
              fleetFiles: ["fleets.yaml"],
              economyFiles: ["economies.yaml"],
              constructionFiles: ["constructions.yaml"],
              diplomacyFiles: ["diplomacy.yaml"],
              researchFiles: ["research.yaml"],
              designFiles: [],
            },
            rulesetVersion: "1.0",
            compatibilityVersion: "0.1.0",
          },
          signal,
          collector,
        );
      };

      const out1 = run();
      const out2 = run();

      expect(out1).toBeDefined();
      expect(out2).toBeDefined();
      expect(out1!.state.rawHash).toBe(out2!.state.rawHash);
      expect(out1!.contentHash).toBe(out2!.contentHash);
    } finally {
      fixture.cleanup();
    }
  });

  it("reports missing nations as error", () => {
    const fixture = createFixtureDir();
    try {
      writeFile(
        fixture.path,
        "pack.json",
        JSON.stringify({
          name: "empty-test",
          version: "0.1.0",
          type: "fixture",
          files: {},
        }),
      );

      const compiler = new CampaignCompiler();
      const collector = new DiagnosticCollector();
      const signal = new AbortController().signal;

      const output = compiler.compile(
        {
          compilerInput: {
            manifestPath: "pack.json",
            contentDir: fixture.path,
            rulesetFiles: [],
            countryFiles: [],
            areaFiles: [],
            routeFiles: [],
            possessionFiles: [],
            portFiles: [],
            technologyFiles: [],
          },
          campaignFiles: {
            fleetFiles: [],
            economyFiles: [],
            constructionFiles: [],
            diplomacyFiles: [],
            researchFiles: [],
            designFiles: [],
          },
          rulesetVersion: "1.0",
          compatibilityVersion: "0.1.0",
        },
        signal,
        collector,
      );

      expect(output).toBeUndefined();
      // At minimum, the manifest should fail validation (no files)
    } finally {
      fixture.cleanup();
    }
  });

  it("supports cancellation", () => {
    const fixture = createFixtureDir();
    try {
      writeFile(fixture.path, "pack.json", FIXTURE.pack);
      writeFile(fixture.path, "countries.yaml", FIXTURE.countries);
      writeFile(fixture.path, "areas.yaml", FIXTURE.areas);
      writeFile(fixture.path, "fleets.yaml", FIXTURE.fleets);
      writeFile(fixture.path, "economies.yaml", FIXTURE.economies);

      const compiler = new CampaignCompiler();
      const collector = new DiagnosticCollector();
      const controller = new AbortController();
      controller.abort();

      const output = compiler.compile(
        {
          compilerInput: {
            manifestPath: "pack.json",
            contentDir: fixture.path,
            rulesetFiles: [],
            countryFiles: ["countries.yaml"],
            areaFiles: ["areas.yaml"],
            routeFiles: [],
            possessionFiles: [],
            portFiles: [],
            technologyFiles: [],
          },
          campaignFiles: {
            fleetFiles: ["fleets.yaml"],
            economyFiles: ["economies.yaml"],
            constructionFiles: [],
            diplomacyFiles: [],
            researchFiles: [],
            designFiles: [],
          },
          rulesetVersion: "1.0",
          compatibilityVersion: "0.1.0",
        },
        controller.signal,
        collector,
      );

      expect(output).toBeUndefined();
    } finally {
      fixture.cleanup();
    }
  });

  it("compiles design YAML templates into immutable CompiledDesignVersion records", () => {
    const fixture = createFixtureDir();
    try {
      writeFile(fixture.path, "pack.json", FIXTURE.pack);
      writeFile(fixture.path, "rulesets.yaml", FIXTURE.rulesets);
      writeFile(fixture.path, "countries.yaml", FIXTURE.countries);
      writeFile(fixture.path, "areas.yaml", FIXTURE.areas);
      writeFile(fixture.path, "routes.yaml", FIXTURE.routes);
      writeFile(fixture.path, "possessions.yaml", FIXTURE.possessions);
      writeFile(fixture.path, "ports.yaml", FIXTURE.ports);
      writeFile(fixture.path, "technologies.yaml", FIXTURE.technologies);
      writeFile(fixture.path, "fleets.yaml", FIXTURE.fleets);
      writeFile(fixture.path, "economies.yaml", FIXTURE.economies);
      writeFile(fixture.path, "constructions.yaml", FIXTURE.constructions);
      writeFile(fixture.path, "diplomacy.yaml", FIXTURE.diplomacy);
      writeFile(fixture.path, "research.yaml", FIXTURE.research);
      writeFile(
        fixture.path,
        "designs.yaml",
        `
- designId: "gbr-dreadnought-v1"
  designFamilyId: "dreadnought"
  nationId: "GBR"
  className: "Dreadnought-class"
  hullType: "battleship"
  displacementKg: 18000
  speedUms: 11
  armorBeltUm: 300
  mainGuns: { caliber: 305, count: 10, mounts: 5 }
  machineryType: "steam_turbine"
  hitPoints: 120
  crewComplement: 800
- designId: "fra-courbet-v1"
  designFamilyId: "courbet"
  nationId: "FRA"
  className: "Courbet-class"
  hullType: "battleship"
  displacementKg: 23000
  speedUms: 10
  armorBeltUm: 280
  mainGuns: { caliber: 305, count: 6, mounts: 6 }
  machineryType: "steam_turbine"
  hitPoints: 110
  crewComplement: 1085
        `,
      );

      const compiler = new CampaignCompiler();
      const collector = new DiagnosticCollector();
      const signal = new AbortController().signal;

      const output = compiler.compile(
        {
          compilerInput: {
            manifestPath: "pack.json",
            contentDir: fixture.path,
            rulesetFiles: ["rulesets.yaml"],
            countryFiles: ["countries.yaml"],
            areaFiles: ["areas.yaml"],
            routeFiles: ["routes.yaml"],
            possessionFiles: ["possessions.yaml"],
            portFiles: ["ports.yaml"],
            technologyFiles: ["technologies.yaml"],
          },
          campaignFiles: {
            fleetFiles: ["fleets.yaml"],
            economyFiles: ["economies.yaml"],
            constructionFiles: ["constructions.yaml"],
            diplomacyFiles: ["diplomacy.yaml"],
            researchFiles: ["research.yaml"],
            designFiles: ["designs.yaml"],
          },
          rulesetVersion: "1.0",
          compatibilityVersion: "0.1.0",
        },
        signal,
        collector,
      );

      expect(collector.hasErrors).toBe(false);
      expect(output).toBeDefined();

      const designs = output!.state.snapshot.designs;
      expect(designs.size).toBe(2);

      const dreadnought = designs.get("gbr-dreadnought-v1")!;
      expect(dreadnought.className).toBe("Dreadnought-class");
      expect(dreadnought.hullType).toBe("battleship");
      expect(dreadnought.normalizedDisplacementKg).toBe(18000);
      expect(dreadnought.normalizedSpeedUms).toBe(11);
      expect(dreadnought.normalizedArmorUm).toBe(300);
      expect(dreadnought.mainGunsCaliber).toBe(305);
      expect(dreadnought.mainGunsCount).toBe(10);
      expect(dreadnought.hitPoints).toBe(120);
      // Deterministic compiled hash, not authored.
      expect(dreadnought.compiledHash).toHaveLength(64);

      // Immutability keyed by designVersionId.
      expect(designs.get("fra-courbet-v1")!.nationId).toBe("FRA");
    } finally {
      fixture.cleanup();
    }
  });

  it("links initial fleet ships to compiled designs via designVersionId", () => {
    const fixture = createFixtureDir();
    try {
      writeFile(fixture.path, "pack.json", FIXTURE.pack);
      writeFile(fixture.path, "rulesets.yaml", FIXTURE.rulesets);
      writeFile(fixture.path, "countries.yaml", FIXTURE.countries);
      writeFile(fixture.path, "areas.yaml", FIXTURE.areas);
      writeFile(fixture.path, "routes.yaml", FIXTURE.routes);
      writeFile(fixture.path, "possessions.yaml", FIXTURE.possessions);
      writeFile(fixture.path, "ports.yaml", FIXTURE.ports);
      writeFile(fixture.path, "technologies.yaml", FIXTURE.technologies);
      writeFile(fixture.path, "economies.yaml", FIXTURE.economies);
      writeFile(fixture.path, "constructions.yaml", FIXTURE.constructions);
      writeFile(fixture.path, "diplomacy.yaml", FIXTURE.diplomacy);
      writeFile(fixture.path, "research.yaml", FIXTURE.research);
      writeFile(
        fixture.path,
        "designs.yaml",
        `
- designId: "gbr-dreadnought-v1"
  designFamilyId: "dreadnought"
  nationId: "GBR"
  className: "Dreadnought-class"
  hullType: "battleship"
  displacementKg: 18000
  speedUms: 11
  armorBeltUm: 300
  mainGuns: { caliber: 305, count: 10, mounts: 5 }
  machineryType: "steam_turbine"
  hitPoints: 120
  crewComplement: 800
        `,
      );
      writeFile(
        fixture.path,
        "fleets.yaml",
        `
- id: "fleet-gbr-home"
  nationId: "GBR"
  name: "Home Fleet"
  locationAreaId: "lon"
  ships:
    - id: "ship-hms-dreadnought"
      name: "HMS Dreadnought"
      designVersionId: "gbr-dreadnought-v1"
      classId: "battleship"
      hitPoints: 120
      maxHitPoints: 120
      speed: 11
      firepower: 10
      armor: 12
      isUnderConstruction: false
      constructionProgress: 0
      constructionTotalWork: 0
        `,
      );

      const compiler = new CampaignCompiler();
      const collector = new DiagnosticCollector();
      const signal = new AbortController().signal;

      const output = compiler.compile(
        {
          compilerInput: {
            manifestPath: "pack.json",
            contentDir: fixture.path,
            rulesetFiles: ["rulesets.yaml"],
            countryFiles: ["countries.yaml"],
            areaFiles: ["areas.yaml"],
            routeFiles: ["routes.yaml"],
            possessionFiles: ["possessions.yaml"],
            portFiles: ["ports.yaml"],
            technologyFiles: ["technologies.yaml"],
          },
          campaignFiles: {
            fleetFiles: ["fleets.yaml"],
            economyFiles: ["economies.yaml"],
            constructionFiles: ["constructions.yaml"],
            diplomacyFiles: ["diplomacy.yaml"],
            researchFiles: ["research.yaml"],
            designFiles: ["designs.yaml"],
          },
          rulesetVersion: "1.0",
          compatibilityVersion: "0.1.0",
        },
        signal,
        collector,
      );

      expect(collector.hasErrors).toBe(false);
      expect(output).toBeDefined();

      const gbr = output!.state.snapshot.nations.get("GBR")!;
      const ship = gbr.fleets[0]!.ships[0]!;
      // Links to the compiled design.
      expect(ship.designVersionId).toBe("gbr-dreadnought-v1");
      expect(output!.state.snapshot.designs.has("gbr-dreadnought-v1")).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });
});
