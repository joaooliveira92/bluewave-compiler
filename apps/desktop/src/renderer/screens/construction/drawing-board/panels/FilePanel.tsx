import { useRef, useState } from "react";
import type { DesignDraft, WorkshopView } from "@bluewave/ship-design";
import { Alert } from "../../../../components/ui/alert.js";
import { Button } from "../../../../components/ui/button.js";
import { ButtonGroup } from "../../../../components/ui/button-group.js";
import type { DrawingBoardContent } from "../content.js";
import { designFileName, exportDesign, importDesign } from "../designFile.js";
import { Panel } from "./Panel.js";

/** Save the working design to a `.bwdesign` file, or open one as the working design (history resets). */
export function FilePanel({
  draft,
  view,
  content,
  presetName,
  onLoad,
}: {
  readonly draft: DesignDraft;
  readonly view: WorkshopView;
  readonly content: DrawingBoardContent;
  readonly presetName: string;
  readonly onLoad: (draft: DesignDraft) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const save = () => {
    const text = exportDesign(draft, content.components, view.compiled);
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = designFileName(presetName);
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: "ok", text: `Saved ${a.download}.` });
  };
  const open = async (file: File) => {
    const r = importDesign(await file.text(), content.components);
    if (!r.ok) return setMessage({ tone: "bad", text: r.error });
    onLoad(r.draft);
    setMessage({ tone: "ok", text: ["Design opened.", ...r.notes].join(" ") });
  };
  return (
    <Panel title="Design file">
      <ButtonGroup aria-label="Design file actions">
        <Button variant="outline" onClick={save}>
          Save design file
        </Button>
        <Button variant="outline" onClick={() => input.current?.click()}>
          Open design file
        </Button>
        <input
          ref={input}
          type="file"
          accept=".bwdesign,application/json"
          aria-label="Design file"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void open(f);
          }}
        />
      </ButtonGroup>
      {message !== null && (
        <Alert role="status" variant={message.tone === "ok" ? "default" : "destructive"}>
          {message.text}
        </Alert>
      )}
    </Panel>
  );
}
