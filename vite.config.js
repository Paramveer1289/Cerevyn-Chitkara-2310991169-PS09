import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom gives us a browser-like environment for @testing-library tests.
    // Pure game logic tests don't need it, but it doesn't hurt them either,
    // and it avoids needing separate configs for different test files.
    environment: 'jsdom',

    // Expose vitest globals (describe, it, expect, etc.) without explicit
    // imports. Required so @testing-library/jest-dom can call expect.extend()
    // at module load time inside setupFiles.
    globals: true,

    // Load jest-dom matchers (toBeInTheDocument, etc.) before every test file.
    setupFiles: ['./src/setupTests.js'],
  },
})
