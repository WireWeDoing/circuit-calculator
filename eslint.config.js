import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'playwright-report', 'test-results', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // diagrams export helpers next to components on purpose (Fast Refresh is not important for static SVGs)
  { files: ['src/visuals/**', 'src/ui/tools.tsx', 'src/ui/QuantityInput.tsx', 'src/ui/topicIcons.tsx', 'src/ui/icons.tsx', 'src/ui/NavTree.tsx', 'src/ui/ModeTabs.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
  { files: ['tests/**', 'e2e/**'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
])
