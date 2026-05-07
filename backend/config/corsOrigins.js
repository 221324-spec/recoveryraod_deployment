/**
 * CORS / Socket.IO allowed origins for Express and socket.io.
 * Production: set ALLOWED_ORIGINS (comma-separated) or FRONTEND_URL (single origin).
 * Example: ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
 */

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5180',
  'http://localhost:5181',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5180',
  'http://127.0.0.1:5181'
];

function parseOrigins(value) {
  if (value == null || String(value).trim() === '') return [];
  return String(value)
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function getAllowedOrigins() {
  const list = parseOrigins(process.env.ALLOWED_ORIGINS);
  if (list.length) return list;

  const single = process.env.FRONTEND_URL;
  if (single && String(single).trim()) {
    return [String(single).trim().replace(/\/$/, '')];
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[cors] No ALLOWED_ORIGINS or FRONTEND_URL set in production. Browsers may block API/socket calls. Set one of them to your deployed frontend URL(s).'
    );
    return [];
  }

  return DEV_ORIGINS;
}

module.exports = { getAllowedOrigins, DEV_ORIGINS };
