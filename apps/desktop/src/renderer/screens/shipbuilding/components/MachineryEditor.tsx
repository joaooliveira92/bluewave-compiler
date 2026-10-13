import type { DraftEdit } from "@bluewave/ship-design";
import { Panel } from "../../../components/design-workspace/panels/Panel.js";
import { NumberField, SelectField } from "../../../components/design-workspace/fields.js";
import type { MachineryModel } from "../machinery-view.js";

/**
 * The Machinery section, outcomes first: the editable performance targets and propulsion configuration on one
 * side, the calculated results they produce on the other. No value is both an input and an output.
 */
export function MachineryEditor({
  model,
  edit,
}: {
  readonly model: MachineryModel;
  readonly edit: (e: DraftEdit) => void;
}) {
  const { inputs, outputs, notes } = model;
  return (
    <Panel title="Machinery, fuel and range">
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Propulsion configuration" className="space-y-3">
          <h3 className="text-sm font-medium">Targets and configuration</h3>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Target speed"
              shortLabel="Target speed"
              unit="kn"
              value={inputs.targetSpeedMilliKnots}
              scale={1000}
              decimals={1}
              step={0.5}
              onCommit={(v) =>
                edit({ kind: "set_requirement", patch: { requiredSpeedMilliKnots: v } })
              }
            />
            <NumberField
              label="Cruising speed"
              shortLabel="Cruising speed"
              unit="kn"
              value={inputs.cruiseSpeedMilliKnots}
              scale={1000}
              decimals={1}
              step={0.5}
              onCommit={(v) =>
                edit({ kind: "set_requirement", patch: { cruiseSpeedMilliKnots: v } })
              }
            />
            <NumberField
              label="Operational range"
              shortLabel="Range"
              unit="nm"
              value={inputs.rangeNm}
              step={50}
              onCommit={(v) => edit({ kind: "set_requirement", patch: { requiredRangeNm: v } })}
            />
            <SelectField
              label="Propulsion plant"
              shortLabel="Plant"
              value={inputs.plantId}
              options={inputs.plantOptions.map((p) => ({
                value: p.id,
                label: p.reason === null ? p.label : `${p.label} — ${p.reason}`,
                disabled: p.disabled,
              }))}
              onChange={(v) => edit({ kind: "set_machinery", patch: { plantId: v } })}
            />
            <NumberField
              label="Installed power"
              shortLabel="Installed power"
              unit="kW"
              value={inputs.installedKw}
              step={100}
              onCommit={(v) => edit({ kind: "set_machinery", patch: { installedKw: v } })}
            />
            <NumberField
              label="Fuel capacity"
              shortLabel="Fuel capacity"
              unit="t"
              value={inputs.fuelCapacityKg}
              scale={1000}
              onCommit={(v) => edit({ kind: "set_machinery", patch: { fuelCapacityKg: v } })}
            />
          </div>
        </section>

        <section aria-label="Calculated results" className="space-y-3">
          <h3 className="text-sm font-medium">Calculated results</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm" data-testid="machinery-outputs">
            {outputs.map((o) => (
              <div
                key={o.id}
                className="flex items-baseline justify-between gap-3"
                data-output={o.id}
              >
                <dt className="text-muted-foreground">{o.label}</dt>
                <dd className="tabular-nums">{o.value}</dd>
              </div>
            ))}
          </dl>
          {notes.map((n) => (
            <p key={n} className="text-xs text-muted-foreground">
              {n}
            </p>
          ))}
        </section>
      </div>
    </Panel>
  );
}
