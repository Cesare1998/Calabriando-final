import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
  global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom'],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  server: {
    port: 3001,
    strictPort: true,
    host: true,
    hmr: {
      timeout: 10000,
      overlay: false,
      force: true
    },
    watch: {
      usePolling: true
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    keepNames: true,
    treeShaking: false
  }
});