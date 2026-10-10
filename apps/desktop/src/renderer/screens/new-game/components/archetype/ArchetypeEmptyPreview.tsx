import { Target } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card.js";
import { GlassCard } from "@/components/ui/glass-card.js";

export function ArchetypeEmptyPreview() {
  return (
    <GlassCard glassVariant="liquid-refract">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>Consequences</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Select an archetype to see its consequences.
        </p>
      </CardContent>
    </GlassCard>
  );
}
