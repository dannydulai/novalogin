import 'dotenv/config'; // Load environment variables from .env file
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue()
  ],
  define: {
    // Make environment variables available to the client
    'import.meta.env.APP_NAME': JSON.stringify(process.env.APP_NAME || 'MyApp'),
    'import.meta.env.APP_LOGO': JSON.stringify(process.env.APP_LOGO || 'stocklogo.png'),
    'import.meta.env.APP_PRIMARY_COLOR': JSON.stringify(process.env.APP_PRIMARY_COLOR || '#4f46e5'),
    'import.meta.env.HIDE_POWERED_BY': JSON.stringify(process.env.HIDE_POWERED_BY || 'false'),
    'import.meta.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID || ''),
    'import.meta.env.APPLE_CLIENT_ID': JSON.stringify(process.env.APPLE_CLIENT_ID || '')
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});

