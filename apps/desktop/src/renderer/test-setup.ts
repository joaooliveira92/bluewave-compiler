import { configure } from "@testing-library/react";

/**
 * Testing Library's default async wait is 1s. Under the full suite, files run in parallel and
 * a lazily loaded chunk (the map and its coastline) or a multi-step flow can take longer than
 * that on a busy machine, which showed up as unrelated tests failing intermittently. 5s is
 * long enough for a loaded machine and still short enough that a genuine hang fails promptly.
 */
configure({ asyncUtilTimeout: 5000 });

/** jsdom has no ResizeObserver; components that measure themselves (liquid-glass) need a no-op. */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
