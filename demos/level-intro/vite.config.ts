import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  build: {
    assetsInlineLimit: filePath => /\.woff2$/i.test(filePath) ? false : undefined,
    outDir: fileURLToPath(new URL('../../node_modules/.intro-demo-build', import.meta.url)),
    emptyOutDir: true,
  },
});
