import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // la app se actualiza sola cuando hay nueva versión
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Distribuidora App',
        short_name: 'Distribuidora',
        description: 'Ventas y despacho en ruta (offline-first)',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4285f4',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Shell de la app (Cache-First): funciona sin internet una vez cargada.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // Network-First para llamadas externas (ej. el Apps Script de Google Sheets):
        // intenta la red y, si falla, sigue funcionando con los datos locales.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes('script.google.com'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sheets-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // La librería de PDF se carga aparte para no pesar en el arranque.
          pdf: ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
  server: {
    host: true, // permite abrir la app desde el celular en la misma red WiFi
    port: 5173,
  },
});
