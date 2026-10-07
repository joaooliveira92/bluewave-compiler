import { DEFERRED_WAR_ITEMS } from "../diplomacy-screen-state.js";

/** War-panel items the engine cannot supply yet, each with its reason (never faked). */
export function WarDeferredPanel() {
  return (
    <div className="mt-3 rounded-md border border-dashed px-3 py-2" data-testid="war-deferred">
      <p className="text-xs font-medium text-muted-foreground">Not yet modelled by the engine</p>
      <ul className="mt-1.5 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        {DEFERRED_WAR_ITEMS.map((item) => (
          <li key={item.id}>
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground"> — {item.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
