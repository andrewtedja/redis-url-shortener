import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/shorten': 'http://localhost:3000',
      '/stats': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    }
  }
})
