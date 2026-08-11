import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, extname } from "node:path";
import { CampaignCompiler } from "@bluewave/campaign";
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

export function findYamlFiles(dir: string): { name: string; content: string }[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const yamlFiles: { name: string; content: string }[] = [];
  for (const entry of entries) {
    if (entry.isFile() && (extname(entry.name) === ".yaml" || extname(entry.name) === ".yml")) {
      const fullPath = resolve(dir, entry.name);
      const content = readFileSync(fullPath, "utf8");
      yamlFiles.push({ name: entry.name, content });
    }
  }
  return yamlFiles;
}

export function runCompilation(
  contentDir: string,
  signal: AbortSignal,
): CompileResult {
  if (!existsSync(contentDir)) {
    return { success: false, diagnostics: [], error: `Directory not found: ${contentDir}` };
  }

  const packContent = readFileContent(contentDir, "pack.json");
  const pack = JSON.parse(packContent) as { files?: Record<string, string[]> };
  const files = pack.files ?? {};

  const yamlFiles = findYamlFiles(contentDir);

  function readYaml(name: string): string {
    const found = yamlFiles.find((f) => f.name === name);
    if (found) return found.content;
    return readFileContent(contentDir, name);
  }

  const compiler = new CampaignCompiler();
  const collector = new DiagnosticCollector();

  const rulesetFiles = (files.rulesets ?? []).map(readYaml);
  const countryFiles = (files.countries ?? []).map(readYaml);
  const areaFiles = (files.areas ?? []).map(readYaml);
  const routeFiles = (files.routes ?? []).map(readYaml);
  const possessionFiles = (files.possessions ?? []).map(readYaml);
  const portFiles = (files.ports ?? []).map(readYaml);
  const technologyFiles = (files.technologies ?? []).map(readYaml);

  const campaignFleetFiles = (files.fleets ?? []).map(readYaml);
  const campaignEconomyFiles = (files.economies ?? []).map(readYaml);
  const campaignConstructionFiles = (files.constructions ?? []).map(readYaml);
  const campaignDiplomacyFiles = (files.diplomacy ?? []).map(readYaml);
  const campaignResearchFiles = (files.research ?? []).map(readYaml);

  if (signal.aborted) {
    return { success: false, diagnostics: [], error: "Compilation aborted" };
  }

  const output = compiler.compile(
    {
      compilerInput: {
        manifestPath: "pack.json",
        contentDir,
        rulesetFiles,
        countryFiles,
        areaFiles,
        routeFiles,
        possessionFiles,
        portFiles,
        technologyFiles,
      },
      campaignFiles: {
        fleetFiles: campaignFleetFiles,
        economyFiles: campaignEconomyFiles,
        constructionFiles: campaignConstructionFiles,
        diplomacyFiles: campaignDiplomacyFiles,
        researchFiles: campaignResearchFiles,
      },
      rulesetVersion: "1.0",
      compatibilityVersion: "1.0.0",
    },
    signal,
    collector,
  );

  if (!output || collector.hasErrors) {
    const diags: CompileResult["diagnostics"] = [];
    for (const d of collector.diagnostics) {
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
}