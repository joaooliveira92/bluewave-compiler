export interface DebugModeEnv {
  readonly dev: boolean;
  readonly flag: string | undefined;
}

export function isDebugMode(env: DebugModeEnv): boolean {
  return env.dev || env.flag === "true";
}
