# Shopline — Deployment Guide

## How it works in production

When `NODE_ENV=production`, the Express server:
1. Serves all `/api/*` routes as the backend
2. Serves the built React app as static files for everything else

Everything runs as **one single service** — no separate frontend hosting needed.

---

## Option A — Railway (recommended, has free tier)

1. Go to [railway.app](https://railway.app) and sign up
2. Click **New Project → Deploy from GitHub Repo** (push this folder to a GitHub repo first), or use **Deploy from local** with the Railway CLI
3. Add a **PostgreSQL** plugin to your project (Railway → Add Plugin → PostgreSQL)
4. Set these environment variables in Railway's dashboard:
   - `DATABASE_URL` — Railway fills this automatically when you add the PostgreSQL plugin
   - `SESSION_SECRET` — any long random string (e.g. run `openssl rand -hex 32` in your terminal)
   - `PORT` — Railway sets this automatically
5. Railway will run the build and deploy. Once live, run the DB migration **once**:
   ```
   railway run pnpm --filter @workspace/db run push
   ```
6. Your app is live at the Railway URL shown in the dashboard.

---

## Option B — Render (also has free tier)

1. Go to [render.com](https://render.com) and sign up
2. Click **New → Blueprint** and point it at your repo — Render will read `render.yaml` automatically and create the web service + PostgreSQL database for you
3. After first deploy, open the Render Shell for your service and run:
   ```
   pnpm --filter @workspace/db run push
   ```
4. Your app is live at the `.onrender.com` URL.

> **Note:** Free tier on Render spins down after 15 minutes of inactivity — the first request after that takes ~30 seconds to wake up. Upgrade to a paid plan to avoid this.

---

## Option C — Any VPS (DigitalOcean, Hetzner, etc.)

Requirements: Node.js 20+, pnpm, PostgreSQL

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/shopline"
export SESSION_SECRET="your-random-secret-here"
export NODE_ENV=production
export PORT=3000

# 3. Build frontend + backend
BASE_PATH=/ pnpm --filter @workspace/shopline run build
pnpm --filter @workspace/api-server run build

# 4. Run DB migration (first time only)
pnpm --filter @workspace/db run push

# 5. Start the server
node artifacts/api-server/dist/index.mjs
```

Use PM2 or systemd to keep it running after you close the terminal:
```bash
npm install -g pm2
pm2 start "node artifacts/api-server/dist/index.mjs" --name shopline
pm2 save && pm2 startup
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | Yes | Port for the server to listen on |
| `NODE_ENV` | Yes | Set to `production` |
| `FRONTEND_DIST` | No | Override path to built frontend files |

---

## Electron (Desktop App)

Converting this app to Electron is possible but requires extra steps because it has a Node.js backend (Express + PostgreSQL). You would need to:
- Bundle the Express server to run as Electron's main process
- Replace PostgreSQL with SQLite (or keep PostgreSQL running as a separate process)

This is a larger project. The hosted approach above is simpler and works on any device through a browser.

---

## Demo Accounts

After running the DB push, seed data is already included:
- **Buyer:** phone `0244000001`, password `password123`
- **Seller:** phone `0244000002`, password `password123`
