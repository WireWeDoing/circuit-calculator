/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // relative base so the build works from any sub-path (GitHub Pages, a folder, file hosting)
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Circuit Calculator — Interactive Electronics Cheat Sheet',
        short_name: 'CircuitCalc',
        description: 'Interactive, offline electronics formula reference with step-by-step calculators and diagrams.',
        theme_color: '#0b5cad',
        background_color: '#f5f7fa',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        categories: ['education', 'utilities', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // vendor code changes rarely: separate files are cached across deploys and download in parallel
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(\.pnpm\/)?(react|react-dom|scheduler)[@/]/.test(id)) return 'react'
          if (/node_modules\/(\.pnpm\/)?(@mui|@emotion|stylis|clsx|prop-types|react-is|react-transition-group|hoist-non-react-statics|@babel)/.test(id)) return 'mui'
          return undefined
        },
      },
    },
  },
  // reachable from other machines (e.g. over Tailscale): `pnpm dev` / `pnpm preview` listen on all interfaces
  server: { host: true, port: 5173, strictPort: true, allowedHosts: true },
  preview: { host: true, port: 4173, strictPort: true, allowedHosts: true },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', include: ['src/core/**', 'src/formulas/**'], reporter: ['text', 'html'] },
  },
})
