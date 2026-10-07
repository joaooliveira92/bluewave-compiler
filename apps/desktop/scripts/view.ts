/**
 * Agent-facing "eyes and hands" for the desktop app. Launches the built Electron
 * app through the hermetic E2E harness, optionally drives it, then captures what
 * is on screen. Not a test — nothing here asserts.
 *
 *   pnpm --filter @bluewave/desktop snap [--out DIR] [--click TEXT]... [--fill LABEL=VALUE]...
 *                                        [--press KEY]... [--wait MS] [--eval JS]
 *                                        [--save PACKAGE_DIR] [--selector CSS]
 *
 * --save      copies a compiled campaign package to a temp dir, opens it via
 *             "Open Campaign", and starts from there (the source is never touched).
 * --selector  screenshots only the first element matching the CSS selector.
 *
 * Actions run in the order given. Output (default `.dev-data/view`, git-ignored):
 *   screenshot.png  full-window screenshot
 *   aria.yaml       accessibility tree (roles, names, states) — best for locating controls
 *   text.txt        visible text
 *   console.log     renderer console messages + page errors
 *
 * Requires a built app: `pnpm --filter @bluewave/desktop build`.
 */
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { copyFixturePackage, launchHarness, teardownHarness } from "../e2e/fixtures.ts";

const { values } = parseArgs({
  options: {
    out: { type: "string", default: ".dev-data/view" },
    click: { type: "string", multiple: true, default: [] },
    fill: { type: "string", multiple: true, default: [] },
    press: { type: "string", multiple: true, default: [] },
    wait: { type: "string", default: "300" },
    eval: { type: "string" },
    save: { type: "string" },
    selector: { type: "string" },
  },
  strict: true,
});

// Preserve CLI order across the three action flags.
const order = process.argv
  .slice(2)
  .filter((a) => ["--click", "--fill", "--press"].includes(a))
  .map((a) => a.slice(2) as "click" | "fill" | "press");
const queues = { click: [...values.click!], fill: [...values.fill!], press: [...values.press!] };

const outDir = resolve(values.out!);
await mkdir(outDir, { recursive: true });

let saveScratch: string | undefined;
let saveDir: string | undefined;
if (values.save) {
  saveScratch = await mkdtemp(join(tmpdir(), "bluewave-snap-save-"));
  saveDir = await copyFixturePackage(resolve(values.save), saveScratch);
}

const h = await launchHarness({ saveDir });
const log: string[] = [];
h.page.on("console", (m) => log.push(`[${m.type()}] ${m.text()}`));
h.page.on("pageerror", (e) => log.push(`[pageerror] ${e.message}`));

try {
  if (saveDir) {
    await h.page.getByRole("button", { name: "Open Campaign" }).click();
    await h.page.waitForTimeout(Number(values.wait));
  }
  for (const kind of order) {
    const arg = queues[kind].shift()!;
    if (kind === "click") {
      // Prefer an accessible role/name match, fall back to any visible text.
      const byRole = h.page
        .getByRole("button", { name: arg })
        .or(h.page.getByRole("link", { name: arg }));
      const target = (await byRole.count()) > 0 ? byRole.first() : h.page.getByText(arg).first();
      await target.click();
    } else if (kind === "fill") {
      const i = arg.indexOf("=");
      await h.page.getByLabel(arg.slice(0, i)).fill(arg.slice(i + 1));
    } else {
      await h.page.keyboard.press(arg);
    }
    await h.page.waitForTimeout(Number(values.wait));
  }
  if (values.eval) {
    log.push(`[eval] ${JSON.stringify(await h.page.evaluate(values.eval))}`);
  }
  await h.page.waitForTimeout(Number(values.wait));

  const shot = { path: resolve(outDir, "screenshot.png") };
  if (values.selector) await h.page.locator(values.selector).first().screenshot(shot);
  else await h.page.screenshot(shot);
  await writeFile(resolve(outDir, "aria.yaml"), await h.page.locator("body").ariaSnapshot());
  await writeFile(resolve(outDir, "text.txt"), await h.page.locator("body").innerText());
  await writeFile(resolve(outDir, "console.log"), log.join("\n") + "\n");
  console.log(`captured -> ${outDir}\n  screenshot.png  aria.yaml  text.txt  console.log`);
} finally {
  await teardownHarness(h);
  if (saveScratch) await rm(saveScratch, { recursive: true, force: true }).catch(() => {});
}
