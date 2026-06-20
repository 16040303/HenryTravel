import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ mode }) => {
  const analyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(analyze ? [visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      })] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/@tanstack/query-core')) {
              return 'vendor-query';
            }
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('/src/i18n/') || id.includes('\\src\\i18n\\')) {
              return 'i18n';
            }
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor-react';
            }
          },
        },
      },
    },
  };
});
