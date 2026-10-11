Recommendation

For the authored content under `content/production/1880/` and its `ship-building/` subtree, I would keep YAML as the authoring format, rather than migrating the content itself to pure TypeScript.

However, I would not load and interpret raw YAML directly during normal gameplay. For a production-ready Electron/React game, the strongest architecture is:

YAML source content
        ↓
build-time parsing and validation
        ↓
cross-file reference validation
        ↓
normalized, deterministic generated artifacts
        ↓
packaged game content consumed at runtime

In other words:

YAML for declarative game content, TypeScript for schemas, validation, compilation, behavior, and runtime APIs.

Your content tree strongly suggests data-driven content: production rules, nations, ship designs, technologies, availability, prerequisites, costs, statistics, and identifiers. That is precisely where YAML remains useful.

Why I would not migrate everything to TypeScript

Pure TypeScript would give you excellent editor integration and compile-time validation:

export const protectedCruiser = {
  id: "protected-cruiser",
  eraId: "pre-dreadnought",
  productionCost: 4200,
  buildTimeMonths: 18,
} as const satisfies ShipDesignDefinition;

The satisfies operator checks that an expression conforms to a type while preserving its more precise inferred type. That makes it particularly effective for configuration objects.

But this only protects TypeScript expressions at compile time. It does not replace runtime validation for content read from files, save games, mods, downloaded packages, or external tools. Type information is removed from emitted JavaScript.

Migrating all content to TypeScript would also create several disadvantages:

Content becomes executable source code rather than inert data.
Designers must understand TypeScript syntax, imports, exports, and compiler errors.
Content changes participate in the application compilation graph.
Modding and external content tooling become harder.
Loading arbitrary content modules creates a security boundary you do not need.
Circular imports and package-boundary violations can creep into what should be simple data.
Content authors may start putting calculations and behavior directly into definitions.
Diff readability can deteriorate through imports, helper functions, spreads, and abstraction.

The last point is particularly important. A production content system should prevent definitions from gradually becoming a second, poorly governed application codebase.

The boundary I recommend
Keep in YAML

Use YAML for declarative facts:

Era definitions
Hull and ship-design catalogues
Production costs
Construction durations
Technology prerequisites
Nation availability
Shipyard requirements
Component compatibility
Stat modifiers
AI weighting parameters
Unlock conditions expressed through a constrained rule format
Localization keys
Stable references to assets and other definitions

Example:

schemaVersion: 1
id: protected-cruiser-1890
kind: ship-design

eraId: pre-dreadnought
nameKey: ship.protectedCruiser1890.name

availability:
  startYear: 1890
  requiredTechnologies:
    - protective-deck
    - triple-expansion-engine

production:
  baseCost: 4200
  buildTimeMonths: 18
  minimumShipyardLevel: 2

hull:
  displacementTons: 4800
  role: cruiser

Keep in TypeScript

Use TypeScript for behavior and infrastructure:

Validation schemas
Domain types
Content repository interfaces
Content compiler
Reference resolver
Formula evaluation
Technology prerequisite evaluation
Production cost calculation
Balance analysis
Migration logic
Diagnostics
Asset resolution
Runtime query APIs
AI behavior
Game rules

For example, YAML can state:

production:
  baseCost: 4200
  buildTimeMonths: 18

But TypeScript should determine:

final cost =
  base cost
  × national industrial modifier
  × shipyard efficiency
  × material availability
  × wartime pressure

Do not place executable formulas such as this in YAML:

cost: "baseCost *nation.industryModifier* shipyard.efficiency"

unless you deliberately implement a small, validated domain-specific expression language. Never evaluate content expressions with eval, new Function, or dynamically imported JavaScript.

Recommended production architecture

1. Authoring layer
Your current layout is scenario-rooted, not era-rooted, and split per nation:

content/
  production/
    1880/                      # the 1880 scenario pack
      pack.json                # manifest the compiler loads
      designs.yaml             # campaign designs, batched in one file
      ship-building/
        components.yaml
        naval-profiles/<nation>.yaml
        reference-designs/<nation>/
          starters.yaml
          historical.yaml

If and when you introduce multiple eras or scenarios, I would consider an era-rooted path that exposes ownership and identity more clearly:

content/production/eras/<era-id>/designs/<design-id>.yaml

For example:

content/production/eras/pre-dreadnought/designs/protected-cruiser-1890.yaml

This scales better once you introduce multiple eras, national variants, overrides, scenarios, or downloadable content.

1. Schema layer

Maintain one authoritative schema in TypeScript. Validation is already on Effect Schema (the `content-schema` Zod → Effect Schema migration, ADR-0102/ADR-0105), so the schema layer uses Effect Schema today. The architectural requirement is more important than the specific validation library:

packages/
  content-schema/
    src/
      design.ts
      nation.ts
      naval-profile.ts
      port.ts
      possession.ts
      route.ts
      ship-component.ts
      technology.ts
      manifest.ts
      schema-validator.ts

The schema should validate more than primitive field types. It should enforce domain invariants such as:

