/**
 * Deployment: optional split API hosting
 * - Single origin (Node serves built SPA + /api): leave VITE_API_ORIGIN unset.
 * - API on another domain: VITE_API_ORIGIN=https://api.yourdomain.com
 *
 * WebSockets: same host as API in this app. Defaults:
 * - VITE_SOCKET_URL if set
 * - else VITE_API_ORIGIN
 * - else dev → http://127.0.0.1:5000, prod build → window.location.origin
 */

export function getApiOrigin() {
  const raw =
    import.meta.env.VITE_API_ORIGIN ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_ORIGIN ||
    import.meta.env.VITE_BACKEND_URL;

  if (raw == null || String(raw).trim() === '') return '';

  let v = String(raw).trim();
  v = v.replace(/\/$/, '');
  // Common misconfiguration: users paste the full API base (ending in /api).
  // This app expects an origin (scheme + host) and adds /api internally.
  if (v.endsWith('/api')) v = v.slice(0, -'/api'.length);
  return v;
}

let didWarnMissingApiOrigin = false;

function warnMissingApiOriginOnce() {
  if (didWarnMissingApiOrigin) return;
  didWarnMissingApiOrigin = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[RecoveryRoad] API origin not configured. Set VITE_API_ORIGIN (Vercel env) to your Render backend origin (e.g. https://your-api.onrender.com). '
      + 'Without it, the app will call /api/* on the current origin.'
  );
}

/** @param {string} path Must be an API path, e.g. /api/patients/1 */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const origin = getApiOrigin();
  if (!origin) return p;
  return `${origin}${p}`;
}

/** Use instead of fetch('/api/...') so VITE_API_ORIGIN works. */
export function apiFetch(path, init) {
  return fetch(apiUrl(path), init);
}

export function getAxiosBaseURL() {
  const o = getApiOrigin();
  if (!o) {
    if (import.meta.env.PROD) warnMissingApiOriginOnce();
    return '/api';
  }
  return `${o}/api`;
}

export function getSocketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit != null && String(explicit).trim() !== '') {
    let v = String(explicit).trim();
    v = v.replace(/\/$/, '');
    if (v.endsWith('/api')) v = v.slice(0, -'/api'.length);
    return v;
  }
  const o = getApiOrigin();
  if (o) return o;
  if (import.meta.env.DEV) return 'http://127.0.0.1:5000';
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}
