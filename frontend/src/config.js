// Application configuration from environment variables
export default {
  // Application name displayed in the UI
  appName: import.meta.env.APP_NAME || 'KeyWizard',
  
  // Custom logo URL (if provided)
  appLogo: import.meta.env.APP_LOGO || '',
  
  // Primary color for UI elements (default: indigo-600)
  primaryColor: import.meta.env.APP_PRIMARY_COLOR || '#4f46e5',
  
  // Whether to hide the "Powered by Keyflow" footer
  hidePoweredBy: import.meta.env.HIDE_POWERED_BY === 'true',
  
  // Get CSS variable for primary color
  get primaryColorClass() {
    // If using a Tailwind color, return the class
    if (this.primaryColor.startsWith('#')) {
      return ''; // Using custom color in CSS variables
    }
    return this.primaryColor;
  },
  
  googleClientId: import.meta.env.GOOGLE_CLIENT_ID || '',
};
