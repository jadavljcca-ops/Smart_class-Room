import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'icons.svg'],
      manifest: {
        short_name: "LJ ClassRoom",
        name: "Edumark System",
        description: "Progressive Web Application for classroom management, student rosters, study resources sharing, and announcements.",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any"
          }
        ],
        start_url: "/",
        background_color: "#ffffff",
        theme_color: "#3b82f6",
        display: "standalone",
        orientation: "portrait"
      }
    })
  ],
})
