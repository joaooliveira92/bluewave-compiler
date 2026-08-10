import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

export interface FixtureDir {
  path: string;
  cleanup: () => void;
}

export function createFixtureDir(basePath: string): FixtureDir {
  mkdirSync(basePath, { recursive: true });
  return {
    path: basePath,
    cleanup: () => {
      rmSync(basePath, { recursive: true, force: true });
    },
  };
}

export function writeFixture(basePath: string, relativePath: string, content: string): string {
  const fullPath = resolve(basePath, relativePath);
  mkdirSync(resolve(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content, "utf8");
  return fullPath;
}

export const VALID_FIXTURE_MANIFEST = JSON.stringify({
  name: "test-pack",
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
});

export const VALID_COUNTRIES_YAML = `
- id: "GBR"
  name: "United Kingdom"
  tag: "GBR"
- id: "FRA"
  name: "France"
  tag: "FRA"
- id: "DEU"
  name: "Germany"
  tag: "DEU"
`;

export const VALID_AREAS_YAML = `
- id: "lon"
  name: "London"
  type: "land"
  controller: "GBR"
- id: "par"
  name: "Paris"
  type: "land"
  controller: "FRA"
- id: "ber"
  name: "Berlin"
  type: "land"
  controller: "DEU"
- id: "eng_ch"
  name: "English Channel"
  type: "sea"
- id: "north_sea"
  name: "North Sea"
  type: "sea"
`;

export const VALID_ROUTES_YAML = `
- id: "lon-par"
  from: "lon"
  to: "par"
  type: "sea"
  distance: 300
- id: "lon-ber"
  from: "lon"
  to: "ber"
  type: "sea"
  distance: 600
- id: "par-ber"
  from: "par"
  to: "ber"
  type: "land"
  distance: 800
`;

export const VALID_RULESETS_YAML = `
- id: "core"
  name: "Core Rules"
  version: "1.0"
`;

export const VALID_POSSESSIONS_YAML = `
- id: "gbr-lon"
  countryId: "GBR"
  areaId: "lon"
- id: "fra-par"
  countryId: "FRA"
  areaId: "par"
- id: "deu-ber"
  countryId: "DEU"
  areaId: "ber"
`;

export const VALID_PORTS_YAML = `
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
`;

export const VALID_TECHNOLOGIES_YAML = `
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
`;

export const INVALID_FIXTURES = {
  parseError: {
    name: "parse-error",
    manifest: JSON.stringify({
      name: "test-pack",
      version: "0.1.0",
      type: "fixture",
      files: { countries: ["bad.yaml"] },
    }),
    files: { "bad.yaml": "{ invalid yaml: " },
  },
  unknownField: {
    name: "unknown-field",
    manifest: JSON.stringify({
      name: "test-pack",
      version: "0.1.0",
      type: "fixture",
      files: { countries: ["countries.yaml"] },
    }),
    files: {
      "countries.yaml": '- id: "GBR"\n  name: "UK"\n  tag: "GBR"\n  unknownField: "something"\n',
    },
  },
  duplicateId: {
    name: "duplicate-id",
    manifest: JSON.stringify({
      name: "test-pack",
      version: "0.1.0",
      type: "fixture",
      files: { countries: ["countries.yaml"] },
    }),
    files: {
      "countries.yaml":
        '- id: "GBR"\n  name: "UK"\n  tag: "GBR"\n- id: "GBR"\n  name: "United Kingdom"\n  tag: "GBR"\n',
    },
  },
  missingReference: {
    name: "missing-ref",
    manifest: JSON.stringify({
      name: "test-pack",
      version: "0.1.0",
      type: "fixture",
      files: {
        possessions: ["possessions.yaml"],
        countries: ["countries.yaml"],
        areas: ["areas.yaml"],
      },
    }),
    files: {
      "countries.yaml": '- id: "GBR"\n  name: "UK"\n  tag: "GBR"\n',
      "areas.yaml": '- id: "lon"\n  name: "London"\n  type: "land"\n',
      "possessions.yaml": '- id: "gbr-lon"\n  countryId: "GBR"\n  areaId: "nonexistent"\n',
    },
  },
  excessiveSize: {
    name: "excessive-size",
    manifest: JSON.stringify({
      name: "test-pack",
      version: "0.1.0",
      type: "fixture",
      files: { countries: ["big.yaml"] },
    }),
    files: { "big.yaml": `- id: "big"\n  name: ${"x".repeat(12 * 1024 * 1024)}\n  tag: "BIG"\n` },
  },
};

export function createValidFixture(basePath: string): FixtureDir {
  const fixture = createFixtureDir(basePath);
  writeFixture(fixture.path, "pack.json", VALID_FIXTURE_MANIFEST);
  writeFixture(fixture.path, "rulesets.yaml", VALID_RULESETS_YAML);
  writeFixture(fixture.path, "countries.yaml", VALID_COUNTRIES_YAML);
  writeFixture(fixture.path, "areas.yaml", VALID_AREAS_YAML);
  writeFixture(fixture.path, "routes.yaml", VALID_ROUTES_YAML);
  writeFixture(fixture.path, "possessions.yaml", VALID_POSSESSIONS_YAML);
  writeFixture(fixture.path, "ports.yaml", VALID_PORTS_YAML);
  writeFixture(fixture.path, "technologies.yaml", VALID_TECHNOLOGIES_YAML);
  return fixture;
}

export function createInvalidFixture(basePath: string, name: string): FixtureDir | undefined {
  const entry = Object.values(INVALID_FIXTURES).find((f) => f.name === name);
  if (!entry) return undefined;

  const fixture = createFixtureDir(resolve(basePath, name));
  writeFixture(fixture.path, "pack.json", entry.manifest);
  for (const [file, content] of Object.entries(entry.files)) {
    writeFixture(fixture.path, file, content);
  }
  return fixture;
}
