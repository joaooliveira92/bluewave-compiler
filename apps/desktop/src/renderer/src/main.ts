interface CompileResult {
  success: boolean;
  snapshotHash?: string;
  contentArtifactHash?: string;
  nations?: Array<{ id: string; name: string }>;
  diagnostics: Array<{ code: string; severity: string; message: string }>;
  error?: string;
}

interface ProjectResult {
  ok: boolean;
  canceled?: boolean;
  name?: string;
  path?: string;
  error?: string;
}

interface ElectronAPI {
  compile: (dirPath?: string) => Promise<CompileResult>;
  openProject: () => Promise<ProjectResult>;
  newProject: () => Promise<ProjectResult>;
  saveProject: () => Promise<ProjectResult>;
  saveProjectAs: () => Promise<ProjectResult>;
}

const api = (window as unknown as { electronAPI: ElectronAPI }).electronAPI;

const newBtn = document.getElementById("newBtn") as HTMLButtonElement;
const openBtn = document.getElementById("openBtn") as HTMLButtonElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const saveAsBtn = document.getElementById("saveAsBtn") as HTMLButtonElement;
const compileBtn = document.getElementById("compileBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const outputEl = document.getElementById("output") as HTMLDivElement;

let projectName: string | null = null;

function setStatus(text: string, className = ""): void {
  statusEl.textContent = text;
  statusEl.className = className;
}

function setError(err: string): void {
  setStatus(err, "error");
}

function setProjectUi(name: string | null): void {
  projectName = name;
  const hasProject = name !== null;
  saveBtn.disabled = !hasProject;
  saveAsBtn.disabled = !hasProject;
  compileBtn.disabled = !hasProject;
}

async function handleOpen(): Promise<void> {
  try {
    const result = await api.openProject();
    if (result.canceled) return;
    if (!result.ok) {
      setError(`Could not open project: ${result.error ?? "unknown error"}`);
      return;
    }
    setProjectUi(result.name ?? null);
    setStatus(`Opened project "${result.name}" (${result.path})`, "success");
    outputEl.className = "";
    outputEl.textContent = "";
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
  }
}

async function handleNew(): Promise<void> {
  try {
    const result = await api.newProject();
    if (result.canceled) return;
    if (!result.ok) {
      setError(`Could not create project: ${result.error ?? "unknown error"}`);
      return;
    }
    setProjectUi(result.name ?? null);
    setStatus(`Created project "${result.name}" from ${result.path}`, "success");
    outputEl.className = "";
    outputEl.textContent = "";
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
  }
}

async function handleSave(): Promise<void> {
  try {
    const result = await api.saveProject();
    if (result.canceled) return;
    if (!result.ok) {
      setError(`Could not save project: ${result.error ?? "unknown error"}`);
      return;
    }
    setStatus(`Saved project "${result.name}" (${result.path})`, "success");
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
  }
}

async function handleSaveAs(): Promise<void> {
  try {
    const result = await api.saveProjectAs();
    if (result.canceled) return;
    if (!result.ok) {
      setError(`Could not save project: ${result.error ?? "unknown error"}`);
      return;
    }
    setStatus(`Saved project as "${result.name}" (${result.path})`, "success");
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
  }
}

async function handleCompile(): Promise<void> {
  compileBtn.disabled = true;
  setStatus("Compiling...");
  outputEl.textContent = "";
  outputEl.className = "";

  try {
    const result = await api.compile();

    if (result.success) {
      setStatus("Compilation successful!", "success");
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
      setStatus("Compilation failed", "error");
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
    setStatus("Unexpected error", "error");
    outputEl.className = "error";
    outputEl.textContent = err instanceof Error ? err.message : String(err);
  } finally {
    compileBtn.disabled = projectName === null;
  }
}

newBtn.addEventListener("click", handleNew);
openBtn.addEventListener("click", handleOpen);
saveBtn.addEventListener("click", handleSave);
saveAsBtn.addEventListener("click", handleSaveAs);
compileBtn.addEventListener("click", handleCompile);
