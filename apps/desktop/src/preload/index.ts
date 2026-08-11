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

contextBridge.exposeInMainWorld("electronAPI", {
  compile: (dirPath?: string): Promise<CompileResult> => {
    return ipcRenderer.invoke("compile", dirPath);
  },
});