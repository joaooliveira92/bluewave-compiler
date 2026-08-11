import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { DomainEventEnvelope, DomainEventBody } from "./envelope.js";

export class EventLedger {
  private events: DomainEventEnvelope[] = [];

  get all(): readonly DomainEventEnvelope[] {
    return this.events;
  }

  append(event: DomainEventEnvelope<DomainEventBody>): void {
    this.events.push(event);
  }

  hash(): string {
    if (this.events.length === 0) {
      return sha256Hex(canonicalSerialize([]));
    }
    const serialized = canonicalSerialize(this.events);
    return sha256Hex(serialized);
  }

  toJSON(): string {
    return JSON.stringify(this.events, null, 2);
  }
}
