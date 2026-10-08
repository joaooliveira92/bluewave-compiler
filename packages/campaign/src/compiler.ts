// packages/campaign/src/compiler.ts
// Campaign-compile orchestrator (DESIGN-09). This module owns the public
// compilation request/response contracts and the statically ordered pipeline;
// each materialization stage lives in its own focused module.

import { Compiler, type CompilerInput } from "@bluewave/content-compiler";
import type { ContentPack } from "@bluewave/content-schema";
import { SafeInt } from "@bluewave/contracts";
import { canonicalSerialize, createEnvelope, sha256Hex } from "@bluewave/deterministic";
import {
  DiagnosticCollector,
  type DiagnosticCollector as DiagnosticCollectorType,
} from "@bluewave/diagnostics";
import { loadAllCampaignData, toStr, type CampaignFiles } from "./campaignInput.js";
import { validateCampaignPreconditions } from "./campaignSession.js";
import {
  assertFleetDesignLinks,
  buildDesignFamiliesFromData,
  buildDesignsFromData,
} from "./designCompilation.js";
import { buildNationStates, buildSlots } from "./nationCompilation.js";
import { buildPoliticalState, buildWarState } from "./politicalCompilation.js";
import { getScenarioById, type ScenarioId } from "./scenario.js";
import type { CampaignSnapshot, CampaignState } from "./state.js";
import { DEFAULT_CAMPAIGN_START_MONTH, DEFAULT_CAMPAIGN_START_YEAR } from "./timeline.js";
import { buildWorldState } from "./worldCompilation.js";

export type { CampaignFiles };

export interface CampaignCompilerInput {
  compilerInput: CompilerInput;
  campaignFiles: CampaignFiles;
  rulesetVersion: string;
  compatibilityVersion: string;
  // DESIGN-03 §3 strict campaign-configuration inputs. When supplied they MUST be
  // complete and valid before any RNG stream is derived (no inference/fallback).
  // Omitted only by pre-DESIGN-03 content-pack compilation flows.
  scenarios?: unknown;
  campaignConfiguration?: unknown;
  fleetSizeSettings?: unknown;
  researchSpeedSettings?: unknown;
  // B-6/ADR-0025: the compiled snapshot's authoritative campaign start calendar
  // date. Resolution order: campaignConfiguration.scenarioId -> its canonical
  // scenario start (DESIGN-03 §1); else this explicit campaignStart; else the
  // canonical DEFAULT_CAMPAIGN_START (scen_1880: January 1880). Determines the
  // month ids every later campaign month derives (`campaignMonthId`); never read
  // from wall-clock/env/locale.
  campaignStart?: { startYear: number; startMonth: number };
}

export interface CampaignCompilerOutput {
  state: CampaignState;
  contentHash: string;
  // The validated content pack the campaign was compiled against (nation
  // identity/regime, areas, ports, etc.) — exposed so consumers that need
  // display-only content-catalog data (e.g. the desktop app's New Game
  // nation list) don't have to run the content compiler a second time.
  pack: ContentPack;
}

export type CampaignStart = { startYear: number; startMonth: number };

interface ValidatedCampaignStart {
  ok: boolean;
  value?: CampaignStart;
}

