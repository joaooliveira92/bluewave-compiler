// packages/campaign/src/compiler.ts
import type { ContentPack } from "@bluewave/content-schema";
import { DesignTemplateSchema, validateAgainstSchema } from "@bluewave/content-schema";
import type { CampaignState, CampaignSlot, CampaignSnapshot } from "./state.js";
import type {
  NationState,
  FleetState,
  Ship,
  ResearchState,
  TechnologyProgress,
  ConstructionProject,
  CompiledDesignVersion,
  DesignFamily,
} from "./state.js";
import type { WorldState, AreaData, RouteData, PortData } from "./state.js";
import type { WarState, WarDeclaration } from "./state.js";
import type { PoliticalState, DiplomaticRelation } from "./state.js";
import {
  DiagnosticCollector,
  type DiagnosticCollector as DiagnosticCollectorType,
} from "@bluewave/diagnostics";
import { Compiler, type CompilerInput } from "@bluewave/content-compiler";
import { canonicalSerialize, sha256Hex, createEnvelope } from "@bluewave/deterministic";
import { SafeInt } from "@bluewave/contracts";
import { readFileSync } from "node:fs";
import { resolve, relative, isAbsolute, sep } from "node:path";
import { parse } from "yaml";

export interface CampaignCompilerInput {
  compilerInput: CompilerInput;
  campaignFiles: CampaignFiles;
  rulesetVersion: string;
  compatibilityVersion: string;
}

export interface CampaignFiles {
  fleetFiles: string[];
  economyFiles: string[];
  constructionFiles: string[];
  diplomacyFiles: string[];
  researchFiles: string[];
  designFiles: string[];
}

export interface CampaignCompilerOutput {
  state: CampaignState;
  contentHash: string;
}

function toSafeInt(value: unknown): SafeInt {
  if (typeof value === "number") return SafeInt(value);
  return SafeInt(0);
}

function toSafeIntOpt(value: unknown, fallback: SafeInt): SafeInt {
  if (typeof value === "number") return SafeInt(value);
  return fallback;
}

function isInside(parentResolved: string, childResolved: string): boolean {
  const rel = relative(parentResolved, childResolved);
  if (!rel) return true; // same dir
  if (isAbsolute(rel)) return false;
  if (rel === ".." || rel.startsWith(`..${sep}`)) return false;
  return childResolved === parentResolved || childResolved.startsWith(parentResolved + sep);
}

function parseYamlFile(
  filePath: string,
  contentDir: string,
  collector: DiagnosticCollectorType,
): unknown[] | undefined {
  const contentDirResolved = resolve(contentDir);
  const fullPath = resolve(contentDirResolved, filePath);

  // secure: reject absolute escapes & traversal
  if (!isInside(contentDirResolved, fullPath)) {
    collector.addError("CAMPAIGN-PATH", `Path traversal rejected for campaign file: ${filePath}`, {
      stage: "campaign-compile",
    });
    return undefined;
  }

  try {
    const content = readFileSync(fullPath, "utf8");
    const doc = parse(content);
    if (Array.isArray(doc)) return doc;
    collector.addError("CAMPAIGN-PARSE", `Expected array in campaign file: ${filePath}`, {
      stage: "campaign-compile",
    });
    return undefined;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    collector.addError("CAMPAIGN-READ", `Failed to read campaign file ${filePath}: ${msg}`, {
      stage: "campaign-compile",
    });
    return undefined;
  }
}

export class CampaignCompiler {
  private contentCompiler: Compiler;

  constructor() {
    this.contentCompiler = new Compiler();
  }

