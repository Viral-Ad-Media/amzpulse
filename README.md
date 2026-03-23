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
- `#/privacy`
- `#/terms`
- `#/billing/success`
- `#/billing/cancel`
- `#/app`

### Netlify / static hosts: avoid 404s
- Set `VITE_API_BASE` (or `API_BASE`) in your site environment variables to your backend host.
- On static hosts like Netlify/GitHub Pages there is no `/api/*` handler, so missing `VITE_API_BASE` will surface as the Netlify 404 HTML page when you try to log in or sign up.
- If you prefer to proxy through the static host, add a redirect in `netlify.toml` that forwards `/api/*` to your backend.

### Pairing with `amzpulse-server`
- Backend env: set `FRONTEND_URL` in `amzpulse-server/.env` to include your frontend origins (e.g., `http://localhost:5173,https://viraladmedia.github.io`).
- Checkout note: if `FRONTEND_URL` contains multiple comma-separated entries, the backend uses the first one for Stripe success/cancel redirects.
- Frontend env: set `VITE_API_BASE` (or `API_BASE`) to the running backend (default local: `http://localhost:3001`).
- Start backend: `cd ../amzpulse-server && npm install && npm run dev` (or `npm run build && npm start` in production).
- Start frontend: `npm run dev` here; Vite proxies `/api/*` to port 3001 in dev, and the env base is baked into the production build.
- Quick sanity check: `curl http://localhost:3001/health` should return `{"status":"ok","version":"2.0.0"}` before loading the UI.
