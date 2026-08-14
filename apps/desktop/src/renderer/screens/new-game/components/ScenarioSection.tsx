import { memo } from "react";
import type { NewGameScenario } from "../../../../shared/new-game-contract.js";
import { CardContent, CardHeader, CardTitle } from "../../../components/ui/card.js";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../../../components/ui/field.js";
import { Input } from "../../../components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { GlassCard } from "@/components/ui/glass-card.js";

export interface ScenarioSectionProps {
  readonly scenarioId: string;
  readonly campaignSeed: string;
  readonly scenarios: readonly NewGameScenario[];
  readonly selectedScenario: NewGameScenario | null;
  readonly onScenarioChange: (id: string) => void;
  readonly onSeedChange: (seed: string) => void;
}

export const ScenarioSection = memo(function ScenarioSection({
  scenarioId,
  campaignSeed,
  scenarios,
  selectedScenario,
  onScenarioChange,
  onSeedChange,
}: ScenarioSectionProps) {
  return (
    <GlassCard glassVariant="liquid-refract">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Scenario</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="scenario">Starting Scenario</FieldLabel>
            <Select value={scenarioId} onValueChange={onScenarioChange} className="w-full">
              <SelectTrigger>
                <SelectValue placeholder="Select a scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedScenario !== null && (
              <FieldDescription>
                Begins {selectedScenario.startMonth}/{selectedScenario.startYear} ·{" "}
                {selectedScenario.participantNationIds.length} nations
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="campaignSeed">Campaign Seed</FieldLabel>
            <Input
              id="campaignSeed"
              name="campaignSeed"
              value={campaignSeed}
              onChange={(event) => onSeedChange(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              inputMode="none"
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </GlassCard>
  );
});
