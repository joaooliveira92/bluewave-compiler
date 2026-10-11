import { app, BrowserWindow, ipcMain, session } from "electron";
import { resolve } from "node:path";
import { applyContentSecurityPolicy } from "./csp.js";
import { dispatchCampaignCommand } from "./campaignBridge.js";
import { isDebugModeEnabled } from "./debugGate.js";

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    webPreferences: {
      preload: resolve(import.meta.dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: applyContentSecurityPolicy(details.responseHeaders, isDev),
    });
  });

  win.on("maximize", () => win.webContents.send("window:state-changed"));
  win.on("unmaximize", () => win.webContents.send("window:state-changed"));

  if (isDev) {
    void win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    void win.loadFile(resolve(import.meta.dirname, "../renderer/index.html"));
  }

  return win;
}

void app.whenReady().then(async () => {
  if (isDev && isDebugModeEnabled()) {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import(
        "electron-devtools-installer"
      );
      const { name } = await installExtension(REACT_DEVELOPER_TOOLS);
      console.log(`Added extension: ${name}`);
    } catch (error) {
      console.warn("Failed to install React DevTools extension:", error);
    }
  }

  ipcMain.handle("campaign:execute", (event, command: string, payload: unknown) =>
    dispatchCampaignCommand(command, payload),
  );

  ipcMain.handle("window:get-state", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return {
      platform: process.platform,
      isMaximized: win?.isMaximized() ?? false,
      maximizable: win?.isMaximizable() ?? true,
      minimizable: win?.isMinimizable() ?? true,
    };
  });
  ipcMain.on("window:minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.on("window:maximize-toggle", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win === null) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on("window:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

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
