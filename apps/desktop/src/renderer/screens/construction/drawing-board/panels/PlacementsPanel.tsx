import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  ZONE_IDS,
  type ComponentDef,
  type DesignDraft,
  type PlacementSpec,
  type WorkshopView,
  type ZoneId,
} from "@bluewave/ship-design";
import { Badge } from "../../../../components/ui/badge.js";
import { Button } from "../../../../components/ui/button.js";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../../../../components/ui/context-menu.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu.js";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../../../components/ui/hover-card.js";
import { buttonVariants } from "../../../../components/ui/button.js";
import { cn } from "../../../../lib/utils.js";
import { componentFacts, componentsByCategory } from "../componentFacts.js";
import type { DrawingBoardContent } from "../content.js";
import { NumberField, SelectField } from "../fields.js";
import { Panel } from "./Panel.js";
import type { Edit } from "./types.js";

const zoneLabel = (z: string) => z.replaceAll("_", " ").toLowerCase();

function midStation(content: DrawingBoardContent, draft: DesignDraft, zone: ZoneId): number {
  const z = content.hullForms
    .find((f) => f.id === draft.hull.hullFormId)
    ?.zones.find((q) => q.id === zone);
  return z ? Math.floor((z.startPermille + z.endPermille) / 2) : 500;
}

function ComponentHover({
  def,
  placement,
  view,
}: {
  readonly def: ComponentDef | undefined;
  readonly placement: PlacementSpec;
  readonly view: WorkshopView;
}) {
  if (!def) return <span>{placement.componentId}</span>;
  const facts = componentFacts(
    def,
    view.compiled.components.find((c) => c.instanceId === placement.instanceId),
  );
  return (
    <HoverCard>
      <HoverCardTrigger
        render={<button type="button" />}
        className="cursor-help text-left underline decoration-dotted underline-offset-2"
      >
        {facts.name}
      </HoverCardTrigger>
      <HoverCardContent className="space-y-2 text-sm">
        <div className="font-medium">{facts.name}</div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{facts.category}</Badge>
          {facts.tags.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-x-3 tabular-nums">
          <dt className="text-muted-foreground">Available from</dt>
          <dd className="text-right">{facts.introduced}</dd>
          {facts.obsolete !== null && (
            <>
              <dt className="text-muted-foreground">Obsolete from</dt>
              <dd className="text-right">{facts.obsolete}</dd>
            </>
          )}
          {facts.placed !== null && (
            <>
              <dt className="text-muted-foreground">Weight as fitted</dt>
              <dd className="text-right">
                {facts.placed.weightT.toLocaleString("en-US", { maximumFractionDigits: 1 })} t
              </dd>
              <dt className="text-muted-foreground">Cost as fitted</dt>
              <dd className="text-right">
                £{Math.round(facts.placed.costGbp).toLocaleString("en-US")}
              </dd>
            </>
          )}
        </dl>
      </HoverCardContent>
    </HoverCard>
  );
}

export function PlacementsPanel({
  draft,
  content,
  month,
  view,
  edit,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly month: string;
  readonly view: WorkshopView;
  readonly edit: Edit;
}) {
  const defs = new Map(content.components.map((c) => [c.id, c]));
  const [zoneId, setZoneId] = useState<ZoneId>("SUPERSTRUCTURE");
  const nextId = (componentId: string) => {
    let n = 1;
    while (draft.placements.some((p) => p.instanceId === `${componentId}_${n}`)) n++;
    return `${componentId}_${n}`;
  };
  const zonesFor = (def: ComponentDef | undefined) =>
    (def?.allowedZones as ZoneId[] | undefined) ?? [...ZONE_IDS];
  const add = (def: ComponentDef) => {
    const zones = zonesFor(def);
    const zone = zones.includes(zoneId) ? zoneId : zones[0]!;
    edit({
      kind: "add_placement",
      placement: {
        instanceId: nextId(def.id),
        componentId: def.id,
        zoneId: zone,
        stationPermille: midStation(content, draft, zone),
      },
    });
  };
  const duplicate = (p: PlacementSpec) =>
    edit({ kind: "add_placement", placement: { ...p, instanceId: nextId(p.componentId) } });
  const moveTo = (p: PlacementSpec, zone: ZoneId) =>
    edit({
      kind: "move_placement",
      instanceId: p.instanceId,
      zoneId: zone,
      stationPermille: midStation(content, draft, zone),
    });
  const remove = (p: PlacementSpec) => edit({ kind: "remove_placement", instanceId: p.instanceId });

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
              const otherZones = zonesFor(d).filter((z) => z !== p.zoneId);
              return (
                <ContextMenu key={p.instanceId}>
                  <ContextMenuTrigger render={<tr className="border-t align-top" />}>
                    <th scope="row" className="p-1 text-left font-normal">
                      <ComponentHover def={d} placement={p} view={view} />
                      <div className="text-xs text-muted-foreground">{p.instanceId}</div>
                    </th>
                    <td className="p-1">
                      <Badge variant="outline">{zoneLabel(p.zoneId)}</Badge>
                    </td>
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove ${p.instanceId}`}
                          onClick={() => remove(p)}
                        >
                          Remove
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`More actions for ${p.instanceId}`}
                            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => duplicate(p)}>
                              Duplicate
                            </DropdownMenuItem>
                            {otherZones.length > 0 && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Move to zone</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {otherZones.map((z) => (
                                    <DropdownMenuItem key={z} onClick={() => moveTo(p, z)}>
                                      {zoneLabel(z)}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => remove(p)}>
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => duplicate(p)}>Duplicate</ContextMenuItem>
                    {otherZones.length > 0 && (
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Move to zone</ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          {otherZones.map((z) => (
                            <ContextMenuItem key={z} onClick={() => moveTo(p, z)}>
                              {zoneLabel(z)}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    )}
                    <ContextMenuSeparator />
                    <ContextMenuItem destructive onClick={() => remove(p)}>
                      Remove
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "default" }))}>
            Add component
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-96 overflow-y-auto">
            {componentsByCategory(content.components).map((g, i) => (
              <DropdownMenuGroup key={g.category}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{g.category}</DropdownMenuLabel>
                {g.items.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    disabled={c.introduction.fromMonth > month}
                    onClick={() => add(c)}
                  >
                    {c.displayName}
                    {c.introduction.fromMonth > month && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        from {c.introduction.fromMonth}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <SelectField
          className="min-w-44"
          label="Add to zone"
          value={zoneId}
          options={ZONE_IDS.map((z) => ({ value: z, label: zoneLabel(z) }))}
          onChange={(v) => setZoneId(v as ZoneId)}
        />
      </div>
    </Panel>
  );
}
