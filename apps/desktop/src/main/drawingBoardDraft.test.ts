import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeLog, newLog, pushEdit, type DesignDraft } from "@bluewave/ship-design";
import { parse } from "yaml";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { dispatchCampaignCommand } from "./campaignBridge.js";
import { clearCampaignSessionsForTest, registerCampaignSession } from "./campaignSessions.js";
import { DRAWING_BOARD_DRAFT_FILENAME } from "./drawingBoardDraft.js";
import { resolveProductionPackDir } from "./contentPack.js";

const reference = (
  parse(
    readFileSync(
      join(resolveProductionPackDir(), "ship-building", "reference-designs.yaml"),
      "utf8",
    ),
  ) as { designs: { id: string; draft: DesignDraft }[] }
).designs.find((d) => d.id === "torpedo_cruiser_1880")!;

describe("Drawing Board draft sidecar", () => {
  let saveDir: string;
  beforeEach(() => {
    saveDir = mkdtempSync(join(tmpdir(), "bw-draft-"));
    // The sidecar only needs the session's save directory; the campaign state is never read.
    registerCampaignSession({
      sessionId: "s",
      saveDir,
      playerSlotId: "uk",
      campaignSeed: "a".repeat(32),
      month: { month: 1, year: 1880 },
      state: {} as never,
    });
  });
  afterEach(() => {
    rmSync(saveDir, { recursive: true, force: true });
    clearCampaignSessionsForTest();
  });

  const log = encodeLog(
    pushEdit(newLog(reference.draft), { kind: "set_machinery", patch: { installedKw: 2_500 } }),
  );

  it("keeps the working design across a restart, and removes it on request", async () => {
    expect(await dispatchCampaignCommand("readDrawingBoardDraft", "s")).toMatchObject({
      outcome: "success",
      value: { draft: null },
    });
    const w = await dispatchCampaignCommand("writeDrawingBoardDraft", {
      sessionId: "s",
      draft: { presetId: reference.id, log },
    });
    expect(w).toMatchObject({ outcome: "success", value: { saved: true } });
    const r = await dispatchCampaignCommand("readDrawingBoardDraft", "s");
    expect(r).toMatchObject({
      outcome: "success",
      value: { draft: { presetId: reference.id, log } },
    });
    await dispatchCampaignCommand("writeDrawingBoardDraft", { sessionId: "s", draft: null });
    expect(existsSync(join(saveDir, DRAWING_BOARD_DRAFT_FILENAME))).toBe(false);
  });

  it("rejects something that is not an edit log, and reads a corrupt file as no draft", async () => {
    expect(
      (
        await dispatchCampaignCommand("writeDrawingBoardDraft", {
          sessionId: "s",
          draft: { presetId: "x", log: "{}" },
        })
      ).outcome,
    ).toBe("rejected");
    writeFileSync(join(saveDir, DRAWING_BOARD_DRAFT_FILENAME), "{not json", "utf8");
    expect(await dispatchCampaignCommand("readDrawingBoardDraft", "s")).toMatchObject({
      outcome: "success",
      value: { draft: null },
    });
    expect((await dispatchCampaignCommand("readDrawingBoardDraft", "nobody")).outcome).toBe(
      "error",
    );
  });
});