// Validate the explicit campaignStart input up front so a malformed value fails
// the compile with a stable diagnostic (never a silent default or a runtime
// half-stamped snapshot).
function validateCampaignStart(
  start: CampaignCompilerInput["campaignStart"],
  collector: DiagnosticCollectorType,
): ValidatedCampaignStart {
  if (start === undefined) return { ok: true };
  if (
    !Number.isInteger(start?.startYear) ||
    (start?.startYear ?? 0) < 1800 ||
    !Number.isInteger(start?.startMonth) ||
    (start?.startMonth ?? 0) < 1 ||
    (start?.startMonth ?? 0) > 12
  ) {
    collector.addError(
      INVALID_CAMPAIGN_START,
      `Invalid campaignStart ${String(start?.startYear)}-${String(start?.startMonth)}: year must be an integer >= 1800 and month an integer 1..12`,
      { stage: "campaign-compile" },
    );
    return { ok: false };
  }
  return { ok: true, value: { startYear: start.startYear, startMonth: start.startMonth } };
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

    const startInput = validateCampaignStart(input.campaignStart, collector);
    if (!startInput.ok) return undefined;

    // DESIGN-03 §3 + §9.3/9.4: when a CampaignConfiguration is supplied it MUST be
    // complete and valid BEFORE any campaign RNG stream derives. Invalid config MUST
    // NOT create an active campaign. No inference, no fallback to canonical defaults.
    if (input.campaignConfiguration !== undefined) {
      if (!validateCampaignPreconditions(input as unknown, collector)) {
        return undefined;
      }
      if (signal.aborted) return undefined;
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
    const data = loadAllCampaignData(input.campaignFiles, contentDir, collector, signal);
    if (collector.hasErrors || signal.aborted) return undefined;

    // Step 3: Build WorldState from content
    const world = buildWorldState(pack);

    // Step 4: Build nation states
    const nations = buildNationStates(
      pack,
      data.fleets,
      data.economies,
      data.constructions,
      data.research,
      collector,
    );
    if (!nations || signal.aborted) return undefined;

    // Step 5: Build war state
    const wars = buildWarState();

    // Step 6: Build political state
    const politics = buildPoliticalState(data.diplomacy, nations, collector);

    // Step 6b: Build designs from design data
    const designs = buildDesignsFromData(data.designs, collector);
    const designFamilies = buildDesignFamiliesFromData(data.designs);

    // Validate fleet -> design link (immutable reference)
    if (!assertFleetDesignLinks(nations, designs, collector)) return undefined;
    if (signal.aborted) return undefined;

    // Step 7: Determine slots - sorted for determinism
    const slots = buildSlots(nations);

    // Step 8: Build intelligence shell
    const intelligence = { shells: {} };

    // Step 9: Build snapshot
    const campaignStart = resolveCampaignStart(input, startInput.value);
    const snapshot: CampaignSnapshot = {
      version: "0.1.0",
      turnNumber: SafeInt(0),
      campaignId: `campaign-${toStr((pack.manifest as Record<string, unknown>)["name"], "unknown")}`,
      startYear: campaignStart.startYear,
      startMonth: campaignStart.startMonth,
      slots,
      world,
      nations,
      wars,
      politics,
      intelligence,
      designs,
      designFamilies,
      strategicWeather: [],
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
      pack,
    };
  }
}

// ---- B-6/ADR-0025: authoritative campaign start date ----

// Resolution order (documented on CampaignCompilerInput.campaignStart):
//   1. campaignConfiguration.scenarioId -> canonical scenario start (DESIGN-03 §1)
//   2. the validated explicit campaignStart input
//   3. DEFAULT_CAMPAIGN_START (scen_1880: January 1880)
// Deterministic, pure; never reads wall-clock/env/locale. `explicit` is the
// already-validated campaignStart input (compile() validates it up front and
// aborts on malformed values, see INVALID_CAMPAIGN_START).
function resolveCampaignStart(
  input: CampaignCompilerInput,
  explicit: CampaignStart | undefined,
): CampaignStart {
  if (input.campaignConfiguration !== undefined) {
    const scenarioId = (input.campaignConfiguration as { scenarioId?: unknown })["scenarioId"];
    if (typeof scenarioId === "string") {
      const scen = getScenarioById(scenarioId as ScenarioId);
      if (scen) {
        return { startYear: scen.startYear, startMonth: scen.startMonth };
      }
    }
  }
  if (explicit) {
    return { startYear: explicit.startYear, startMonth: explicit.startMonth };
  }
  return { startYear: DEFAULT_CAMPAIGN_START_YEAR, startMonth: DEFAULT_CAMPAIGN_START_MONTH };
}

export const INVALID_CAMPAIGN_START = "INVALID_CAMPAIGN_START" as const;
