// PROTOTYPE DRAFT — not the implementation. Tune against the real types on
// compile (playwright @1.62, Electron 41). Contract described in README.md.
import { test as base, expect, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import { mkdtemp, rm, rmSync, mkdir, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { existsSync } from "node:fs";

/** Canonical deterministic seed (valid u128 hex; the shipped package's own). */
export const SEED = "ba44581c2f1d8e5c9753ffc80be8e6a0";

const DESKTOP_ROOT = resolve(import.meta.dirname, "..");
const OUT_MAIN = resolve(DESKTOP_ROOT, "out", "main", "index.js");
const FIXTURE_PACKAGE = resolve(
  DESKTOP_ROOT, "..", "..", "content", "production", "1880",
  "bluewave-austria_hungary-scen_1880",
);

export interface E2EHarness {
  app: ElectronApplication;
  page: Page;
  /** per-test scratch root */
  scratch: string;
  /** target of the `--user-data-dir` launch arg */
  userDataDir: string;
  /** dir the stubbed dialog returns — fresh-compile target or fixture copy */
  saveDir: string;
  /** preflight: fail fast with a readable message when the build is stale */
  assertBuilt(): void;
  /** point the stubbed dialog at a different dir (e.g. shared campaign) */
  retargetDialog(dir: string): Promise<void>;
}

export type BootOptions = {
  /** override the per-test dialog target dir */
  saveDir?: string;
};

const LANDING_TEXT = "Bluewave Naval Staff";

async function launchHarness(opts: BootOptions = {}): Promise<E2EHarness> {
  const scratch = await mkdtemp(join(tmpdir(), "bluewave-e2e-"));
  const userDataDir = join(scratch, "userdata");
  const saveDir = opts.saveDir ?? join(scratch, "save");
  await mkdir(saveDir, { recursive: true });

  if (!existsSync(OUT_MAIN)) {
    throw new Error(`out/main/index.js missing — run "pnpm build" (electron-vite build) first`);
  }

  const app = await electron.launch({
    args: [OUT_MAIN, `--user-data-dir=${userDataDir}`], // no --dev => prod loadFile
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
  });

  await app.evaluate(({ dialog }, dir) => {
    // Mutate the method, never replace the module (dialog prop is
    // configurable:false). Works on Electron 41.10.4 (research 01).
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] });
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
    assertBuilt: () => {
      if (!existsSync(OUT_MAIN)) {
        throw new Error(`out/main/index.js missing — run "pnpm build" first`);
      }
    },
    retargetDialog: (dir) =>
      app.evaluate(({ dialog }, p) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] });
      }, dir),
  };
}

async function teardown(h: E2EHarness): Promise<void> {
  try {
    await h.app.close().catch(() => {});
  } finally {
    await rm(h.scratch, { recursive: true, force: true }).catch(() => {});
  }
}

/** Copy the shipped production package to a writable scratch location. */
export async function copyFixturePackage(scratchRoot: string): Promise<string> {
  const target = join(scratchRoot, "pkg-copy");
  await mkdir(target, { recursive: true });
  await cp(FIXTURE_PACKAGE, target, { recursive: true });
  return target;
}

type HarnessFixtures = { e2e: E2EHarness };

export const test = base.extend<HarnessFixtures>({
  e2e: async ({}, use) => {
    const h = await launchHarness();
    try {
      await use(h);
    } finally {
      await teardown(h);
    }
  },
});

export { expect };