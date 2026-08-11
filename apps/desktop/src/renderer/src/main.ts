interface CompileResult {
  success: boolean;
  snapshotHash?: string;
  contentArtifactHash?: string;
  nations?: Array<{ id: string; name: string }>;
  diagnostics: Array<{ code: string; severity: string; message: string }>;
  error?: string;
}

interface ElectronAPI {
  compile: (dirPath?: string) => Promise<CompileResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const compileBtn = document.getElementById("compileBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const outputEl = document.getElementById("output") as HTMLDivElement;

async function handleCompile(): Promise<void> {
  compileBtn.disabled = true;
  statusEl.textContent = "Compiling...";
  outputEl.textContent = "";
  statusEl.className = "";
  outputEl.className = "";

  try {
    const result = await window.electronAPI.compile();

    if (result.success) {
      statusEl.textContent = "Compilation successful!";
      statusEl.className = "success";
      outputEl.className = "success";
      outputEl.textContent = JSON.stringify(
        {
          snapshotHash: result.snapshotHash,
          contentArtifactHash: result.contentArtifactHash,
          nations: result.nations,
        },
        null,
        2,
      );
    } else {
      statusEl.textContent = "Compilation failed";
      statusEl.className = "error";
      outputEl.className = "error";
      const lines: string[] = [];
      if (result.error) {
        lines.push(`Error: ${result.error}`);
      }
      for (const d of result.diagnostics) {
        lines.push(`[${d.severity}] ${d.code}: ${d.message}`);
      }
      outputEl.textContent = lines.join("\n");
    }
  } catch (err) {
    statusEl.textContent = "Unexpected error";
    statusEl.className = "error";
    outputEl.className = "error";
    outputEl.textContent = err instanceof Error ? err.message : String(err);
  } finally {
    compileBtn.disabled = false;
  }
}

compileBtn.addEventListener("click", handleCompile);