import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@mdi/font/css/materialdesignicons.css'
import './assets/main.css';
import config from './config';
import toastPlugin from './plugins/toast';

// Create app
const app = createApp(App);

// Make config available globally
app.config.globalProperties.$config = config;

// Use toast plugin
app.use(toastPlugin);

// Set CSS variables for custom colors
if (config.primaryColor.startsWith('#')) {
  document.documentElement.style.setProperty('--primary-color', config.primaryColor);
  
  // Generate lighter/darker variants
  const colorWithoutHash = config.primaryColor.substring(1);
  const r = parseInt(colorWithoutHash.substring(0, 2), 16);
  const g = parseInt(colorWithoutHash.substring(2, 4), 16);
  const b = parseInt(colorWithoutHash.substring(4, 6), 16);
  
  // Lighter variant (hover)
  const lighterColor = `#${Math.min(255, r + 20).toString(16).padStart(2, '0')}${
    Math.min(255, g + 20).toString(16).padStart(2, '0')}${
    Math.min(255, b + 20).toString(16).padStart(2, '0')}`;
  document.documentElement.style.setProperty('--primary-color-hover', lighterColor);
}

app.use(router);
app.mount('#app');

