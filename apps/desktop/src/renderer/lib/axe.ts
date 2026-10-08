import axe, { type AxeResults, type Result } from "axe-core";

/**
 * Runs axe-core on a rendered container and returns the violations, formatted so a failing
 * assertion says what is wrong and where. `color-contrast` is off: jsdom has no layout or
 * styles engine, so axe cannot compute it reliably here (contrast is checked in the real app).
 */
export async function axeViolations(container: Element): Promise<string[]> {
  const results: AxeResults = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    (violation: Result) =>
      `${violation.id} (${violation.impact ?? "n/a"}): ${violation.help} — ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(" "))
        .join("; ")}`,
  );
}
