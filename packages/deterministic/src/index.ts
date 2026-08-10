import { createHash } from "node:crypto";

export interface CanonicalEnvelope {
  algorithm: string;
  artifactKind: string;
  compatibilityVersion: string;
  bodyHash: string;
  bodyLength: number;
}

export function canonicalSerialize(value: unknown): string {
  return JSON.stringify(value, stableKeySort, 0);
}

function stableKeySort(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value).sort();
    const sorted: Record<string, unknown> = {};
    for (const k of keys) {
      sorted[k] = (value as Record<string, unknown>)[k as keyof Record<string, unknown>];
    }
    return sorted;
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        const keys = Object.keys(item as Record<string, unknown>).sort();
        const sorted: Record<string, unknown> = {};
        for (const k of keys) {
          sorted[k] = (item as Record<string, unknown>)[k as keyof Record<string, unknown>];
        }
        return sorted;
      }
      return item;
    });
  }
  return value;
}

export function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export function createEnvelope(
  artifactKind: string,
  compatibilityVersion: string,
  body: unknown,
): CanonicalEnvelope {
  const bodyJson = canonicalSerialize(body);
  const bodyHash = sha256Hex(bodyJson);
  return {
    algorithm: "sha256",
    artifactKind,
    compatibilityVersion,
    bodyHash,
    bodyLength: Buffer.byteLength(bodyJson, "utf8"),
  };
}

export function verifyEnvelope(envelope: CanonicalEnvelope, body: unknown): boolean {
  const bodyJson = canonicalSerialize(body);
  const computedHash = sha256Hex(bodyJson);
  return (
    computedHash === envelope.bodyHash &&
    Buffer.byteLength(bodyJson, "utf8") === envelope.bodyLength
  );
}

export function hashWithContext(data: string, context: string): string {
  const hash = createHash("sha256");
  hash.update(context, "utf8");
  hash.update("\0", "utf8");
  hash.update(data, "utf8");
  return hash.digest("hex");
}
