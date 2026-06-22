**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set your keys (e.g. `VITE_GEMINI_API_KEY`)
3. Run the app:
   `npm run dev`

## Real Amazon product data

This repo now includes server-side product API routes:

- `GET /api/products/featured`
- `GET /api/products/:asin`
- `POST /api/batch/analyze` with `{ "asins": ["B0..."] }`

The browser never receives Amazon API secrets. Set these variables on the server or in Vercel project settings:

- `AMAZON_PAAPI_ACCESS_KEY`
- `AMAZON_PAAPI_SECRET_KEY`
- `AMAZON_PAAPI_PARTNER_TAG`
- `FEATURED_ASINS` as a comma-separated list for dashboard preload products

For local development, `.env.local` is loaded by `vite.config.ts` so the same-origin product API middleware can call Amazon directly while keeping credentials out of browser code.

Optional marketplace overrides default to the US locale:

- `AMAZON_PAAPI_MARKETPLACE=www.amazon.com`
- `AMAZON_PAAPI_HOST=webservices.amazon.com`
- `AMAZON_PAAPI_REGION=us-east-1`
- `AMAZON_PAAPI_LANGUAGE=en_US`

Amazon's Product Advertising API documentation says PA-API was deprecated on May 15, 2026 and points new integrations to the Creators API. The current implementation keeps the existing PA-API credential flow working for accounts that still have access; migrate the provider module in `server/amazonProvider.mjs` when your Amazon account is moved to the replacement API.

PA-API returns product catalog fields such as title, image, price, offer availability, browse nodes, and sales rank. It does not return every metric the workspace can display, including review counts, FBA fees, IP risk, hazmat status, estimated monthly sales, or historical charts. The UI now marks those fields as unavailable instead of filling them with mock values.

## Frontend -> Backend integration

During local development, product routes under `/api/products/*` and `/api/batch/analyze` are handled by Vite middleware in this repo. Other `/api/*` requests can be proxied to `http://localhost:3001` for auth, billing, and watchlist work (see `vite.config.ts`). When deploying or using a remote API for every backend route, set `VITE_API_BASE` to that host before building:

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

### Pairing with an auth/billing backend
- Product lookup can run from the serverless API in this repo.
- Auth, Stripe billing, watchlists, and usage tracking still require a backend that implements the existing `/api/auth/*`, `/api/billing/*`, and `/api/watchlist/*` routes.
- Frontend env: set `VITE_API_BASE` (or `API_BASE`) only when you want the frontend to call a separate remote backend for every `/api/*` request.
- During local development, same-origin product routes are handled by Vite middleware first. Other `/api/*` requests can still be proxied to `http://localhost:3001` if you run a compatible backend there.
