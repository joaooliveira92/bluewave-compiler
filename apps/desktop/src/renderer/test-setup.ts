import { configure } from "@testing-library/react";

import { loadShipBuildingData } from "../main/shipBuildingContent.js";
import { setDrawingBoardContent } from "./screens/construction/drawing-board/content.js";

/**
 * Renderer tests inject decoded content instead of parsing raw YAML (ticket 04,
 * CRI-IPC-4): seed the drawing board's content seam from the compiled artifact
 * the vitest global setup produced. In the app the same DTO arrives over the
 * `inspectDrawingBoardContent` IPC; here it comes from the shared main loader so
 * tests render exactly the content the compiler validated.
 */
setDrawingBoardContent({ catalogue: loadShipBuildingData() });

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

/** jsdom has no IntersectionObserver; the shared globe suspends its frame loop off-screen. */
class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: readonly number[] = [];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = IntersectionObserverStub;
}
