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

// Function to update CSS color variables
function updateColorVariables() {
  const appColor = import.meta.env.APP_PRIMARY_COLOR || '#4f46e5';
  const palette = generateColorPalette(appColor);
  
  // Update CSS custom properties
  const root = document.documentElement;
  Object.entries(palette).forEach(([shade, color]) => {
    root.style.setProperty(`--color-app-${shade}`, color);
  });
  
  console.log(`Updated app color palette based on ${appColor}`);
}

// Application configuration from environment variables
export default {
  // Application name displayed in the UI
  appName: import.meta.env.APP_NAME || 'KeyWizard',
  
  // Custom logo URL (if provided)
  appLogo: import.meta.env.APP_LOGO || '',
  
  // Whether to hide the "Powered by Keyflow" footer
  hidePoweredBy: import.meta.env.HIDE_POWERED_BY === 'true',
  
  googleClientId: import.meta.env.GOOGLE_CLIENT_ID || '',
  appleClientId: import.meta.env.APPLE_CLIENT_ID || '',
  
  // Initialize color system
  initColors: updateColorVariables
};
