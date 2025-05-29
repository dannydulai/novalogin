/**
 * Login system for the backend
 * Can be used standalone or imported into an existing Express application
 */

import express from 'express';
import path from 'path';

/**
 * Create and configure the login router
 * @returns {object} Express router with all login routes
 */
function createLoginRouter() {
  const router = express.Router();

  // Define routes
  router.get('/status', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Add more routes here

  return router;
}

/**
 * Create a standalone Express application with the login router
 * @param {number} port - Port to listen on
 * @returns {object} Express application
 */
function createStandaloneApp(port = 3000) {
  const app = express();
  
  // Add middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Mount the login router at /api/login
  app.use('/api/login', createLoginRouter());
  
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
 */
function registerWithApp(app, options = {}) {
  // Mount the login router at /api/login
  app.use('/api/login', createLoginRouter());
}

// Export functions for both standalone use and importing as middleware
export {
  createLoginRouter,
  createStandaloneApp,
  registerWithApp
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
  - To run standalone: node backend/index.mjs --server [port]
  - To import as a module: import { registerWithApp } from './backend/index.mjs'

Options:
  --server [port]  Start the standalone server (default port: 3000)
  --help           Show this help message
`);
}

// Run as standalone if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--server')) {
    const portIndex = args.indexOf('--server') + 1;
    const port = (portIndex < args.length && !args[portIndex].startsWith('--')) 
      ? parseInt(args[portIndex], 10) 
      : 3000;
    
    createStandaloneApp(port);
  } else if (args.includes('--help')) {
    printUsage();
  } else {
    // Default behavior when run with no arguments
    printUsage();
  }
}
