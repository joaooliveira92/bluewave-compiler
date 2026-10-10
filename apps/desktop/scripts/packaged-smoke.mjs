/**
 * Release smoke test for the PACKAGED app (not the electron-vite build the e2e
 * suite drives). Launches the real binary, opens a compiled campaign, and checks
 * what packaging can break: file:// loading, the lazy coastline chunk, the
 * debug gate and the map's canvas actually painting. Exits non-zero on failure.
 *
 *   pnpm --filter @bluewave/desktop build
 *   CSC_IDENTITY_AUTO_DISCOVERY=false pnpm --filter @bluewave/desktop exec \
 *     electron-builder --mac --dir --config electron-builder.yml
 *   pnpm --filter @bluewave/desktop run snap --make-save DIR      # a compiled campaign
 *   pnpm --filter @bluewave/desktop run smoke:packaged --save DIR [--app BINARY] [--shot OUT.png]
 *
 * The default --app path is the macOS arm64 unpacked build; pass --app for other platforms.
 *
 * The save is copied to a temp dir first; the source is never touched.
 */
import { _electron as electron } from "@playwright/test";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    save: { type: "string" },
    app: {
      type: "string",
      default: "dist-electron/mac-arm64/Bluewave.app/Contents/MacOS/Bluewave",
    },
    shot: { type: "string" },
  },
});
if (values.save === undefined) {
  console.error("usage: packaged-smoke.mjs --save DIR [--app BINARY] [--shot OUT.png]");
  process.exit(2);
}

const scratch = await mkdtemp(join(tmpdir(), "bw-pkg-smoke-"));
const saveCopy = join(scratch, "save");
await cp(values.save, saveCopy, { recursive: true });

const checks = [];
const check = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail });

const app = await electron.launch({
  executablePath: values.app,
  args: [`--user-data-dir=${join(scratch, "userdata")}`],
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
  timeout: 60_000,
});
try {
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] });
  }, saveCopy);
  const isPackaged = await app.evaluate(({ app: electronApp }) => electronApp.isPackaged);
  check("running the packaged build", isPackaged === true);

  // The window may already exist by the time we ask: firstWindow handles both.
  const page = await app.firstWindow();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.waitForLoadState("load");
  check("renderer loaded over file://", page.url().startsWith("file://"), page.url());

  await page.getByText("Bluewave Naval Staff").waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Open Campaign" }).click();
  await page.getByRole("heading", { name: "Campaign Overview" }).waitFor({ timeout: 30_000 });
  check("campaign opens onto Overview", true);
  check("month header visible", await page.getByText("Bluewave — January 1880").isVisible());
  check(
    "no session id in the release UI",
    !/[0-9a-f]{8}-[0-9a-f]{4}-/.test(await page.locator("body").innerText()),
  );
  const reason = await page.evaluate(
    async () =>
      (await window.bluewave.campaign.execute("generateBattle", { sessionId: "x", warId: "w" }))
        .reason,
  );
  check("debug-only commands rejected", reason === "DEBUG_ONLY", String(reason));

  // The home screen's map panel, checked on its own (the F1 sheet is a second
  // map, so every query below is scoped to one container).
  const mapPainted = (root) =>
    root.evaluate((container) => {
      const canvas = container.querySelector("canvas");
      if (!canvas || canvas.width === 0) return false;
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
      return false;
    });
  const awaitPainted = async (name, root) => {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (await mapPainted(root)) return check(name, true);
      await page.waitForTimeout(250);
    }
    check(name, false, "canvas stayed empty");
  };

  // The home screen's map, scoped to the map application landmark (the SVG) and
  // its container (which also holds the coastline canvas). The Overview's map is
  // the packaged app's heaviest lazy chunk, so painting it proves file:// loading
  // and the coastline chunk work in a packaged build. This targets the app's
  // world-map application, not a feature panel that may be renamed away.
  const homeApp = page.getByRole("application", { name: /World map/ });
  await homeApp.waitFor({ timeout: 15_000 });
  check("home map application present", true);
  const homeMap = homeApp.locator("xpath=..");
  await awaitPainted("home map coastline painted from the packaged chunk", homeMap);
  check(
    "home map: 36 keyboard-reachable areas",
    (await homeMap.locator('path[role="button"]').count()) === 36,
  );

  await page.keyboard.press("F1");
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("application", { name: /World map/ }).waitFor({ timeout: 15_000 });
  await awaitPainted("F1 map coastline painted", sheet);
  check(
    "F1 map: 36 keyboard-reachable areas",
    (await sheet.locator('path[role="button"]').count()) === 36,
  );
  check("F1 map: minimap present", (await sheet.getByTestId("map-minimap").count()) === 1);
  if (values.shot !== undefined) await page.screenshot({ path: values.shot });
  check("no renderer errors", errors.length === 0, errors[0]?.slice(0, 200));
} finally {
  await app.close().catch(() => {});
  await rm(scratch, { recursive: true, force: true }).catch(() => {});
}

for (const { name, ok, detail } of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}
process.exit(checks.every((c) => c.ok) ? 0 : 1);
