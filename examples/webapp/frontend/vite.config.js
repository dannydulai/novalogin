import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import 'dotenv/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      tailwindcss(),
      vue()
  ],
  define: {
    AUTH_URL: JSON.stringify(process.env.AUTH_URL),
    APP_ID: JSON.stringify(process.env.APP_ID)
  },
  server: {
    proxy: {
        '/api': {
            target: 'http://localhost:3002',
            changeOrigin: true
        }
    }
  }
})
