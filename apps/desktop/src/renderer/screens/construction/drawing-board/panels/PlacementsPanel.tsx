import { useState } from "react";
import { ZONE_IDS, type ComponentDef, type DesignDraft, type ZoneId } from "@bluewave/ship-design";
import { Button } from "../../../../components/ui/button.js";
import type { DrawingBoardContent } from "../content.js";
import { NumberField, SelectField } from "../fields.js";
import { Panel } from "./Panel.js";
import type { Edit } from "./types.js";

function midStation(content: DrawingBoardContent, draft: DesignDraft, zone: ZoneId): number {
  const z = content.hullForms
    .find((f) => f.id === draft.hull.hullFormId)
    ?.zones.find((q) => q.id === zone);
  return z ? Math.floor((z.startPermille + z.endPermille) / 2) : 500;
}

export function PlacementsPanel({
  draft,
  content,
  month,
  edit,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly month: string;
  readonly edit: Edit;
}) {
  const defs = new Map(content.components.map((c) => [c.id, c]));
  const [componentId, setComponentId] = useState(content.components[0]!.id);
  const [zoneId, setZoneId] = useState<ZoneId>("SUPERSTRUCTURE");
  const def = defs.get(componentId);
  const zones = (def?.allowedZones as ZoneId[] | undefined) ?? [...ZONE_IDS];
  const zone = zones.includes(zoneId) ? zoneId : zones[0]!;
  const add = () => {
    let n = 1;
    while (draft.placements.some((p) => p.instanceId === `${componentId}_${n}`)) n++;
    edit({
      kind: "add_placement",
      placement: {
        instanceId: `${componentId}_${n}`,
        componentId,
        zoneId: zone,
        stationPermille: midStation(content, draft, zone),
      },
    });
  };
  return (
    <Panel title="Components and arrangement">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="p-1">Fitting</th>
              <th className="p-1">Zone</th>
              <th className="p-1">Station</th>
              <th className="p-1">Settings</th>
              <th className="p-1">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {draft.placements.map((p) => {
              const d = defs.get(p.componentId);
              return (
                <tr key={p.instanceId} className="border-t align-top">
                  <th scope="row" className="p-1 text-left font-normal">
                    <div>{d?.displayName ?? p.componentId}</div>
                    <div className="text-xs text-muted-foreground">{p.instanceId}</div>
                  </th>
                  <td className="p-1">{p.zoneId.replaceAll("_", " ").toLowerCase()}</td>
                  <td className="w-24 p-1">
                    <NumberField
                      label={`Station of ${p.instanceId}`}
                      unit="‰"
                      value={p.stationPermille}
                      onCommit={(v) =>
                        edit({
                          kind: "move_placement",
                          instanceId: p.instanceId,
                          zoneId: p.zoneId,
                          stationPermille: v,
                        })
                      }
                    />
                  </td>
                  <td className="p-1">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(d?.parameters ?? {}).map(([name, r]) => (
                        <NumberField
                          key={name}
                          className="w-24"
                          label={`${name} of ${p.instanceId}`}
                          min={r.min}
                          max={r.max}
                          step={r.step}
                          value={p.params?.[name] ?? r.min}
                          onCommit={(v) =>
                            edit({
                              kind: "set_param",
                              instanceId: p.instanceId,
                              param: name,
                              value: v,
                            })
                          }
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${p.instanceId}`}
                      onClick={() => edit({ kind: "remove_placement", instanceId: p.instanceId })}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t pt-3">
        <SelectField
          className="min-w-56"
          label="Add component"
          value={componentId}
          options={content.components.map((c: ComponentDef) => ({
            value: c.id,
            label:
              c.introduction.fromMonth > month
                ? `${c.displayName} (from ${c.introduction.fromMonth})`
                : c.displayName,
          }))}
          onChange={setComponentId}
        />
        <SelectField
          className="min-w-44"
          label="Zone"
          value={zone}
          options={zones.map((z) => ({ value: z, label: z.replaceAll("_", " ").toLowerCase() }))}
          onChange={(v) => setZoneId(v as ZoneId)}
        />
        <Button onClick={add}>Add to ship</Button>
      </div>
    </Panel>
  );
}
