import { useRef, useState } from "react";
import type { DesignDraft, WorkshopView } from "@bluewave/ship-design";
import { Button } from "../../../../components/ui/button.js";
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
      <div className="flex flex-wrap gap-2">
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
      </div>
      {message !== null && (
        <p role="status" className={message.tone === "ok" ? "text-sm" : "text-sm text-red-700"}>
          {message.text}
        </p>
      )}
    </Panel>
  );
}
