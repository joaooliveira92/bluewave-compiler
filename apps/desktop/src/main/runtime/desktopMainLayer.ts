// The desktop main service graph (INC-1..INC-3; ADR-0159). One Layer composed of
// the content, project-store and session services; grows as later slices add
// services. The Electron main process builds one `ManagedRuntime` from this and
// disposes it on quit.
import { Layer } from "effect";
import { CampaignSessionStore, campaignSessionStoreLayer } from "./campaignSessionStore.js";
import { ContentArtifact, contentArtifactLayer } from "./contentArtifact.js";
import { ProjectStore, projectStoreLayer } from "./projectStore.js";

/** Every service the desktop command programs may require (grows as slices land). */
export type CommandEnv = ContentArtifact | ProjectStore | CampaignSessionStore;

/** The desktop main service graph. */
export function desktopMainLayer(): Layer.Layer<CommandEnv> {
  return Layer.mergeAll(contentArtifactLayer(), campaignSessionStoreLayer(), projectStoreLayer());
}
