# ADR-0004: Compiler Stage Architecture

## Status

Accepted

## Context

The engineering contract requires an explicit, statically ordered, typed compiler with immutable inputs and outputs. Stages must return structured diagnostics, not perform ambient I/O, not write final artifacts, and not obtain ambient randomness.

## Decision

### Stage pipeline

The compiler follows a linear pipeline of four stages:

1. **Parse stage** — reads YAML files from the filesystem, parses them, and returns a `ParseOutput` with the manifest and collection documents. Reports file-read and YAML-parse errors.
2. **Validate stage** — validates each document against its Zod schema, checks for duplicate IDs, and validates cross-entity references (e.g., possession references a valid country and area). Reports schema errors, duplicate IDs, and missing references.
3. **Normalize stage** — sorts all entities by stable ID order. Currently minimal; future stages may add defaults, computed fields, or canonicalization.
4. **Compile stage** — produces the final canonical artifact JSON and its SHA-256 envelope. Returns the raw hash and envelope hash.

### Stage contract

- Each stage implements `CompilerStage<I, O>` with `name` and `run(input, signal, collector)`.
- `run` receives an `AbortSignal` and a `DiagnosticCollector`.
- Returns `O | undefined` — `undefined` signals failure (errors already in collector).
- Stages are composed in the `Compiler` class which iterates the pipeline in order.

### Error accumulation

- Each stage accumulates independent errors before returning.
- Downstream stages are blocked only when their prerequisites are invalid.
- A stage returning `undefined` aborts the pipeline.

## Consequences

- Clear separation of concerns: parse errors don't reach validation, validation errors don't reach compilation.
- Adding a new stage (e.g., formula resolution, reference expansion) is straightforward.
- Testing individual stages is possible in isolation.
- Cancellation is checked at each stage boundary.
