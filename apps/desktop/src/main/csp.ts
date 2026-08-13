export const CONTENT_SECURITY_POLICY = "default-src 'self'";

/**
 * Vite's React-refresh preamble (injected by @vitejs/plugin-react for HMR)
 * is an inline <script> the plugin controls, not something we author or can
 * externalize — it requires 'unsafe-inline' (and 'unsafe-eval' for Vite's
 * dev-time module transforms). Only used when loading the dev server
 * (localhost:5173); production loads a static built bundle under the
 * strict policy above.
 */
export const DEV_CONTENT_SECURITY_POLICY = [
  "default-src 'self' http://localhost:5173",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173",
  "style-src 'self' 'unsafe-inline' http://localhost:5173",
  "connect-src 'self' ws://localhost:5173 http://localhost:5173",
].join("; ");

/**
 * Applies the renderer Content-Security-Policy to a response-header map.
 * Pure and Electron-free so it can be unit tested without launching Electron.
 */
export function applyContentSecurityPolicy(
  responseHeaders: Record<string, string[]> | undefined,
  isDev = false,
): Record<string, string[]> {
  return {
    ...responseHeaders,
    "Content-Security-Policy": [isDev ? DEV_CONTENT_SECURITY_POLICY : CONTENT_SECURITY_POLICY],
  };
}
