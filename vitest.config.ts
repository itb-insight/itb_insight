import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Next resolves `server-only` itself; Vitest runs in plain Node, which has no such package.
      'server-only': fileURLToPath(new URL('./tests/support/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // src/**: unit tests next to the code. tests/guardrails/**: repo-wide security and
    // performance checks (see CLAUDE.md, "Guardrails").
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})
