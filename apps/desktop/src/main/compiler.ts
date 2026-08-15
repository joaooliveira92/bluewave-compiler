import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { CampaignCompiler, type CampaignCompilerOutput } from "@bluewave/campaign/compiler";
import { DiagnosticCollector } from "@bluewave/diagnostics";

export interface CompileResult {
  success: boolean;
  snapshotHash?: string;
  contentArtifactHash?: string;
  nations?: Array<{ id: string; name: string }>;
  diagnostics: Array<{
    code: string;
    severity: string;
    message: string;
  }>;
  error?: string;
}

function readFileContent(dir: string, filename: string): string {
  const fullPath = resolve(dir, filename);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${filename}`);
  }
  return readFileSync(fullPath, "utf8");
}

export function runCompilation(contentDir: string, signal: AbortSignal): CompileResult {
  try {
    if (!existsSync(contentDir)) {
      return { success: false, diagnostics: [], error: `Directory not found: ${contentDir}` };
    }

    const packContent = readFileContent(contentDir, "pack.json");
    const pack = JSON.parse(packContent) as { files?: Record<string, string[]> };
    const files = pack.files ?? {};

    const compiler = new CampaignCompiler();
    const collector = new DiagnosticCollector();

    if (signal.aborted) {
      return { success: false, diagnostics: [], error: "Compilation aborted" };
    }

    const output = compiler.compile(
      {
        compilerInput: {
          manifestPath: resolve(contentDir, "pack.json"),
          contentDir,
          rulesetFiles: (files.rulesets ?? []).map((f) => resolve(contentDir, f)),
          countryFiles: (files.countries ?? []).map((f) => resolve(contentDir, f)),
          areaFiles: (files.areas ?? []).map((f) => resolve(contentDir, f)),
          routeFiles: (files.routes ?? []).map((f) => resolve(contentDir, f)),
          possessionFiles: (files.possessions ?? []).map((f) => resolve(contentDir, f)),
          portFiles: (files.ports ?? []).map((f) => resolve(contentDir, f)),
          technologyFiles: (files.technologies ?? []).map((f) => resolve(contentDir, f)),
        },
        campaignFiles: {
          fleetFiles: (files.fleets ?? []).map((f) => resolve(contentDir, f)),
          economyFiles: (files.economies ?? []).map((f) => resolve(contentDir, f)),
          constructionFiles: (files.constructions ?? []).map((f) => resolve(contentDir, f)),
          diplomacyFiles: (files.diplomacy ?? []).map((f) => resolve(contentDir, f)),
          researchFiles: (files.research ?? []).map((f) => resolve(contentDir, f)),
          designFiles: (files.designs ?? []).map((f) => resolve(contentDir, f)),
        },
        rulesetVersion: "1.0",
        compatibilityVersion: "1.0.0",
      },
      signal,
      collector,
    );

    if (!output || collector.hasErrors) {
      const diags: CompileResult["diagnostics"] = [];
      for (const d of collector.all) {
        diags.push({ code: d.code ?? "UNKNOWN", severity: d.severity, message: d.message });
      }
      return { success: false, diagnostics: diags };
    }

    const snapshotHash = output.state.rawHash;
    const nations: CompileResult["nations"] = [];
    for (const [id, nation] of output.state.snapshot.nations) {
      nations.push({ id, name: nation.name ?? id });
    }

    return {
      success: true,
      snapshotHash,
      contentArtifactHash: output.contentHash,
      nations,
      diagnostics: [],
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, diagnostics: [{ code: "COMPILE_ERROR", severity: "error", message }] };
  }
}

/**
 * The real compiler output (`CampaignState` with Map-valued snapshot fields
 * intact, plus the validated content `pack`), for callers that need more
 * than `runCompilation`'s flattened summary — namely `compileCampaign` and
 * `listNewGameOptions`, which need the full compiled state to build a save
 * package / `NewGameOptions`. Shares `readFileContent`'s path resolution
 * with `runCompilation` rather than re-deriving it; throws on unreadable
 * `pack.json` the same way `readFileContent` always has (callers should
 * catch, matching `runCompilation`'s own try/catch).
 */
export function compileProductionCampaign(
  contentDir: string,
  signal: AbortSignal,
  collector: DiagnosticCollector,
): CampaignCompilerOutput | undefined {
  if (!existsSync(contentDir)) {
    collector.addError("CAMPAIGN-PATH", `Directory not found: ${contentDir}`, {
      stage: "campaign-compile",
    });
    return undefined;
  }

  const packContent = readFileContent(contentDir, "pack.json");
  const pack = JSON.parse(packContent) as { files?: Record<string, string[]> };
  const files = pack.files ?? {};

  const compiler = new CampaignCompiler();

  if (signal.aborted) {
    collector.addInfo("ABORT", "Compilation aborted before content compilation");
    return undefined;
  }

  return compiler.compile(
    {
      compilerInput: {
        manifestPath: resolve(contentDir, "pack.json"),
        contentDir,
        rulesetFiles: (files.rulesets ?? []).map((f) => resolve(contentDir, f)),
        countryFiles: (files.countries ?? []).map((f) => resolve(contentDir, f)),
        areaFiles: (files.areas ?? []).map((f) => resolve(contentDir, f)),
        routeFiles: (files.routes ?? []).map((f) => resolve(contentDir, f)),
        possessionFiles: (files.possessions ?? []).map((f) => resolve(contentDir, f)),
        portFiles: (files.ports ?? []).map((f) => resolve(contentDir, f)),
        technologyFiles: (files.technologies ?? []).map((f) => resolve(contentDir, f)),
      },
      campaignFiles: {
        fleetFiles: (files.fleets ?? []).map((f) => resolve(contentDir, f)),
        economyFiles: (files.economies ?? []).map((f) => resolve(contentDir, f)),
        constructionFiles: (files.constructions ?? []).map((f) => resolve(contentDir, f)),
        diplomacyFiles: (files.diplomacy ?? []).map((f) => resolve(contentDir, f)),
        researchFiles: (files.research ?? []).map((f) => resolve(contentDir, f)),
        designFiles: (files.designs ?? []).map((f) => resolve(contentDir, f)),
      },
      rulesetVersion: "1.0",
      compatibilityVersion: "1.0.0",
    },
    signal,
    collector,
  );
}
