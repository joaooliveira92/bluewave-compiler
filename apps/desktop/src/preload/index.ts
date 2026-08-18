import { contextBridge, ipcRenderer } from "electron";
import type { CampaignCommandClient } from "../shared/campaign-command-contract.js";
import type { WindowState } from "../shared/bridge-contract.js";

/**
 * The desktop app's IPC bridge, exposed on `window.bluewave`. Grounded in
 * every screen's actual import path (`../../preload/index.js`) — see the
 * desktop-mvp map, tickets 07/11. `campaign.execute` dispatches every
 * command in `CAMPAIGN_COMMAND_NAMES` (see
 * `shared/campaign-command-contract.ts` — the single source of truth for the
 * command name set) through a single
 * `campaign:execute` channel; `src/main/campaignBridge.ts` owns the
 * per-command implementations. Window-chrome methods back the shell's custom,
 * frameless-window titlebar (`WindowContext.tsx`).
 */
export interface BluewaveDesktopBridge {
  readonly campaign: CampaignCommandClient;
  readonly platform: NodeJS.Platform;
  getWindowState(): Promise<WindowState>;
  windowMinimize(): void;
  windowMaximizeToggle(): void;
  windowClose(): void;
}

declare global {
  interface Window {
    bluewave?: BluewaveDesktopBridge;
  }
}

contextBridge.exposeInMainWorld("bluewave", {
  campaign: {
    execute: (command: string, payload: unknown) => {
      return ipcRenderer.invoke("campaign:execute", command, payload);
    },
  },
  platform: process.platform,
  getWindowState: () => ipcRenderer.invoke("window:get-state"),
  windowMinimize: () => ipcRenderer.send("window:minimize"),
  windowMaximizeToggle: () => ipcRenderer.send("window:maximize-toggle"),
  windowClose: () => ipcRenderer.send("window:close"),
} satisfies BluewaveDesktopBridge);
