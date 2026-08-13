import { contextBridge, ipcRenderer } from "electron";

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
  diagnostics: Array<{
    code: string;
    severity: string;
    message: string;
  }>;
  error?: string;
}

contextBridge.exposeInMainWorld("electronAPI", {
  compile: (dirPath?: string): Promise<CompileResult> => {
    return ipcRenderer.invoke("compile", dirPath);
  },
  openProject: (): Promise<ProjectResult> => {
    return ipcRenderer.invoke("project:open");
  },
  newProject: (): Promise<ProjectResult> => {
    return ipcRenderer.invoke("project:new");
  },
  saveProject: (): Promise<ProjectResult> => {
    return ipcRenderer.invoke("project:save");
  },
  saveProjectAs: (): Promise<ProjectResult> => {
    return ipcRenderer.invoke("project:save-as");
  },
  loadCampaignSave: (saveDir?: string): Promise<LoadSaveResult> => {
    return ipcRenderer.invoke("campaign:load-save", saveDir);
  },
});
