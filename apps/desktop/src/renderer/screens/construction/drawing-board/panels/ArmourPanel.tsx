import type { DesignDraft } from "@bluewave/ship-design";
import { Button } from "../../../../components/ui/button.js";
import { NumberField } from "../fields.js";
import { Panel } from "./Panel.js";
import type { Edit } from "./types.js";

export function ArmourPanel({ draft, edit }: { readonly draft: DesignDraft; readonly edit: Edit }) {
  return (
    <Panel title="Protection">
      {draft.armour.regions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No armour fitted. The brief{" "}
          {draft.requirement.protectionGoal === "NONE" ? "accepts" : "does not accept"} an
          unprotected ship.
        </p>
      ) : (
        <ul className="space-y-2">
          {draft.armour.regions.map((r) => (
            <li key={r.region} className="flex flex-wrap items-end gap-3">
              <span className="w-40 text-sm">
                {r.region.replaceAll("_", " ").toLowerCase()}{" "}
                <span className="text-xs text-muted-foreground">
                  ({r.materialId.replaceAll("_", " ")})
                </span>
              </span>
              <NumberField
                className="w-32"
                label={`Thickness of ${r.region}`}
                unit="mm"
                value={r.thicknessUm}
                scale={1000}
                onCommit={(v) =>
                  edit({ kind: "set_armour_region", region: { ...r, thicknessUm: v } })
                }
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${r.region}`}
                onClick={() => edit({ kind: "remove_armour_region", region: r.region })}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