  compile(
    input: CampaignCompilerInput,
    signal: AbortSignal,
    collector: DiagnosticCollectorType,
  ): CampaignCompilerOutput | undefined {
    if (signal.aborted) {
      collector.addInfo("ABORT", "Compilation aborted before content compilation");
      return undefined;
    }

    // Step 1: Run content compiler
    const contentCollector = new DiagnosticCollector();
    const contentOutput = this.contentCompiler.compile(
      input.compilerInput,
      signal,
      contentCollector,
    );

    for (const d of contentCollector.all) {
      collector.add(d);
    }

    if (!contentOutput) return undefined;
    if (signal.aborted) return undefined;

    const pack = contentOutput.pack;
    const contentDir = input.compilerInput.contentDir;

    // Step 2: Parse campaign-specific YAML
    const fleetsData = this.loadCampaignFiles(
      input.campaignFiles.fleetFiles,
      contentDir,
      collector,
      signal,
    );
    const economiesData = this.loadCampaignFiles(
      input.campaignFiles.economyFiles,
      contentDir,
      collector,
      signal,
    );
    const constructionsData = this.loadCampaignFiles(
      input.campaignFiles.constructionFiles,
      contentDir,
      collector,
      signal,
    );
    const diplomacyData = this.loadCampaignFiles(
      input.campaignFiles.diplomacyFiles,
      contentDir,
      collector,
      signal,
    );
    const researchData = this.loadCampaignFiles(
      input.campaignFiles.researchFiles,
      contentDir,
      collector,
      signal,
    );
    const designsData = this.loadCampaignFiles(
      input.campaignFiles.designFiles,
      contentDir,
      collector,
      signal,
    );

    if (collector.hasErrors || signal.aborted) return undefined;

    // Step 3: Build WorldState from content
    const world = this.buildWorldState(pack);

    // Step 4: Build nation states
    const nations = this.buildNationStates(
      pack,
      fleetsData,
      economiesData,
      constructionsData,
      researchData,
      collector,
    );
    if (!nations || signal.aborted) return undefined;

    // Step 5: Build war state
    const wars = this.buildWarState();

    // Step 6: Build political state
    const politics = this.buildPoliticalState(diplomacyData);

    // Step 6b: Build designs from design data
    const designs = this.buildDesignsFromData(designsData, collector);
    const designFamilies = this.buildDesignFamiliesFromData(designsData);

    // Validate fleet -> design link (immutable reference)
    if (designs.size > 0) {
      for (const [, nation] of nations) {
        for (const fleet of nation.fleets) {
          for (const ship of fleet.ships) {
            if (ship.designVersionId && !designs.has(ship.designVersionId)) {
              collector.addError(
                "CAMPAIGN-DESIGN",
                `Ship ${ship.id} references unknown designVersionId ${ship.designVersionId}`,
                { stage: "campaign-compile" },
              );
            }
          }
        }
      }
      if (collector.hasErrors) return undefined;
    }

    // Step 7: Determine slots - sorted for determinism
    const slots = this.buildSlots(pack);

    // Step 8: Build intelligence shell
    const intelligence = { shells: {} };

    // Step 9: Build snapshot
    const snapshot: CampaignSnapshot = {
      version: "0.1.0",
      turnNumber: SafeInt(0),
      campaignId: `campaign-${String((pack.manifest as Record<string, unknown>)["name"] ?? "unknown")}`,
      slots,
      world,
      nations,
      wars,
      politics,
      intelligence,
      designs,
      designFamilies,
      rulesetVersion: input.rulesetVersion,
      compatibilityVersion: input.compatibilityVersion,
    };

    if (signal.aborted) return undefined;

    const rawJson = canonicalSerialize(snapshot);
    const rawHash = sha256Hex(rawJson);
    const envelope = createEnvelope("campaign-snapshot", input.compatibilityVersion, snapshot);

    if (collector.hasErrors) return undefined;

    return {
      state: { snapshot, envelope, rawHash },
      contentHash: contentOutput.rawHash,
    };
  }

  private loadCampaignFiles(
    files: string[],
    contentDir: string,
    collector: DiagnosticCollectorType,
    signal?: AbortSignal,
  ): unknown[] {
    const all: unknown[] = [];
    for (const file of files) {
      if (signal?.aborted) break;
      const data = parseYamlFile(file, contentDir, collector);
      if (data) all.push(...data);
    }
    return all;
  }

  private buildSlots(pack: ContentPack): CampaignSlot[] {
    const slots: CampaignSlot[] = [];
    for (const country of pack.countries) {
      const countryRec = country as Record<string, unknown>;
      const id = countryRec["id"];
      if (typeof id === "string") {
        slots.push({ nationId: id, type: id === "GBR" ? "playable" : "ai" });
      }
    }
    // deterministic: alphabetical, ensures FRA before GBR regardless of file order
    slots.sort((a, b) => a.nationId.localeCompare(b.nationId));
    return slots;
  }