id follows a canonical format.
buildTimeMonths is a positive integer.
startYear is within the era’s supported range.
minimumShipyardLevel refers to a supported level.
Every referenced technology exists.
Every design ID is globally unique.
A ship cannot require itself.
Unlock graphs are acyclic.
Nation restrictions reference valid nation IDs.
Localization keys exist.
Asset references resolve.
Deprecated identifiers are rejected or explicitly migrated.

A structurally valid file is not necessarily valid game content.

1. Content compilation layer

Add a dedicated command such as:

pnpm content:check
pnpm content:build

The compiler should:

Discover allowed content files.
Parse YAML using a strict configuration.
Reject duplicate mapping keys.
Reject unsupported YAML tags.
Restrict aliases and anchors.
Validate every document against its schema.
Normalize omitted optional values.
Resolve cross-file references.
Detect duplicate IDs.
Detect dependency cycles.
Verify localization and asset references.
Sort output deterministically.
Generate runtime artifacts.
Produce actionable diagnostics with filename and field path.

A good error should look like this:

CONTENT_REFERENCE_NOT_FOUND

File:
content/production/eras/pre-dreadnought/designs/protected-cruiser-1890.yaml

Path:
availability.requiredTechnologies[1]

Referenced ID:
triple-expansion-engne

Did you mean:
triple-expansion-engine

That results in a much better authoring experience than a generic Invalid input exception.

1. Generated runtime artifacts

Compile content into a generated directory:

generated/
  content/
    manifest.json
    ship-designs.json
    eras.json

Or, if literal TypeScript inference is genuinely useful to internal tooling:

generated/
  content/
    manifest.generated.ts
    ship-designs.generated.ts

The generated files should never be manually edited.

For most game content, I prefer normalized JSON or another inert format over generated TypeScript. It provides:

No code execution
Simple hashing
Deterministic packaging
Easier patch generation
Easier inspection
Language-independent tooling
Cleaner separation between content and application code

Generated TypeScript is useful when internal development tools need literal unions such as:

type ShipDesignId =
  | "protected-cruiser-1890"
  | "coastal-battleship-1892";

You can generate those ID types separately without converting the authoritative content files to TypeScript.

Runtime rules for Electron

In your Electron architecture, I would enforce these boundaries:

Main process
Locates the packaged content manifest.
Verifies expected content version or hash if necessary.
Reads compiled inert content.
Exposes only narrow content-query capabilities when needed.
Preload
Exposes a minimal validated API.
Does not expose filesystem paths.
Does not expose generic file-reading methods.
Does not expose YAML parsing.
Renderer
Receives normalized domain DTOs.
Does not know whether source content was authored in YAML.
Does not parse YAML.
Does not import arbitrary content modules.
Does not receive unrestricted filesystem access.

Example boundary:

interface ContentApi {
  getShipDesign(id: ShipDesignId): Promise<ShipDesignDto | null>;
  listShipDesigns(filter: ShipDesignFilter): Promise<readonly ShipDesignSummaryDto[]>;
}

Avoid an API like:

readContentFile(path: string): Promise<unknown>;

The first API expresses a game capability. The second exposes filesystem infrastructure and expands the attack surface.

When pure TypeScript would actually be better

I would use TypeScript directly when the “content” is really code:

Procedural generation algorithms
Complex target-selection logic
AI strategies
Stateful event handlers
Simulation formulas
React component registries
Factories holding service dependencies
Behavior requiring cancellation or lifecycle management
Logic that must use discriminated unions exhaustively

TypeScript may also be reasonable if all of the following are true:

Only engineers edit the content.
Modding is permanently out of scope.
There are relatively few definitions.
Definitions require extensive literal-type inference.
Every content change is expected to trigger a complete application build.
You can enforce that definition modules remain data-only.

Even under those conditions, your production and ship-design catalogue sounds more like domain data than behavior.

Decision matrix
Requirement YAML Pure TypeScriptDesigner-friendly editing Strong Weak
Mod support Strong Weak
External tooling Strong Moderate
Inert, non-executable content Strong Weak
Compile-time editor feedback Moderate Strong
Runtime validation still required Yes Sometimes
Literal inference Weak Strong
Easy deterministic packaging Strong Moderate
Complex behavior Weak Strong
Separation between content and code Strong Moderate
Safe loading of third-party definitions Stronger Poor
Final decision

I would adopt the following rule for your game:

All declarative game definitions remain versioned YAML. All behavior remains TypeScript. YAML is compiled and comprehensively validated during development, CI, packaging, and optionally mod installation. The renderer consumes only normalized runtime content through typed domain APIs.

So the desired architecture is not:

YAML versus TypeScript

It is:

YAML authoring

+ TypeScript schemas
+ domain-level validation
+ deterministic content compilation
+ safe generated runtime artifacts

That gives you the maintainability and content scalability of a data-driven game without sacrificing the type safety expected from a production-grade TypeScript codebase.

Suggested implementation commit:

feat(content): add validated YAML content compilation pipeline
