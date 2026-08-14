import { test, expect, _electron as electron } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("Electron launches and the shell boots (Playwright feasibility check)", async () => {
  const app = await electron.launch({
    args: [resolve(__dirname, "../out/main/index.js"), "--dev"],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "" },
  });

  const window = await app.waitForEvent("window", {
    predicate: (win) => !win.url().startsWith("devtools://"),
  });
  await window.waitForLoadState("load");
  await window.getByText("Bluewave Naval Staff").waitFor({ timeout: 15000 });

  const text = await window.textContent("body");
  expect(text).toContain("Bluewave");

  await app.close();
});
