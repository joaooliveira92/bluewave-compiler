import { memo } from "react";
import type { SupportedConfigurationValues } from "@bluewave/campaign-engine";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card.js";
import { Field, FieldGroup, FieldLabel } from "../../../components/ui/field.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import type { DraftPreferences } from "../new-game-preferences-screen-state.js";
import { GlassCard } from "@/components/ui/glass-card.js";

const FIELD_LABELS: Record<
  Exclude<keyof DraftPreferences, "version" | "scenarioId" | "campaignSeed">,
  string
> = {
  continuityMode: "Continuity Mode",
  fleetSize: "Fleet Size",
  researchSpeed: "Research Speed",
  technologyVariation: "Technology Variation",
  historicalBudget: "Historical Budget",
  legacyFleetMode: "Legacy Fleet Mode",
  tacticalRealism: "Tactical Realism",
  difficulty: "Difficulty",
};

export interface RulesetOptionsSectionProps {
  readonly preferences: DraftPreferences;
  readonly supportedValues: SupportedConfigurationValues;
  readonly onPreferenceChange: (
    field: keyof DraftPreferences,
    value: string,
  ) => void;
}

export const RulesetOptionsSection = memo(function RulesetOptionsSection({
  preferences,
  supportedValues,
  onPreferenceChange,
}: RulesetOptionsSectionProps) {
  return (
    <GlassCard glassVariant="liquid-refract">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Ruleset Options</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <FieldGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]).map(
            (field) => {
              const values = supportedValues[field] ?? [];
              return (
                <Field key={field}>
                  <FieldLabel>{FIELD_LABELS[field]}</FieldLabel>
                  <Select
                    value={preferences[field]}
                    onValueChange={(value) => onPreferenceChange(field, value)}
                    disabled={values.length <= 1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {values.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              );
            },
          )}
        </FieldGroup>
      </CardContent>
    </GlassCard>
  );
});
