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
        // Allow precaching files up to 5 MiB (default is 2 MiB)
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
  ]
})
