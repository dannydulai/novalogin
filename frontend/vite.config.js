import 'dotenv/config'; // Load environment variables from .env file
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Function to convert hex to HSL
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

// Function to generate color palette
function generateColorPalette(baseColor) {
  if (!baseColor || !baseColor.startsWith('#')) {
    baseColor = '#4f46e5'; // fallback to indigo-600
  }

  const [h, s, l] = hexToHsl(baseColor);
  
  const palette = {
    50: `hsl(${h}, ${Math.max(s - 20, 10)}%, ${Math.min(l + 45, 95)}%)`,
    100: `hsl(${h}, ${Math.max(s - 15, 15)}%, ${Math.min(l + 35, 90)}%)`,
    200: `hsl(${h}, ${Math.max(s - 10, 20)}%, ${Math.min(l + 25, 85)}%)`,
    300: `hsl(${h}, ${Math.max(s - 5, 25)}%, ${Math.min(l + 15, 80)}%)`,
    400: `hsl(${h}, ${s}%, ${Math.min(l + 5, 75)}%)`,
    500: `hsl(${h}, ${s}%, ${l}%)`, // base color
    600: `hsl(${h}, ${Math.min(s + 5, 100)}%, ${Math.max(l - 10, 25)}%)`,
    700: `hsl(${h}, ${Math.min(s + 10, 100)}%, ${Math.max(l - 20, 20)}%)`,
    800: `hsl(${h}, ${Math.min(s + 15, 100)}%, ${Math.max(l - 30, 15)}%)`,
    900: `hsl(${h}, ${Math.min(s + 20, 100)}%, ${Math.max(l - 40, 10)}%)`,
    950: `hsl(${h}, ${Math.min(s + 25, 100)}%, ${Math.max(l - 50, 5)}%)`
  };

  return palette;
}

// Function to update main.css
function updateMainCSS() {
  const appColor = process.env.APP_PRIMARY_COLOR || '#03DAC6';
  const palette = generateColorPalette(appColor);
  
  const cssContent = `@import "tailwindcss";

@theme {
    --color-app-50: ${palette[50]};
    --color-app-100: ${palette[100]};
    --color-app-200: ${palette[200]};
    --color-app-300: ${palette[300]};
    --color-app-400: ${palette[400]};
    --color-app-500: ${palette[500]};
    --color-app-600: ${palette[600]};
    --color-app-700: ${palette[700]};
    --color-app-800: ${palette[800]};
    --color-app-900: ${palette[900]};
    --color-app-950: ${palette[950]};
}
`;

  const cssPath = path.resolve('src/assets/main.css');
  fs.writeFileSync(cssPath, cssContent);
  console.log(`Updated main.css with app color palette based on ${appColor}`);
}

// Update CSS on startup
updateMainCSS();

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

