import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['wuwiit.png', 'manifest.webmanifest', 'icons/*.png'],
    manifest: false,
    workbox: {
      navigateFallback: '/index.html',
      cleanupOutdatedCaches: true,
      importScripts: ['/push-sw.js'],
      runtimeCaching: [{
        urlPattern: ({url}) => url.origin === self.location.origin,
        handler: 'CacheFirst',
        options: { cacheName: 'wuwiit-local-assets' },
      }],
    },
  })],
})
