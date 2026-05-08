# Recovery Road

A web platform for **substance-use recovery support**, connecting **patients**, **supervisors** (care navigators), **administrators**, and **NGO** partners. It combines guided patient tools, supervisor oversight, real-time communication, and optional machine-learning insights in a single full-stack application.

---

## Overview

Recovery Road helps teams deliver structured recovery programs online. Patients access education, mood and activity tracking, goals, appointments, peer-style messaging, and engaging activities. Supervisors and organizations monitor progress, alerts, and engagement, with role-based access so each party sees what they need.

The system is built for **local development** and **cloud deployment**: API URLs, Socket.IO, and CORS are driven by environment variables so the same codebase can run behind separate front-end and API hosts.

---

## Capabilities

### Patients

- Dashboard with progress, mood trends, and wellness-oriented tools  
- Mood logging, activity and relapse journaling, goals, and milestones  
- Learning hub, games, mindfulness-style modules, and educational content  
- Messaging, notifications, and **video calls** (WebRTC with Socket.IO signaling)  
- Appointments and event participation  

### Supervisors

- Patient overviews, alerts, goals management, and communication hub  
- AI-assisted or rule-based insights where configured (mood scans, chat context)  
- Tools for assignments, daily logs, and relapse visibility  

### Administrators & NGOs

- **Admin** dashboard for system and user administration  
- **NGO** dashboard for organization-scoped workflows  

### Platform

- **REST API** (Express) with **JWT** authentication and MongoDB persistence  
- **Real-time** updates via Socket.IO (chat, calls, live features)  
- Optional **Python ML microservice** (Flask) for classifiers used by the Node layer; can auto-start with the backend  
- Responsive **React** UI (Vite, Tailwind), with code-splitting for route-based loading  

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Front end | React 18, React Router, Vite, Tailwind CSS, Chart.js / Recharts, Leaflet, Socket.IO client, WebRTC (`simple-peer`) |
| Back end | Node.js, Express, Mongoose, Socket.IO, JWT, Nodemailer, optional OpenAI integrations |
| Data | MongoDB |
| ML (optional) | Python 3, Flask (`backend/ml_service`) |

---

## Repository layout

```
Recovery_Road-irfanswork/
├── frontend/          # Vite + React SPA
├── backend/           # Express API, Socket.IO, business logic
├── backend/ml_service/# Flask ML API (optional)
├── DEPLOYMENT.md      # Vercel + Render (and related) deployment steps
└── README.md
```

---

## Prerequisites

- **Node.js** (LTS recommended) and **npm**  
- **MongoDB** (local or Atlas)  
- **Python 3** and **pip** (only if you use the ML service, manually or via `AUTO_START_ML_SERVICE`)  

---

## Local development

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` using [Backend environment](#backend-environment). At minimum, set a valid `MONGO_URI` and a strong `JWT_SECRET`.

```bash
npm run dev          # nodemon — hot reload
# or
npm start            # single node process
```

Optional maintenance scripts (see `backend/package.json`):

- `npm run seed` — seed data  
- `npm run clean-users` / `npm run clean-db` — cleanup utilities (use with care)  

### 2. Front end

```bash
cd frontend
npm install
npm run dev
```

For production assets:

```bash
npm run build
npm run preview       # local preview of the production build
```

### 3. ML service (optional)

Install dependencies and run Flask, or enable `AUTO_START_ML_SERVICE` in `backend/.env` so the Node server starts `ml_service/app.py` when healthy checks fail.

```bash
pip install -r backend/ml_service/requirements.txt
# Typically listens on port 5001; align with ML_SERVICE_URL in backend .env
python backend/ml_service/app.py
```

---

## Production notes

- Set `NODE_ENV=production` and configure **CORS** using `FRONTEND_URL` and/or `ALLOWED_ORIGINS`.  
- Build the front end (`npm run build` in `frontend/`), then either host the `dist` on a static host or enable `SERVE_FRONTEND` + `FRONTEND_DIST_PATH` on the API server (see env table).  
- Use strong secrets and a managed MongoDB instance; never commit real `.env` files.  
- **Deploying the frontend on Vercel and the API on Render:** step-by-step instructions are in [DEPLOYMENT.md](./DEPLOYMENT.md).  

---

## Backend environment

Create `backend/.env` (never commit real secrets). Sensible defaults for local dev where noted.

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | HTTP port (often `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string for signing tokens |
| `JWT_EXPIRE` | e.g. `7d` |
| `FRONTEND_URL` | Production: primary front-end origin for CORS/realtime |
| `ALLOWED_ORIGINS` | Comma-separated origins if multiple front ends are allowed |
| `SERVE_FRONTEND` | `true` to serve the Vite build from this Node server |
| `FRONTEND_DIST_PATH` | Absolute path to `frontend/dist` when `SERVE_FRONTEND=true` |
| `AUTO_START_ML_SERVICE` | `true` / `false` — spawn `ml_service` from Node on startup |
| `ML_SERVICE_URL` | Flask ML base URL (default `http://127.0.0.1:5001`) |
| `ML_PYTHON` | Python executable (`python`, `py`, or full path; on Windows, `py` often works) |
| `SMTP_HOST`, `SMTP_USER`, … | Optional email transport if configured in your deployment |

---

## Frontend environment

Vite reads `VITE_*` from `.env`, `.env.local`, `.env.production`, etc. For a typical setup (API on the same site), you can leave these unset and rely on relative `/api` and the current origin for sockets.

| Variable | Description |
|----------|-------------|
| `VITE_API_ORIGIN` | Base URL of the API when it lives on another domain |
| `VITE_SOCKET_URL` | Socket.IO server URL (often the same as the API host) |
| `VITE_DEV_PROXY_TARGET` | Dev only: backend URL for the Vite dev proxy (see `vite.config.js`) |
| `VITE_DEV_PORT` | Dev only: port for the Vite dev server |

---

## Security

- Treat `JWT_SECRET` and database credentials as production secrets.  
- Rotate keys if they are ever exposed.  
- Restrict CORS origins in production to known front-end URLs only.  
