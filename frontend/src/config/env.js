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
  const v = import.meta.env.VITE_API_ORIGIN;
  if (v == null || String(v).trim() === '') return '';
  return String(v).replace(/\/$/, '');
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
  if (!o) return '/api';
  return `${o}/api`;
}

export function getSocketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit != null && String(explicit).trim() !== '') {
    return String(explicit).replace(/\/$/, '');
  }
  const o = getApiOrigin();
  if (o) return o;
  if (import.meta.env.DEV) return 'http://127.0.0.1:5000';
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}
