import { writeFileSync, renameSync, rmSync, existsSync } from "node:fs";

export class RecoveryManager {
  static revert(saveDir: string, previousSaveId: string): boolean {
    const pointerPath = `${saveDir}/pointer.json`;
    try {
      const pointerContent = {
        activeSaveId: previousSaveId,
        recoveredAt: new Date().toISOString(),
      };
      const tmpPath = `${pointerPath}.tmp`;
      writeFileSync(tmpPath, JSON.stringify(pointerContent, null, 2), "utf8");
      renameSync(tmpPath, pointerPath);
      return true;
    } catch {
      return false;
    }
  }
}

export function cleanup(tempPath: string): void {
  if (existsSync(tempPath)) {
    rmSync(tempPath, { recursive: true, force: true });
  }
}
