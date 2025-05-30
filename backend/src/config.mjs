import 'dotenv/config';

// Environment variables with defaults
export default {
  // Cookie names
  COOKIE_NAME_BI: process.env.COOKIE_NAME_BI || 'bi',
  COOKIE_NAME_II: process.env.COOKIE_NAME_II || 'ii',
  COOKIE_NAME_LI: process.env.COOKIE_NAME_LI || 'li',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',
  
  // Login settings
  LOGIN_COOKIE_VERSION: process.env.LOGIN_COOKIE_VERSION || '1',
  SESSION_SECRET: process.env.SESSION_SECRET || 'secret',
  
  // App IDs
  ADMIN_APP_ID: process.env.ADMIN_APP_ID || '',
  ACCOUNT_APP_ID: process.env.ACCOUNT_APP_ID || '',
  
  // App names
  ADMIN_APP_NAME: process.env.ADMIN_APP_NAME || 'Login',
  ACCOUNT_APP_NAME: process.env.ACCOUNT_APP_NAME || 'Account',
  
  // App secrets
  ADMIN_APP_SECRET: process.env.ADMIN_APP_SECRET || '',
  ACCOUNT_APP_SECRET: process.env.ACCOUNT_APP_SECRET || '',
  
  // Google auth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // Recaptcha
  RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET,
  
  // Services
  GEOIP_SERVICE_URL: process.env.GEOIP_SERVICE_URL,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV
};
