# Deployment guide: Vercel (frontend) + Render (backend)

This project is split into a **static/React SPA** (Vite) and a **Node API** (Express + Socket.IO). Hosting the API on Render and the UI on Vercel is supported: the browser calls your Render URL for `/api/*` and WebSockets, and Render allows your Vercel origin via CORS.

---

## Before you start

1. **MongoDB** — Use [MongoDB Atlas](https://www.mongodb.com/atlas) (or any reachable cluster). Note the connection string for `MONGO_URI`.
2. **Order** — Deploy the **backend on Render first**, note its public URL (e.g. `https://recovery-road-api.onrender.com`). Then configure **Vercel** with that URL. Finally set **`FRONTEND_URL`** on Render to your **Vercel** URL and restart/redeploy if needed.

Use **HTTPS** URLs only (no trailing slash for origins in env vars).

---

## 1. Backend on Render

### Create the service

1. In [Render Dashboard](https://dashboard.render.com), create a **New Web Service**.
2. Connect your Git repository (same repo as this project).
3. Configure:
   - **Root directory:** `backend`
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. **Instance type:** Free tier is fine for testing; the service **spins down after inactivity** (first request after idle can take ~30–60 seconds).

### Environment variables (Render)

Add these in the service **Environment** tab:

| Name | Value / notes |
|------|----------------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string (user, password, cluster host, DB name). |
| `JWT_SECRET` | Long random string (e.g. 32+ characters). |
| `JWT_EXPIRE` | e.g. `7d` |
| `FRONTEND_URL` | Your Vercel app URL, e.g. `https://your-app.vercel.app` — **must match exactly** what users see in the browser (scheme + host, no path). After first Vercel deploy, paste the real URL here. |
| `ALLOWED_ORIGINS` | Optional. If you have **multiple** front-end URLs (e.g. `www` + apex), use a comma-separated list **instead of** relying only on `FRONTEND_URL`. Example: `https://app.vercel.app,https://www.domain.com` (no spaces). |

Render sets **`PORT`** automatically; the app already uses `process.env.PORT`.

### CORS and Socket.IO

`FRONTEND_URL` / `ALLOWED_ORIGINS` feed the same allowlist for **Express CORS** and **Socket.IO**. If the front end cannot log in or real-time features fail, the Vercel URL is usually missing or misspelled here (wrong subdomain, `http` vs `https`, or a trailing slash).

### Python ML service on Render

Render’s default **Node** image may not have your ML dependencies installed. Practical options:

- **Simplest:** set `AUTO_START_ML_SERVICE=false` on Render. Features that call the Node → Python ML pipeline may fall back or degrade depending on your code paths.
- **Full ML:** create a **second** Render **Web Service** with root `backend/ml_service` (or a small Dockerfile), run Flask (e.g. `pip install -r requirements.txt` and start `gunicorn` / `python app.py` bound to `PORT`), then set on the **Node** service:  
  `AUTO_START_ML_SERVICE=false` and  
  `ML_SERVICE_URL=https://your-ml-service.onrender.com`  
  (adjust if your Flask app uses a path prefix).

---

## 2. Frontend on Vercel

### Create the project

1. In [Vercel](https://vercel.com), **Add New Project** and import the same Git repository.
2. **Root directory:** set to `frontend` (Important: not the monorepo root, unless you change build settings accordingly).
3. **Framework preset:** Vite (auto-detected when `vite.config.js` is present).
4. **Build command:** `npm run build` (default for Vite).
5. **Output directory:** `dist` (Vite default).

### Environment variables (Vercel)

These must be available **at build time** (Vite inlines `import.meta.env.VITE_*`).

| Name | Value |
|------|--------|
| `VITE_API_ORIGIN` | Your Render **Web Service** URL, e.g. `https://recovery-road-api.onrender.com` — **no** trailing slash. |
| `VITE_SOCKET_URL` | Usually the **same** as `VITE_API_ORIGIN` (Socket.IO runs on the same Express server). |

Apply to **Production** (and **Preview** if you want preview deploys to hit staging APIs).

After changing these variables, trigger a **redeploy** so the bundle is rebuilt.

### Custom domain

If you attach a domain on Vercel (e.g. `https://app.example.com`), update **`FRONTEND_URL`** (or `ALLOWED_ORIGINS`) on Render to that exact origin and redeploy the API if needed.

---

## 3. Checklist

- [ ] Atlas IP access / user allows connections from Render (Atlas **Network Access**: `0.0.0.0/0` for testing, or tighter rules later).
- [ ] Render service is **live**; opening `https://YOUR-API.onrender.com` may show a health or 404 on `/` — that is normal; API routes are under `/api/...`.
- [ ] Vercel build succeeds with `VITE_API_ORIGIN` and `VITE_SOCKET_URL` set.
- [ ] `FRONTEND_URL` on Render equals the Vercel URL users open in the browser.
- [ ] Test: register/login, one API call, and one real-time path (e.g. chat or notification) from the deployed site.

---

## 4. Operational notes

- **Cold starts (Render free):** first request after idle may time out in the browser; retry or upgrade the plan.
- **WebRTC / video calls:** signaling goes through your Socket.IO server; peers may still need **TURN** servers in restrictive networks (separate infra, not covered here).
- **Secrets:** never commit `.env`; manage secrets only in Render / Vercel dashboards.

For variable names and local development, see the main **README.md**.
