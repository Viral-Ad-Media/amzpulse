# AmzPulse

AmzPulse is a React and TypeScript workspace for Amazon US product research, saved watchlists, batch lookups, and optional AI analysis. This repository contains the frontend. Run it with [amzpulse-server](https://github.com/Viral-Ad-Media/amzpulse-server), which owns authentication, billing, quotas, database access, and provider credentials.

## Local development

Use Node.js 22 or newer.

1. Set up and start the backend using its README, including the Supabase migrations.
2. Install this frontend and copy its environment template:

   ```sh
   npm ci
   cp .env.example .env.local
   npm run dev
   ```

3. Open the URL printed by Vite, normally `http://localhost:5173`. With `VITE_API_BASE` empty, Vite forwards every `/api/*` request to `http://localhost:3001`. Sign up or sign in to research an ASIN.

For a remote backend, set `VITE_API_BASE=https://api.example.com` in `.env.local` and restart Vite. Use the backend origin without an `/api` suffix. Allow the frontend origin in the backend's `FRONTEND_URL` setting.

## Configuration and deployment

| Setting                | Where                       | Purpose                                                                             |
| ---------------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| `VITE_API_BASE`        | Frontend build environment  | Backend origin for all API requests; required on static hosts such as GitHub Pages. |
| `API_BASE`             | Frontend build environment  | Compatibility alias when `VITE_API_BASE` is unset.                                  |
| `AMZPULSE_BACKEND_URL` | Vercel function environment | Fixed HTTPS backend origin for the optional same-origin gateway.                    |

Set `VITE_API_BASE` before `npm run build`; changing it after building does not change the generated JavaScript. Deploy `dist/` to your static host. Hash routing supports public pages, `#/app`, and password recovery without SPA server rewrites.

On Vercel, you may leave both build-time API base settings empty and set `AMZPULSE_BACKEND_URL` instead. The functions in `api/` forward product, analysis, authentication, billing, watchlist, and sourcing requests to the same backend. They forward bearer/API-key authentication, limit request size, and disable caching. They contain no provider or database clients. Point Stripe webhooks directly at the backend, not this gateway.

Direct browser-to-backend requests are recommended: the backend can rate-limit each client's IP. A gateway shares backend IP limits across clients, so account for gateway traffic when setting backend limits and host function timeouts. Large batches may take several minutes; a gateway host with a shorter execution limit should use direct API mode.

Keep Supabase service-role, Stripe, Amazon, Keepa, Rainforest, Resend, and Gemini secrets exclusively in the backend. Never use a `VITE_` prefix for a secret; those variables are public browser configuration. Existing frontend provider credentials must be moved to the backend.

## Research behavior

- Product searches require a signed-in account. Batch runs require an owner or admin role.
- Category discovery runs only after clicking **Load category products**. The legacy `trending` route supplies electronics/category bestsellers, not a measured trend. Discovery uses up to 24 ASIN credits across both categories.
- **Analyze product** starts AI analysis explicitly. An unavailable service displays an error instead of a fabricated score or grade.
- The backend reserves monthly usage atomically and refunds failed lookups. Successful cached lookups also consume credits. Limits are shared by the organization: Free has 300 ASINs, 50 AI calls, and 20 ASINs per batch; Pro has 5,000 ASINs, 1,000 AI calls, and 100 ASINs per batch.
- Provider field coverage varies. Missing fees, risk assessments, history, and sales are unavailable. Profit and ROI require all applicable fees; supply manual fees when needed. A supplied referral fee is tied to its sale price, so a changed sale price requires a new referral-fee entry.
- Historical price and rank series are joined by timestamp. Batch errors remain separate from successful products, and CSV exports escape spreadsheet formulas.
- Watchlists sync with the backend and restore saved product details after reload. Calculator inputs, supplier links, and research notes save immediately in this browser, scoped to user and organization. They do not sync across devices. Old unscoped notes are intentionally not imported into an account automatically.

The current calculator supports US/USD research. Referral tracking and rewards are placeholders; sharing a referral link does not credit rewards. AI output is commentary on available product data, not verification of missing IP or hazmat information.

## Checks and project layout

```sh
npm run check
npm test
npm run build
```

GitHub Actions runs the type check, regression tests, production build, and dependency audit. Tests cover watchlist reloads, explicit paid actions, local note persistence, missing fees, sparse charts, batch errors, CSV escaping, and gateway forwarding.

- `components/`: workspace, public pages, product analysis, charts, and batch UI.
- `services/apiClient.ts`: shared backend API contract and authentication headers.
- `services/productMapper.ts`: provider data normalization.
- `services/localProductData.ts`: account-scoped browser persistence.
- `server/backendProxy.mjs` and `api/`: optional Vercel gateway.
- `tests/`: frontend and gateway regression checks.

## Audit remediation rollout

Use the frontend and backend audit-remediation branches together. Apply the backend security migration before starting the updated API; it adds session versioning, private database access, canonical product payloads, and transactional usage functions. Configure Redis, reset email delivery, billing, and the chosen data provider as described in the backend README. Existing sessions must sign in again. These code changes do not themselves deploy services, apply production migrations, or verify live credentials.
