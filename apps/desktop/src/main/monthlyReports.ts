import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Result, Schema } from "effect";
import type { BridgeResult } from "../shared/bridge-contract.js";
import type {
  MonthlyReportEntry,
  MonthlyReports,
  ReadMonthlyReportsResult,
} from "../shared/campaign-command-contract.js";
import { getCampaignSession } from "./campaignSessions.js";
import { MonthlyReportsSchema } from "./campaignCommandSchemas.js";

/**
 * The per-campaign monthly-report history sidecar (spec §16 "Report history").
 * Main appends one derived `MonthlyReportEntry` per successful `commitMonth`,
 * pruning to the most recent {@link MONTHLY_REPORTS_LIMIT}; the renderer reads
 * it read-only for Overview's "Recent Developments". It is **never
 * authoritative**: it is a sibling of the campaign's save directory (not inside
 * a `SaveStore` save id), is not part of the envelope/hash, and is never read
 * by `MonthExecutor`. The filename lives next to `pointer.json`/save ids in
 * `saveDir`, so it is keyed by `campaignId` via location (one campaign save dir
 * == one sidecar).
 */
export const MONTHLY_REPORTS_FILENAME = "monthly-reports.json";

/** The most recent reports kept in the sidecar (spec §16: "most recent 12"). */
export const MONTHLY_REPORTS_LIMIT = 12;

/** Cancellation matches `SaveStore`'s convention (`error.name === "AbortError"`). */
function createAbortError(): Error {
  const error = new Error("Monthly-report write was cancelled");
  error.name = "AbortError";
  return error;
}

/** The tolerant-read fallback and the initial shape: no history yet. */
export function emptyMonthlyReports(): MonthlyReports {
  return { reports: [] };
}

/**
 * Tolerant read (acceptance: missing/corrupt -> empty, never crashes). A
 * missing file, unparseable JSON, or a shape that fails `MonthlyReportsSchema`
 * all fall back to `emptyMonthlyReports()`.
 */
export function loadMonthlyReports(saveDir: string): MonthlyReports {
  const path = join(saveDir, MONTHLY_REPORTS_FILENAME);
  if (!existsSync(path)) {
    return emptyMonthlyReports();
  }
  try {
    const parsed = Schema.decodeUnknownResult(MonthlyReportsSchema)(
      JSON.parse(readFileSync(path, "utf8")),
    );
    if (Result.isFailure(parsed)) {
      return emptyMonthlyReports();
    }
    return parsed.success;
  } catch {
    return emptyMonthlyReports();
  }
}

/**
 * Atomic write (tmp file -> rename, matching `SaveStore.save`'s pointer
 * publish / ENGINEERING-CONTRACT "Save atomically"): the final
 * `monthly-reports.json` path is never left partially written, and a failed
 * write removes the tmp artifact. Cancellation is checked before any fs work;
 * unlike an authoritative save there is no pointer to advance (this is
 * app-owned history, not a campaign save).
 */
export function saveMonthlyReports(
  saveDir: string,
  data: MonthlyReports,
  signal?: AbortSignal,
): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
  const path = join(saveDir, MONTHLY_REPORTS_FILENAME);
  const tmpPath = `${path}.tmp`;
  try {
    writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
    renameSync(tmpPath, path);
  } catch (err) {
    rmSync(tmpPath, { force: true });
    throw err;
  }
}

/** Prepend the newest report and prune to the limit (spec §16). */
export function appendMonthlyReport(
  data: MonthlyReports,
  report: MonthlyReportEntry,
): MonthlyReports {
  return { reports: [report, ...data.reports].slice(0, MONTHLY_REPORTS_LIMIT) };
}

/**
 * `readMonthlyReports(sessionId) -> { reports }`. Reads the session's sidecar,
 * tolerantly (missing/corrupt -> empty). The renderer renders the returned
 * entries read-only; main is the only writer.
 */
export async function readMonthlyReports(
  sessionId: string,
): Promise<BridgeResult<ReadMonthlyReportsResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }
  return {
    outcome: "success",
    value: { reports: loadMonthlyReports(record.saveDir).reports },
    diagnostics: [],
  };
}
