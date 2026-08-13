import { useState } from "react";

import { Alert, AlertDescription } from "./components/ui/alert.js";
import { Button } from "./components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.js";
import { ScrollArea } from "./components/ui/scroll-area.js";
import { Spinner } from "./components/ui/spinner.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs.js";
import { api, extractSnapshotSubset, type ProjectResult } from "./electronApi.js";

interface StatusState {
  text: string;
  variant: "default" | "destructive";
}

function diagnosticsToLines(
  error: string | undefined,
  diagnostics: Array<{ code: string; severity: string; message: string }>,
): string {
  const lines: string[] = [];
  if (error) lines.push(`Error: ${error}`);
  for (const d of diagnostics) {
    lines.push(`[${d.severity}] ${d.code}: ${d.message}`);
  }
  return lines.join("\n");
}

export function App() {
  const [projectName, setProjectName] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [output, setOutput] = useState("");
  const [compiling, setCompiling] = useState(false);

  const [saveStatus, setSaveStatus] = useState<StatusState | null>(null);
  const [saveOutput, setSaveOutput] = useState("");
  const [loadingSave, setLoadingSave] = useState(false);

  const hasProject = projectName !== null;

  async function runProjectAction(
    action: () => Promise<ProjectResult>,
    errorPrefix: string,
    successMessage: (result: ProjectResult) => string,
    onSuccess?: (result: ProjectResult) => void,
  ): Promise<void> {
    try {
      const result = await action();
      if (result.canceled) return;
      if (!result.ok) {
        setStatus({ text: `${errorPrefix}: ${result.error ?? "unknown error"}`, variant: "destructive" });
        return;
      }
      onSuccess?.(result);
      setStatus({ text: successMessage(result), variant: "default" });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  }

  function handleOpen(): Promise<void> {
    return runProjectAction(
      api.openProject,
      "Could not open project",
      (r) => `Opened project "${r.name}" (${r.path})`,
      (r) => {
        setProjectName(r.name ?? null);
        setOutput("");
      },
    );
  }

  function handleNew(): Promise<void> {
    return runProjectAction(
      api.newProject,
      "Could not create project",
      (r) => `Created project "${r.name}" from ${r.path}`,
      (r) => {
        setProjectName(r.name ?? null);
        setOutput("");
      },
    );
  }

  function handleSave(): Promise<void> {
    return runProjectAction(
      api.saveProject,
      "Could not save project",
      (r) => `Saved project "${r.name}" (${r.path})`,
    );
  }

  function handleSaveAs(): Promise<void> {
    return runProjectAction(
      api.saveProjectAs,
      "Could not save project",
      (r) => `Saved project as "${r.name}" (${r.path})`,
    );
  }

  async function handleCompile(): Promise<void> {
    setCompiling(true);
    setStatus({ text: "Compiling...", variant: "default" });
    setOutput("");

    try {
      const result = await api.compile();
      if (result.success) {
        setStatus({ text: "Compilation successful!", variant: "default" });
        setOutput(
          JSON.stringify(
            {
              snapshotHash: result.snapshotHash,
              contentArtifactHash: result.contentArtifactHash,
              nations: result.nations,
            },
            null,
            2,
          ),
        );
      } else {
        setStatus({ text: "Compilation failed", variant: "destructive" });
        setOutput(diagnosticsToLines(result.error, result.diagnostics));
      }
    } catch (err) {
      setStatus({ text: "Unexpected error", variant: "destructive" });
      setOutput(err instanceof Error ? err.message : String(err));
    } finally {
      setCompiling(false);
    }
  }

  async function handleLoadCampaignSave(): Promise<void> {
    setLoadingSave(true);
    setSaveStatus({ text: "Loading campaign save...", variant: "default" });
    setSaveOutput("");

    try {
      const result = await api.loadCampaignSave();

      if (!result.success && result.error === "No directory selected") {
        setSaveStatus(null);
        return;
      }

      if (result.success && result.snapshot) {
        setSaveStatus({ text: "Campaign save loaded!", variant: "default" });
        setSaveOutput(JSON.stringify(extractSnapshotSubset(result.snapshot), null, 2));
      } else {
        setSaveStatus({ text: "Load failed", variant: "destructive" });
        setSaveOutput(diagnosticsToLines(result.error, result.diagnostics));
      }
    } catch (err) {
      setSaveStatus({ text: "Unexpected error", variant: "destructive" });
      setSaveOutput(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingSave(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Bluewave Campaign Compiler</h1>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="viewer">Campaign Save Viewer</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle>Content Project</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleNew}>
                  New Project
                </Button>
                <Button variant="outline" onClick={handleOpen}>
                  Open Project
                </Button>
                <Button variant="outline" onClick={handleSave} disabled={!hasProject}>
                  Save Project
                </Button>
                <Button variant="outline" onClick={handleSaveAs} disabled={!hasProject}>
                  Save Project As
                </Button>
                <Button onClick={handleCompile} disabled={!hasProject || compiling}>
                  {compiling && <Spinner />}
                  Compile Campaign
                </Button>
              </div>

              {status ? (
                <Alert variant={status.variant}>
                  <AlertDescription>{status.text}</AlertDescription>
                </Alert>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click &quot;New Project&quot; to create one from a content directory, or
                  &quot;Open Project&quot; to load an existing .bluewave project.
                </p>
              )}

              {output && (
                <ScrollArea className="h-64 rounded-md border">
                  <pre className="whitespace-pre-wrap p-3 text-xs">{output}</pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewer">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Save Viewer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Alert>
                <AlertDescription>
                  Viewing a campaign save is separate from your open project — nothing here
                  affects the .bluewave project you&apos;re authoring.
                </AlertDescription>
              </Alert>

              <div>
                <Button onClick={handleLoadCampaignSave} disabled={loadingSave}>
                  {loadingSave && <Spinner />}
                  Load Campaign Save
                </Button>
              </div>

              {saveStatus && (
                <Alert variant={saveStatus.variant}>
                  <AlertDescription>{saveStatus.text}</AlertDescription>
                </Alert>
              )}

              {saveOutput && (
                <ScrollArea className="h-64 rounded-md border">
                  <pre className="whitespace-pre-wrap p-3 text-xs">{saveOutput}</pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
