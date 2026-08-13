import { app, BrowserWindow, ipcMain, session } from "electron";
import { resolve } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { runCompilation } from "./compiler.js";
import { loadCampaignSave } from "./campaignSave.js";
import { LoadSaveRequestSchema, LoadSaveResultSchema } from "./campaignSaveSchema.js";
import { applyContentSecurityPolicy } from "./csp.js";
import {
  extractProject,
  loadContentDirectory,
  loadProjectFile,
  saveProjectFile,
} from "./project.js";
import type { BluewaveProject } from "./project.js";

let currentAbortController: AbortController | null = null;

let openProject: BluewaveProject | null = null;
let openProjectPath: string | null = null;
let workingDir: string | null = null;

async function handleCompile(
  _event: Electron.IpcMainInvokeEvent,
  dirPath?: string,
): Promise<ReturnType<typeof runCompilation>> {
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  try {
    const contentDir = dirPath ?? workingDir ?? (await openDirectoryDialog());
    if (!contentDir) {
      return { success: false, diagnostics: [], error: "No directory selected" };
    }
    return runCompilation(contentDir, signal);
  } finally {
    if (currentAbortController?.signal.aborted) {
      currentAbortController = null;
    }
  }
}

async function handleOpenProject(_event: Electron.IpcMainInvokeEvent): Promise<ProjectResult> {
  const { dialog } = await import("electron");
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Bluewave Project", extensions: ["bluewave", "json"] }],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { ok: false, canceled: true };
  }
  try {
    const project = loadProjectFile(result.filePaths[0]!);
    const dir = mkdtempSync(resolve(tmpdir(), "bluewave-project-"));
    extractProject(project, dir);
    openProject = project;
    workingDir = dir;
    return { ok: true, name: project.name, path: result.filePaths[0]! };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

async function handleNewProject(_event: Electron.IpcMainInvokeEvent): Promise<ProjectResult> {
  const dir = await openDirectoryDialog();
  if (!dir) {
    return { ok: false, canceled: true };
  }
  try {
    const project = loadContentDirectory(dir);
    openProject = project;
    openProjectPath = null;
    workingDir = dir;
    return { ok: true, name: project.name, path: dir };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

async function handleSaveProject(
  _event: Electron.IpcMainInvokeEvent,
  mode: "save" | "save-as",
): Promise<ProjectResult> {
  const { dialog } = await import("electron");
  let savePath = mode === "save" ? openProjectPath : null;
  if (!savePath) {
    const result = await dialog.showSaveDialog({
      defaultPath: openProject?.name ? `${openProject.name}.bluewave` : "project.bluewave",
      filters: [{ name: "Bluewave Project", extensions: ["bluewave", "json"] }],
    });
    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }
    savePath = result.filePath;
  }
  if (!workingDir) {
    return { ok: false, error: "No project is open to save" };
  }
  try {
    const project = loadContentDirectory(workingDir);
    openProject = project;
    openProjectPath = savePath;
    saveProjectFile(project, savePath);
    return { ok: true, name: project.name, path: savePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

async function handleLoadCampaignSave(
  _event: Electron.IpcMainInvokeEvent,
  rawSaveDir?: string,
): Promise<ReturnType<typeof loadCampaignSave>> {
  const parsedRequest = LoadSaveRequestSchema.safeParse(rawSaveDir);
  if (!parsedRequest.success) {
    return LoadSaveResultSchema.parse({ success: false, diagnostics: [], error: "Invalid request" });
  }

  const dir = parsedRequest.data ?? (await openDirectoryDialog());
  if (!dir) {
    return LoadSaveResultSchema.parse({
      success: false,
      diagnostics: [],
      error: "No directory selected",
    });
  }

  return LoadSaveResultSchema.parse(loadCampaignSave(dir));
}

interface ProjectResult {
  ok: boolean;
  canceled?: boolean;
  name?: string;
  path?: string;
  error?: string;
}

async function openDirectoryDialog(): Promise<string | null> {
  const { dialog } = await import("electron");
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0]!;
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: resolve(import.meta.dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: applyContentSecurityPolicy(details.responseHeaders),
    });
  });

  if (process.env.NODE_ENV === "development" || process.argv.includes("--dev")) {
    void win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    void win.loadFile(resolve(import.meta.dirname, "../renderer/index.html"));
  }
}

void app.whenReady().then(() => {
  ipcMain.handle("compile", handleCompile);
  ipcMain.handle("project:open", handleOpenProject);
  ipcMain.handle("project:new", handleNewProject);
  ipcMain.handle("project:save", (_e) => handleSaveProject(_e, "save"));
  ipcMain.handle("project:save-as", (_e) => handleSaveProject(_e, "save-as"));
  ipcMain.handle("campaign:load-save", handleLoadCampaignSave);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
