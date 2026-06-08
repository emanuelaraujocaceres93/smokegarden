import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin PWA simplificado
function simplePWA() {
  return {
    name: 'simple-pwa',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/manifest.webmanifest') {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.end(JSON.stringify({
            name: 'Smoke Garden',
            short_name: 'SmokeGarden',
            theme_color: '#D95A1A',
            background_color: '#000000',
            display: 'standalone',
            icons: [{ src: '/logo.jpeg', sizes: 'any', type: 'image/jpeg' }]
          }));
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), simplePWA()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
