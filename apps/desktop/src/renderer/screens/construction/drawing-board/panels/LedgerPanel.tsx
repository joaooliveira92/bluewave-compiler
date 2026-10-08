import type { WorkshopView } from "@bluewave/ship-design";
import { Panel } from "./Panel.js";

export function LedgerPanel({ view }: { readonly view: WorkshopView }) {
  return (
    <Panel title="Weight summary">
      <div className="flex h-3 w-full overflow-hidden rounded bg-muted" aria-hidden="true">
        {view.ledger.map((r, i) => (
          <div
            key={r.category}
            title={r.category}
            style={{ width: `${r.shareBp / 100}%`, opacity: 0.35 + (i % 4) * 0.2 }}
            className="bg-primary"
          />
        ))}
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Displacement ledger</caption>
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th scope="col">Category</th>
            <th scope="col" className="text-right">
              Tonnes
            </th>
            <th scope="col" className="text-right">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {view.ledger.map((r) => (
            <tr key={r.category} className="border-t">
              <th scope="row" className="text-left font-normal">
                {r.category}
              </th>
              <td className="text-right tabular-nums">
                {Math.round(r.kg / 1000).toLocaleString("en-US")}
              </td>
              <td className="text-right tabular-nums">{(r.shareBp / 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t font-medium">
            <th scope="row" className="text-left">
              Total / buoyancy at design draught
            </th>
            <td className="text-right tabular-nums" colSpan={2}>
              {Math.round(view.totalKg / 1000).toLocaleString("en-US")} t /{" "}
              {Math.round(view.buoyantKg / 1000).toLocaleString("en-US")} t
            </td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  );
}
