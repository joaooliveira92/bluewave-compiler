// The desktop main service graph (INC-1..INC-4; ADR-0159). One Layer composed of
// every service a command program may require; grows as slices add services. The
// Electron main process builds one `ManagedRuntime` from this and disposes it on
// quit.
import { Layer } from "effect";
import { CampaignSessionStore, campaignSessionStoreLayer } from "./campaignSessionStore.js";
import { CommandQueueStore, commandQueueStoreLayer } from "./commandQueueStore.js";
import { ContentArtifact, contentArtifactLayer } from "./contentArtifact.js";
import {
  AppPaths,
  appPathsLayer,
  Clock,
  clockLayer,
  NativeDialog,
  nativeDialogLayer,
} from "./platform.js";
import { ProjectStore, projectStoreLayer } from "./projectStore.js";
import { DraftStore, ReportsStore, UiStateStore, sidecarStoresLayer } from "./sidecarStores.js";

/** Every service the desktop command programs may require. */
export type CommandEnv =
  | ContentArtifact
  | ProjectStore
  | CampaignSessionStore
  | CommandQueueStore
  | UiStateStore
  | ReportsStore
  | DraftStore
  | NativeDialog
  | AppPaths
  | Clock;

/** The desktop main service graph. */
export function desktopMainLayer(): Layer.Layer<CommandEnv> {
  return Layer.mergeAll(
    contentArtifactLayer(),
    projectStoreLayer(),
    campaignSessionStoreLayer(),
    commandQueueStoreLayer(),
    sidecarStoresLayer(),
    nativeDialogLayer(),
    appPathsLayer(),
    clockLayer(),
  );
}
