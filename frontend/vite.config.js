import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { fileURLToPath, URL } from 'node:url'

const frontendRoot = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:5000'
  const devPort = Number(env.VITE_DEV_PORT) || 5180

  return {
    plugins: [
      react({
        include: /\.(jsx|js)$/,
      }),
      nodePolyfills({
        protocolImports: true,
      }),
    ],
    define: {
      global: 'globalThis',
      'process.env': {}
    },
    resolve: {
      alias: {
        process: 'process/browser',
        buffer: 'buffer',
        stream: 'stream-browserify',
        util: 'util'
      }
    },
    optimizeDeps: {
      include: ['simple-peer', 'buffer', 'process', 'util', 'stream-browserify']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-maps';
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'vendor-charts';
            }
            if (id.includes('socket.io-client') || id.includes('simple-peer')) return 'vendor-realtime';
            return 'vendor';
          }
        }
      },
      chunkSizeWarningLimit: 700
    },
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  }
})
