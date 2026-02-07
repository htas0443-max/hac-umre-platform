import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
  define: {
    'process.env': {}
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    allowedHosts: [
      'hajj-travel-assist.preview.emergentagent.com',
      'hacveumreturlari.com',
      'www.hacveumreturlari.com',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      clientPort: 3000
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },
  preview: {
    port: 3000,
    host: true
  }
});
