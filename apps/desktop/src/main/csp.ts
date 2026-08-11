export const CONTENT_SECURITY_POLICY = "default-src 'self'";

/**
 * Applies the renderer Content-Security-Policy to a response-header map.
 * Pure and Electron-free so it can be unit tested without launching Electron.
 */
export function applyContentSecurityPolicy(
  responseHeaders: Record<string, string[]> | undefined,
): Record<string, string[]> {
  return {
    ...(responseHeaders ?? {}),
    "Content-Security-Policy": [CONTENT_SECURITY_POLICY],
  };
}
