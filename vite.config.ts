import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  const apiBase = env.VITE_API_BASE || 'http://localhost:3001';
  let apiTarget = apiBase;
  try {
    const parsed = new URL(apiBase);
    apiTarget = `${parsed.protocol}//${parsed.host}`;
  } catch {
    apiTarget = 'http://localhost:3001';
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      // This allows the app to access the API_KEY set in Netlify Environment Variables
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
