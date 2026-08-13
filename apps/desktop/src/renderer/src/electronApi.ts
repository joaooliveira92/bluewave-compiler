export interface CompileResult {
  success: boolean;
  snapshotHash?: string;
  contentArtifactHash?: string;
  nations?: Array<{ id: string; name: string }>;
  diagnostics: Array<{ code: string; severity: string; message: string }>;
  error?: string;
}

export interface ProjectResult {
  ok: boolean;
  canceled?: boolean;
  name?: string;
  path?: string;
  error?: string;
}

export interface LoadSaveResult {
  success: boolean;
  snapshot?: Record<string, unknown>;
  envelope?: Record<string, unknown>;
  rawHash?: string;
  diagnostics: Array<{ code: string; severity: string; message: string }>;
  error?: string;
}

export interface ElectronAPI {
  compile: (dirPath?: string) => Promise<CompileResult>;
  openProject: () => Promise<ProjectResult>;
  newProject: () => Promise<ProjectResult>;
  saveProject: () => Promise<ProjectResult>;
  saveProjectAs: () => Promise<ProjectResult>;
  loadCampaignSave: (saveDir?: string) => Promise<LoadSaveResult>;
}

export const api = (window as unknown as { electronAPI: ElectronAPI }).electronAPI;

/**
 * Curated view of a loaded CampaignSnapshot: nations/wars/diplomacy first,
 * per .scratch/desktop-campaign-viewer/issues/02-rendered-snapshot-shape.md
 * (world/intelligence/designs/designFamilies deferred to a future structured
 * per-domain panel).
 */
export function extractSnapshotSubset(snapshot: Record<string, unknown>): Record<string, unknown> {
  const politics = snapshot.politics as { relations?: unknown } | undefined;
  return {
    turnNumber: snapshot.turnNumber,
    campaignId: snapshot.campaignId,
    nations: snapshot.nations,
    wars: snapshot.wars,
    diplomacy: politics?.relations,
  };
}
