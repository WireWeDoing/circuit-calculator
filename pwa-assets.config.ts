import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: { ...minimal2023Preset, maskable: { sizes: [512], padding: 0.2, resizeOptions: { background: '#0b5cad' } }, apple: { sizes: [180], padding: 0.1, resizeOptions: { background: '#0b5cad' } } },
  images: ['public/favicon.svg'],
})
