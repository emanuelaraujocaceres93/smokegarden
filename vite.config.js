import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpeg', 'favicon.ico'],
      manifest: {
        name: 'Smoke Garden - Mecânica 2 Tempos',
        short_name: 'Smoke Garden',
        description: 'Sistema de gestão para mecânica especializada',
        theme_color: '#D95A1A',
        background_color: '#2C2C2C',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo.jpeg',
            sizes: 'any',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,ico,jpeg,jpg,png}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separar bibliotecas grandes em chunks menores
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('date-fns')) {
              return 'vendor-ui'
            }
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'vendor-pdf'
            }
            if (id.includes('recharts')) {
              return 'vendor-charts'
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            return 'vendor'
          }
        }
      }
    }
  }
})
