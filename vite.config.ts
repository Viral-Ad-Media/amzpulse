import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAmazonApiRequest } from './server/amazonProvider.mjs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  const runtimeEnv = { ...process.env, ...env };
  const apiBaseFromEnv = env.VITE_API_BASE || env.API_BASE || '';
  const apiBase = apiBaseFromEnv || 'http://localhost:3001';
  let apiTarget = apiBase;
  try {
    const parsed = new URL(apiBase);
    apiTarget = `${parsed.protocol}//${parsed.host}`;
  } catch {
    apiTarget = 'http://localhost:3001';
  }

  return {
    base: './',
    plugins: [
      react(),
      {
        name: 'amzpulse-amazon-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            try {
              const handled = await handleAmazonApiRequest(req, res, runtimeEnv);
              if (!handled) next();
            } catch (error) {
              next(error as Error);
            }
          });
        }
      }
    ],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react/jsx-runtime', 'react-dom/client'],
            recharts: ['recharts'],
            lucide: ['lucide-react'],
            genai: ['@google/genai']
          }
        }
      }
    },
    define: {
      // This allows the app to access the API_KEY set in deployment environment variables
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Also surface API base even if the user forgot the VITE_ prefix (we fill __APP_API_BASE__)
      __APP_API_BASE__: JSON.stringify(env.VITE_API_BASE ? env.VITE_API_BASE.replace(/\/$/, '') : apiBaseFromEnv.replace(/\/$/, ''))
    }
  };
});