  private buildWorldState(pack: ContentPack): WorldState {
    const areas: AreaData[] = (pack.areas ?? [])
      .map((a: Record<string, unknown>) => ({
        id: String(a["id"] ?? ""),
        name: String(a["name"] ?? ""),
        type: (a["type"] as "land" | "sea" | "coastal") ?? "land",
        controller: typeof a["controller"] === "string" ? a["controller"] : undefined,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    const routes: RouteData[] = (pack.routes ?? [])
      .map((r: Record<string, unknown>) => ({
        id: String(r["id"] ?? ""),
        from: String(r["from"] ?? ""),
        to: String(r["to"] ?? ""),
        type: (r["type"] as "land" | "sea" | "rail") ?? "land",
        distance: toSafeInt(r["distance"]),
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    const ports: PortData[] = (pack.ports ?? [])
      .map((p: Record<string, unknown>) => ({
        id: String(p["id"] ?? ""),
        name: String(p["name"] ?? ""),
        areaId: String(p["areaId"] ?? ""),
        nationId: String(p["countryId"] ?? ""),
        level: toSafeIntOpt(p["level"], SafeInt(1)),
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    return { areas, routes, ports };
  }

  private buildNationStates(
    pack: ContentPack,
    fleetsData: unknown[],
    economiesData: unknown[],
    constructionsData: unknown[],
    researchData: unknown[],
    collector: DiagnosticCollectorType,
  ): Map<string, NationState> | undefined {
    const nations = new Map<string, NationState>();

    // sort countries for deterministic Map insertion / rawHash
    const sortedCountries = [...pack.countries].sort((a, b) =>
      String((a as Record<string, unknown>)["id"] ?? "").localeCompare(
        String((b as Record<string, unknown>)["id"] ?? ""),
      ),
    );

    for (const country of sortedCountries) {
      const countryRec = country as Record<string, unknown>;
      const id = String(countryRec["id"] ?? "");

      const fleets = this.buildFleets(fleetsData, id);
      const research = this.buildResearch(researchData, id);
      const constructions = this.buildConstructions(constructionsData, id);

      let treasury = SafeInt(500);
      let income = SafeInt(100);
      let expenses = SafeInt(50);

      for (const eco of economiesData) {
        const ecoRec = eco as Record<string, unknown>;
        if (ecoRec["nationId"] === id) {
          treasury = toSafeIntOpt(ecoRec["treasury"], SafeInt(500));
          income = toSafeIntOpt(ecoRec["income"], SafeInt(100));
          expenses = toSafeIntOpt(ecoRec["expenses"], SafeInt(50));
        }
      }

      nations.set(id, {
        id,
        name: String(countryRec["name"] ?? ""),
        tag: String(countryRec["tag"] ?? ""),
        treasury,
        income,
        expenses,
        baseResources: SafeInt(0),
        navalAppropriationRateBp: SafeInt(2000),
        maintenanceCost: SafeInt(0),
        fleets,
        research,
        constructionProjects: constructions,
        isPlayable: id === "GBR",
        isAI: id !== "GBR",
      });
    }

    if (nations.size === 0) {
      collector.addError("CAMPAIGN", "No nations found in content pack", {
        stage: "campaign-compile",
      });
      return undefined;
    }

    return nations;
  }

  private buildFleets(fleetsData: unknown[], nationId: string): FleetState[] {
    return fleetsData
      .filter((f) => (f as Record<string, unknown>)["nationId"] === nationId)
      .map((f) => {
        const fRec = f as Record<string, unknown>;
        return {
          id: String(fRec["id"] ?? ""),
          nationId: String(fRec["nationId"] ?? ""),
          name: String(fRec["name"] ?? ""),
          locationAreaId: String(fRec["locationAreaId"] ?? ""),
          ships: this.buildShips(fRec),
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  private buildShips(fleet: Record<string, unknown>): Ship[] {
    const shipsRaw = fleet["ships"];
    if (!Array.isArray(shipsRaw)) return [];
    const nationId = String(fleet["nationId"] ?? "");
    const locationAreaId = String(fleet["locationAreaId"] ?? "");

    return shipsRaw
      .map((s: Record<string, unknown>) => ({
        id: String(s["id"] ?? ""),
        name: String(s["name"] ?? ""),
        classId: String(s["classId"] ?? ""),
        nationId,
        locationAreaId,
        designVersionId: String(s["designVersionId"] ?? ""),
        hitPoints: toSafeIntOpt(s["hitPoints"], SafeInt(100)),
        maxHitPoints: toSafeIntOpt(s["maxHitPoints"], SafeInt(100)),
        speed: toSafeIntOpt(s["speed"], SafeInt(10)),
        firepower: toSafeIntOpt(s["firepower"], SafeInt(10)),
        armor: toSafeIntOpt(s["armor"], SafeInt(10)),
        isUnderConstruction: s["isUnderConstruction"] === true,
        constructionProgress: toSafeIntOpt(s["constructionProgress"], SafeInt(0)),
        constructionTotalWork: toSafeIntOpt(s["constructionTotalWork"], SafeInt(0)),
        inBattleId: typeof s["inBattleId"] === "string" ? s["inBattleId"] : undefined,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  private buildResearch(researchData: unknown[], nationId: string): ResearchState {
    const nationResearch = researchData.find(
      (r) => (r as Record<string, unknown>)["nationId"] === nationId,
    ) as Record<string, unknown> | undefined;

    if (!nationResearch)
      return {
        nationId,
        technologies: [],
        fieldPriorities: {},
        researchBudget: SafeInt(0),
        activeCandidates: new Map(),
        discoveredTechs: [],
      };

    const techs: TechnologyProgress[] = [];
    const techsRaw = nationResearch["technologies"];
    if (Array.isArray(techsRaw)) {
      for (const t of techsRaw) {
        const tRec = t as Record<string, unknown>;
        techs.push({
          techId: String(tRec["techId"] ?? ""),
          investedPoints: toSafeIntOpt(tRec["investedPoints"], SafeInt(0)),
          completed: tRec["completed"] === true,
        });
      }
    }

    const fieldPriorities: Record<string, SafeInt> = {};
    const fieldPrioritiesRaw = nationResearch["fieldPriorities"];
    if (fieldPrioritiesRaw && typeof fieldPrioritiesRaw === "object") {
      for (const [key, val] of Object.entries(fieldPrioritiesRaw as Record<string, unknown>)) {
        fieldPriorities[key] = toSafeIntOpt(val, SafeInt(1));
      }
    }

    const activeCandidatesRaw = nationResearch["activeCandidates"];
    const activeCandidates = new Map<string, string>();
    if (activeCandidatesRaw && typeof activeCandidatesRaw === "object") {
      for (const [key, val] of Object.entries(activeCandidatesRaw as Record<string, unknown>)) {
        if (typeof val === "string") {
          activeCandidates.set(key, val);
        }
      }
    }

    const discoveredTechsRaw = nationResearch["discoveredTechs"];
    const discoveredTechs: string[] = [];
    if (Array.isArray(discoveredTechsRaw)) {
      for (const t of discoveredTechsRaw) {
        discoveredTechs.push(String(t));
      }
    }

    return {
      nationId,
      technologies: techs,
      currentProjectTechId:
        typeof nationResearch["currentProjectTechId"] === "string"
          ? nationResearch["currentProjectTechId"]
          : undefined,
      fieldPriorities,
      researchBudget: toSafeIntOpt(nationResearch["researchBudget"], SafeInt(0)),
      activeCandidates,
      discoveredTechs,
    };
  }

  private buildConstructions(
    constructionsData: unknown[],
    nationId: string,
  ): ConstructionProject[] {
    return constructionsData
      .filter((c) => (c as Record<string, unknown>)["nationId"] === nationId)
      .map((c) => {
        const cRec = c as Record<string, unknown>;
        return {
          id: String(cRec["id"] ?? ""),
          type: (cRec["type"] as "ship" | "building" | "technology") ?? "ship",
          projectType: "NEW_CONSTRUCTION" as const,
          targetId: String(cRec["targetId"] ?? ""),
          designVersionId: String(cRec["designVersionId"] ?? ""),
          totalWork: toSafeIntOpt(cRec["totalWork"], SafeInt(100)),
          completedWork: toSafeIntOpt(cRec["completedWork"], SafeInt(0)),
          paidWork: toSafeIntOpt(cRec["paidWork"], SafeInt(0)),
          status:
            (cRec["status"] as "PLANNED" | "AUTHORIZED" | "ACTIVE" | "COMPLETED") ?? "PLANNED",
          startedAt: String(cRec["startedAt"] ?? "1880-01"),
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  private buildWarState(): WarState {
    return { wars: [], battles: [] };
  }

  private buildPoliticalState(diplomacyData: unknown[]): PoliticalState {
    const relations: DiplomaticRelation[] = diplomacyData
      .map((r) => {
        const rRec = r as Record<string, unknown>;
        return {
          nationA: String(rRec["nationA"] ?? ""),
          nationB: String(rRec["nationB"] ?? ""),
          relation: (rRec["relation"] as DiplomaticRelation["relation"]) ?? "neutral",
          since: String(rRec["since"] ?? "1880-01"),
        };
      })
      .sort((a, b) => (a.nationA + a.nationB).localeCompare(b.nationA + b.nationB));
    return { relations, shells: {} };
  }

  private buildDesignsFromData(
    designsData: unknown[],
    collector: DiagnosticCollectorType,
  ): Map<string, CompiledDesignVersion> {
    const designs = new Map<string, CompiledDesignVersion>();

    if (!Array.isArray(designsData)) return designs;

    for (const d of designsData) {
      const rec = d as Record<string, unknown>;
      const designVersionId = String(rec["designVersionId"] ?? rec["designId"] ?? "");

      const rawDesign = {
        designId: designVersionId,
        designFamilyId: rec["designFamilyId"],
        nationId: rec["nationId"],
        className: rec["className"],
        hullType: rec["hullType"],
        displacementKg: rec["displacementKg"],
        speedUms: rec["speedUms"],
        armorBeltUm: rec["armorBeltUm"],
        mainGuns: rec["mainGuns"],
        machineryType: rec["machineryType"],
        hitPoints: rec["hitPoints"],
        crewComplement: rec["crewComplement"],
        contentVersion: rec["contentVersion"],
      };

      const validated = validateAgainstSchema(
        rawDesign,
        DesignTemplateSchema,
        "DesignTemplate",
        "designs.yaml",
        collector,
      );
      if (!validated) continue;

      const design: CompiledDesignVersion = {
        designVersionId,
        designFamilyId: String(validated["designFamilyId"] ?? ""),
        className: validated["className"],
        nationId: validated["nationId"],
        hullType: validated["hullType"],
        normalizedDisplacementKg: toSafeIntOpt(
          rec["normalizedDisplacementKg"] ?? validated["displacementKg"],
          SafeInt(0),
        ),
        normalizedSpeedUms: toSafeIntOpt(
          rec["normalizedSpeedUms"] ?? validated["speedUms"],
          SafeInt(0),
        ),
        normalizedArmorUm: toSafeIntOpt(
          rec["normalizedArmorUm"] ?? validated["armorBeltUm"],
          SafeInt(0),
        ),
        hitPoints: toSafeIntOpt(validated["hitPoints"], SafeInt(100)),
        mainGunsCaliber: toSafeIntOpt(validated["mainGuns"]?.["caliber"], SafeInt(0)),
        mainGunsCount: toSafeIntOpt(validated["mainGuns"]?.["count"], SafeInt(0)),
        machineryType: validated["machineryType"],
        crewComplement: toSafeIntOpt(validated["crewComplement"], SafeInt(0)),
        contentVersion: String(validated["contentVersion"] ?? "0.1.0"),
        compiledHash: sha256Hex(
          canonicalSerialize({
            designVersionId,
            className: validated["className"],
            nationId: validated["nationId"],
            hullType: validated["hullType"],
            displacementKg: validated["displacementKg"],
            speedUms: validated["speedUms"],
            armorBeltUm: validated["armorBeltUm"],
            mainGuns: validated["mainGuns"],
            machineryType: validated["machineryType"],
            hitPoints: validated["hitPoints"],
            crewComplement: validated["crewComplement"],
          }),
        ),
      };

      designs.set(designVersionId, design);
    }

    return designs;
  }

  private buildDesignFamiliesFromData(designsData: unknown[]): Map<string, DesignFamily> {
    const families = new Map<string, DesignFamily>();

    if (!Array.isArray(designsData)) return families;

    // Group by designFamilyId
    const familyMap = new Map<string, { rec: Record<string, unknown>; members: string[] }>();
    for (const d of designsData) {
      const rec = d as Record<string, unknown>;
      const familyId = String(rec["designFamilyId"] ?? "");
      if (!familyId) continue;
      const designVersionId = String(rec["designVersionId"] ?? rec["designId"] ?? "");

      if (!familyMap.has(familyId)) {
        familyMap.set(familyId, { rec, members: [] });
      }
      if (designVersionId) {
        familyMap.get(familyId)!.members.push(designVersionId);
      }
    }

    for (const [familyId, data] of familyMap) {
      data.members.sort((a, b) => a.localeCompare(b));
      families.set(familyId, {
        designFamilyId: familyId,
        nationId: String(data.rec["nationId"] ?? ""),
        rootDesignVersionId: data.members[0] ?? "",
        memberDesignVersionIds: data.members,
        familyCreationMonth: String(data.rec["familyCreationMonth"] ?? "1880-01"),
      });
    }

    return families;
  }
}
