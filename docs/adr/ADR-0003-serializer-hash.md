# ADR-0003: Canonical Serialization and Hashing

## Status

Accepted

## Context

Deterministic builds require that identical content, ruleset, inputs, commands, seeds, and compatibility versions produce identical authoritative hashes across supported operating systems. JavaScript object key ordering is not guaranteed by the specification, so `JSON.stringify` alone is insufficient.

## Decision

### Canonical serializer

- `canonicalSerialize(value)` produces a JSON string with stable, sorted object keys (recursively).
- Array element order is preserved as-is.
- The serializer uses `JSON.stringify` with a `replacer` function that sorts keys of each object before serialization.

### Hashing

- Use `SHA-256` (Node.js `crypto.createHash`) for all authoritative hashing.
- `sha256Hex(data)` returns the hex-encoded hash.
- `hashWithContext(data, context)` prepends a domain-separated context string delimited by a null byte.

### Artifact envelopes

- `createEnvelope(kind, version, body)` produces a `CanonicalEnvelope` containing `algorithm`, `artifactKind`, `compatibilityVersion`, `bodyHash`, and `bodyLength`.
- `verifyEnvelope(envelope, body)` recomputes the hash and compares it to the stored envelope values.
- The envelope is serialized alongside the artifact as `artifact.sig.json`.

## Consequences

- Output is deterministic regardless of input file ordering or YAML key ordering.
- Cross-platform hash verification is possible.
- Envelope provides tamper evidence and compatibility metadata.
- Future compatibility versions can be pinned separately from the artifact format.
