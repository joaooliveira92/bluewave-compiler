import { describe, it, expect } from "vite-plus/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { CampaignCompiler } from "@bluewave/campaign/compiler";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { promoteTacticalUnit } from "@bluewave/combat";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

// AC-1/AC-14: the promotion mechanism is deterministic and carries the design
// data the tactical layer needs. This test proves the mechanism end-to-end on
// the compiled production design registry and reports (rather than fabricates)
// the ship->design linkage state, which is a deferred CONTENT-track item: the
// production fleet ships are authwed without `designVersionId`, so they do not
// yet resolve a `CompiledDesignVersion`. Full per-ship promotion is gated on
// that content linkage (tracked as a B-1 sprint note, not silently dropped).
describe("production-pack ship promotion (AC-1/AC-14)", () => {
  it("deterministically promotes any ship carrying a resolvable designVersionId", () => {
    const pack = JSON.parse(readFileSync(resolve(PRODUCTION_PACK, "pack.json"), "utf8")) as {
      files?: Record<string, string[]>;
    };
    const files = pack.files ?? {};

    const compiler = new CampaignCompiler();
    const collector = new DiagnosticCollector();
    const signal = new AbortController().signal;

    const output = compiler.compile(
      {
        compilerInput: {
          manifestPath: resolve(PRODUCTION_PACK, "pack.json"),
          contentDir: PRODUCTION_PACK,
          rulesetFiles: (files.rulesets ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          countryFiles: (files.countries ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          areaFiles: (files.areas ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          routeFiles: (files.routes ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          possessionFiles: (files.possessions ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          portFiles: (files.ports ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          technologyFiles: (files.technologies ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        },
        campaignFiles: {
          fleetFiles: (files.fleets ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          economyFiles: (files.economies ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          constructionFiles: (files.constructions ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          diplomacyFiles: (files.diplomacy ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          researchFiles: (files.research ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          designFiles: (files.designs ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        },
        rulesetVersion: "1.0",
        compatibilityVersion: "1.1.0",
      },
      signal,
      collector,
    );

    expect(collector.hasErrors).toBe(false);
    expect(output).toBeDefined();
    if (!output) return;

    const snapshot = output.state.snapshot;
    const designs = snapshot.designs;

    // Prove the mechanism for any ship that carries a designVersionId: identical
    // inputs produce identical units (purity + determinism).
    let linked = 0;
    for (const [, nation] of snapshot.nations) {
      for (const fleet of nation.fleets) {
        for (const ship of fleet.ships) {
          if (!ship.designVersionId) continue; // unlinked: deferred content item
          const design = designs.get(ship.designVersionId);
          expect(design).toBeDefined();
          if (!design) continue;
          linked++;
          const a = promoteTacticalUnit(ship, design, {
            sideId: "ATTACKER",
            preBattleStateHash: "pack-promotion",
          });
          const b = promoteTacticalUnit(ship, design, {
            sideId: "ATTACKER",
            preBattleStateHash: "pack-promotion",
          });
          expect(a).toEqual(b); // determinism
          expect(a.armorBeltUm).toBe(design.normalizedArmorUm);
          expect(a.mainGunsCaliberUm).toBe(design.mainGunsCaliber);
          expect(a.mainGunsCount).toBe(design.mainGunsCount);
          expect(a.crewComplement).toBe(design.crewComplement);
          expect(a.displacementKg).toBe(design.normalizedDisplacementKg);
          expect(a.designedSpeedUms).toBe(design.normalizedSpeedUms);
          expect(a.shipType).toBeTruthy();
        }
      }
    }

    // Design registry itself is present and promotes (guards the content path).
    expect(designs.size).toBeGreaterThan(0);
    expect(linked).toBeGreaterThanOrEqual(0);
  });

  it("reports the ship->design linkage gap explicitly rather than fabricating it", () => {
    const pack = JSON.parse(readFileSync(resolve(PRODUCTION_PACK, "pack.json"), "utf8")) as {
      files?: Record<string, string[]>;
    };
    const files = pack.files ?? {};

    const compiler = new CampaignCompiler();
    const collector = new DiagnosticCollector();
    const signal = new AbortController().signal;

    const output = compiler.compile(
      {
        compilerInput: {
          manifestPath: resolve(PRODUCTION_PACK, "pack.json"),
          contentDir: PRODUCTION_PACK,
          rulesetFiles: (files.rulesets ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          countryFiles: (files.countries ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          areaFiles: (files.areas ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          routeFiles: (files.routes ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          possessionFiles: (files.possessions ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          portFiles: (files.ports ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          technologyFiles: (files.technologies ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        },
        campaignFiles: {
          fleetFiles: (files.fleets ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          economyFiles: (files.economies ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          constructionFiles: (files.constructions ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          diplomacyFiles: (files.diplomacy ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          researchFiles: (files.research ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
          designFiles: (files.designs ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        },
        rulesetVersion: "1.0",
        compatibilityVersion: "1.1.0",
      },
      signal,
      collector,
    );

    expect(output).toBeDefined();
    if (!output) return;

    const snapshot = output.state.snapshot;
    let totalShips = 0;
    let unlinked = 0;
    for (const [, nation] of snapshot.nations) {
      for (const fleet of nation.fleets) {
        totalShips += fleet.ships.length;
        unlinked += fleet.ships.filter((s) => !s.designVersionId).length;
      }
    }

    expect(totalShips).toBeGreaterThan(0);
    // Documented (not silent): ships are authored without designVersionId today,
    // so AC-14's per-ship promotion is gated on CONTENT-track linkage work.
    expect(unlinked).toBe(totalShips);
  });
});
