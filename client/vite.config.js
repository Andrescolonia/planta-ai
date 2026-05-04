import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');
  const frontendHost = env.FRONTEND_HOST || env.VITE_HOST || '0.0.0.0';
  const frontendPort = Number(env.FRONTEND_PORT || env.VITE_PORT || 5173);
  const previewPort = Number(env.FRONTEND_PREVIEW_PORT || 4173);

  return {
    envDir: projectRoot,
    plugins: [react()],
    server: {
      host: frontendHost,
      port: frontendPort
    },
    preview: {
      host: frontendHost,
      port: previewPort
    }
  };
});
