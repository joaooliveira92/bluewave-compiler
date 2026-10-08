// @ts-nocheck
// PROTOTYPE DRAFT — synced against the real implementation in
// apps/desktop/e2e/fixtures.ts (playwright, Electron 41.10.4). Contract in
// README.md.

import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ElectronApplication, Page } from "@playwright/test";
import { test as base, _electron as electron, expect } from "@playwright/test";

/** Canonical deterministic seed (valid u128 hex; the shipped package's own). */
export const SEED = "ba44581c2f1d8e5c9753ffc80be8e6a0";

// import.meta.dirname (Node 20.11+) is unavailable in the bundled main
// context; resolve from import.meta.url for portability (mirrors fixtures.ts).
const __dirname = dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = resolve(__dirname, "..");
const OUT_MAIN = resolve(DESKTOP_ROOT, "out", "main", "index.js");

export interface E2EHarness {
  app: ElectronApplication;
  page: Page;
  /** per-test scratch root */
  scratch: string;
  /** target of the `--user-data-dir` launch arg */
  userDataDir: string;
  /** dir the stubbed dialog returns — fresh-compile target or fixture copy */
  saveDir: string;
  /** point the stubbed dialog at a different dir (e.g. shared campaign) */
  retargetDialog(dir: string): Promise<void>;
}

export type BootOptions = {
  /** override the per-test dialog target dir */
  saveDir?: string;
};

const LANDING_TEXT = "Bluewave Naval Staff";

async function launchHarness(opts: BootOptions = {}): Promise<E2EHarness> {
  if (!existsSync(OUT_MAIN)) {
    throw new Error(
      `out/main/index.js missing — run "pnpm build" (electron-vite build) in apps/desktop first`,
    );
  }

  const scratch = await mkdtemp(join(tmpdir(), "bluewave-e2e-"));
  try {
    const userDataDir = join(scratch, "userdata");
    const saveDir = opts.saveDir ?? join(scratch, "save");
    await mkdir(saveDir, { recursive: true });

    const app = await electron.launch({
      args: [OUT_MAIN, `--user-data-dir=${userDataDir}`], // no --dev => prod loadFile
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
      timeout: 60_000,
    });

    // Mutate methods, never replace the module (dialog prop is
    // configurable:false). Works on Electron 41.10.4 (research 01). Stub BOTH
    // dialogs: save dialog (compile) returns `filePath`; open dialog
    // (continuance) returns `filePaths`.
    await app.evaluate(({ dialog }, dir) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: dir });
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [dir],
      });
    }, saveDir);

    const window = await app.waitForEvent("window", {
      predicate: (win) => !win.url().startsWith("devtools://"),
    });
    await window.waitForLoadState("load");
    await window.getByText(LANDING_TEXT).waitFor({ timeout: 15000 });

    return {
      app,
      page: window,
      scratch,
      userDataDir,
      saveDir,
      retargetDialog: (dir) =>
        app.evaluate(({ dialog }, p) => {
          dialog.showSaveDialog = async () => ({
            canceled: false,
            filePath: p,
          });
          dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [p],
          });
        }, dir),
    };
  } catch (error) {
    // Launch or boot failed mid-way — never leak the scratch tree.
    await rm(scratch, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

async function teardown(h: E2EHarness): Promise<void> {
  try {
    await h.app.close().catch(() => {});
  } finally {
    await rm(h.scratch, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Copy the shipped production package (or a compiled master fixture package)
 * to a writable scratch location so continuance specs never mutate the source
 * tree. Mirrors fixtures.ts: `sourceDir` is the package, `scratchRoot` the
 * per-test scratch tree.
 */
export async function copyFixturePackage(sourceDir: string, scratchRoot: string): Promise<string> {
  const target = join(scratchRoot, "package");
  await cp(sourceDir, target, { recursive: true });
  return target;
}

type HarnessFixtures = { e2e: E2EHarness };

export const test = base.extend<HarnessFixtures>({
  e2e: async (_unused, use) => {
    const h = await launchHarness();
    try {
      await use(h);
    } finally {
      await teardown(h);
    }
  },
});

export { expect };
