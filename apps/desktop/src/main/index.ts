import { app, BrowserWindow, ipcMain, session } from "electron";
import { resolve } from "node:path";
import { runCompilation } from "./compiler.js";
import { applyContentSecurityPolicy } from "./csp.js";

let currentAbortController: AbortController | null = null;

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
    const contentDir = dirPath ?? (await openDirectoryDialog());
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
