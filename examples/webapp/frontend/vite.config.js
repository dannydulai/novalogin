import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      tailwindcss(),
      vue()
  ],
  server: {
    proxy: {
        '/api': {
            target: 'http://localhost:3002',
            changeOrigin: true
        }
    }
  }
})
