# Recovery Road

Recovery support platform (patient / supervisor / admin / NGO). Stack: React (Vite), Node (Express + Socket.IO), MongoDB, optional Python ML service (`backend/ml_service`).

## Quick start

- **Backend:** `cd backend && npm install && cp .env.example .env` (configure `MONGO_URI`, etc.) → `npm run dev` or `npm start`
- **Frontend:** `cd frontend && npm install && npm run dev`
- **ML (optional):** `pip install -r backend/ml_service/requirements.txt` then run `backend/ml_service/app.py`, or rely on `AUTO_START_ML_SERVICE` when starting Node.

See `backend/.env.example` and `frontend/.env.example` for deployment variables.
