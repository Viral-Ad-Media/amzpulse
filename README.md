<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1EwUqRnf3cFNZ5juOyKJPqAjr-Y0PU6iw

## Run Locally

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

### Netlify / static hosts: avoid 404s
- Set `VITE_API_BASE` (or `API_BASE`) in your site environment variables to your backend host.
- On static hosts like Netlify/GitHub Pages there is no `/api/*` handler, so missing `VITE_API_BASE` will surface as the Netlify 404 HTML page when you try to log in or sign up.
- If you prefer to proxy through the static host, add a redirect in `netlify.toml` that forwards `/api/*` to your backend.
