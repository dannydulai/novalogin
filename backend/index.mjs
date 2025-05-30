/**
 * Login system for the backend
 * Can be used standalone or imported into an existing Express application
 */

import express from 'express';
import path from 'path';
import morgan from 'morgan';
import db from './db.js';
import config from './src/config.mjs';
import loginRoutes from './src/login.mjs';
import accountRoutes from './src/account.mjs';
import adminRoutes from './src/admin.mjs';

/**
 * Create and configure the login router
 * @returns {object} Express router with all login routes
 */
function createLoginRouter() {
  const app = express.Router();
  const logger = console;
  
  // Initialize login routes
  loginRoutes(app, logger);
  accountRoutes(app, logger);
  adminRoutes(app, logger);
  
  return app;
}

/**
 * Insert default apps into the database
 */
async function insertDefaultApps() {
  try {
    // Check if required environment variables are defined
    if (!config.ACCOUNT_APP_ID || !config.ADMIN_APP_ID) {
      throw new Error('ACCOUNT_APP_ID and ADMIN_APP_ID environment variables must be defined');
    }

    // Insert account app
    await db('apps')
      .insert({
        id: config.ACCOUNT_APP_ID,
        name: config.ACCOUNT_APP_NAME,
      })
      .onConflict('id')
      .ignore();

    // Insert admin app
    await db('apps')
      .insert({
        id: config.ADMIN_APP_ID,
        name: config.ADMIN_APP_NAME,
      })
      .onConflict('id')
      .ignore();

    console.log('Default apps inserted successfully');
  } catch (error) {
    console.error('Error inserting default apps:', error);
    throw error; // Re-throw to stop application startup
  }
}

/**
 * Expire old codes in the database
 */
async function expireOldCodes() {
  try {
    await db.raw(`DELETE FROM codes WHERE expiration < NOW()`);
  } catch (error) {
    console.error('Error expiring old codes:', error);
  }
}

/**
 * Setup Express application with security and logging configurations
 * @param {object} app - Express application
 * @param {object} options - Configuration options
 * @param {boolean} options.disableSecuritySettings - Disable security settings
 * @param {boolean} options.disableLogging - Disable request logging
 * @param {boolean} options.disableCodeExpiration - Disable automatic code expiration
 */
async function setupApp(app, options = {}) {
  const { 
    disableSecuritySettings = false, 
    disableLogging = false,
    disableCodeExpiration = false
  } = options;
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Security settings
  if (!disableSecuritySettings) {
    app.disable('x-powered-by');
    app.set('trust proxy', true);
  }
  
  // Request logging
  if (!disableLogging) {
    app.use(morgan('[:date[clf]] - :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'));
  }
  
  // Insert default apps into the database
  await insertDefaultApps();
  
  // Set up interval to expire old codes every minute
  if (!disableCodeExpiration) {
    // Run once immediately
    expireOldCodes();
    
    // Then set up interval
    const interval = setInterval(expireOldCodes, 60000); // 60000ms = 1 minute
    
    // Store the interval on the app for cleanup if needed
    app.locals.codeExpirationInterval = interval;
  }
  
  return app;
}

/**
 * Create a standalone Express application with the login router
 * @param {number} port - Port to listen on
 * @param {object} options - Configuration options
 * @returns {object} Express application
 */
function createStandaloneApp(port = 3000, options = {}) {
  const app = express();
  
  // Setup app with security and logging
  setupApp(app, options);
  
  // Mount the login router at /api/login
  app.use(createLoginRouter());
  
  // Start the server if port is provided
  if (port) {
    app.listen(port, () => {
      console.log(`Login server listening on port ${port}`);
    });
  }
  
  return app;
}

/**
 * Register the login routes to an existing Express application
 * @param {object} app - Express application
 * @param {object} options - Configuration options
 * @param {boolean} options.disableSecuritySettings - Disable security settings
 * @param {boolean} options.disableLogging - Disable request logging
 */
function registerWithApp(app, options = {}) {
  // Setup app with security and logging if not disabled
  setupApp(app, options);
  
  // Mount the login router at /api/login
  app.use(createLoginRouter());
}

// Export functions for both standalone use and importing as middleware
export {
  createLoginRouter,
  createStandaloneApp,
  registerWithApp,
  setupApp
};

/**
 * Print usage information when run directly
 */
function printUsage() {
  console.log(`
Login System
============

This is a modular login system that can be run standalone or integrated with an existing Express app.

Usage:
  - To run standalone: node backend/index.mjs
  - To import as a module: import { registerWithApp } from './backend/index.mjs'

Options:
  --help           Show this help message
`);
}

// Only run if this file is executed directly (not imported as a module)
if (import.meta.url === `file://${process.argv[1]}` ||
    (process.cwd() === process.argv[1] && process.argv.length === 2)
) {
    createStandaloneApp(process.env.PORT || 3000);
}
