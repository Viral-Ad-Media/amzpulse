**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set your keys (e.g. `VITE_GEMINI_API_KEY`)
3. Run the app:
   `npm run dev`

## Frontend -> Backend integration

During local development `/api/*` requests are proxied to `http://localhost:3001` (see `vite.config.ts`). When deploying or using a remote API, set `VITE_API_BASE` to that host before building:

- Local backend: `export VITE_API_BASE=http://localhost:3001`
- Production API: `export VITE_API_BASE=https://api.yourdomain.com`

If `VITE_API_BASE` is not provided, the app will call the same origin it was served from.

## Public routes

The frontend now includes a static public shell alongside the workspace. Core routes are available via hash routing so static hosts do not need server-side rewrites:

- `#/`
- `#/features`
- `#/pricing`
- `#/about`
- `#/contact`
- `#/forgot-password`
- `#/reset-password`
- `#/privacy`
- `#/terms`
- `#/billing/success`
- `#/billing/cancel`
- `#/app`

Password reset note: the API now supports forgot/reset password endpoints. In non-production environments, the forgot-password response includes the generated reset link/token for local testing until email delivery is wired up.

### Vercel / static hosts: avoid 404s
- Set `VITE_API_BASE` (or `API_BASE`) in your site environment variables to your backend host.
- On static hosts like Vercel/GitHub Pages there is no built-in `/api/*` handler for this separate backend, so missing `VITE_API_BASE` will surface as a host 404 page when you try to log in or sign up.
- If you want the frontend to talk to your deployed API, configure `VITE_API_BASE` to that backend origin before building.

### Pairing with `amzpulse-server`
- Backend env: set `FRONTEND_URL` in `amzpulse-server/.env` to include your frontend origins (e.g., `http://localhost:5173,https://viraladmedia.github.io`).
- Checkout note: if `FRONTEND_URL` contains multiple comma-separated entries, the backend uses the first one for Stripe success/cancel redirects.
- Real Amazon sync: set `AMAZON_PAAPI_ACCESS_KEY`, `AMAZON_PAAPI_SECRET_KEY`, and `AMAZON_PAAPI_PARTNER_TAG` on the backend. Add `FEATURED_ASINS` as a comma-separated list if you want the dashboard to preload real products.
- Mock behavior: when a real provider is configured, `ALLOW_MOCK_DATA` should stay `false` so bad provider responses do not silently turn into placeholders.
- Frontend env: set `VITE_API_BASE` (or `API_BASE`) to the running backend (default local: `http://localhost:3001`).
- Start backend: `cd ../amzpulse-server && npm install && npm run dev` (or `npm run build && npm start` in production).
- Start frontend: `npm run dev` here; Vite proxies `/api/*` to port 3001 in dev, and the env base is baked into the production build.
- Quick sanity check: `curl http://localhost:3001/health` should return `{"status":"ok","version":"2.0.0"}` before loading the UI.
