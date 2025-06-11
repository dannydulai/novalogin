#!/bin/sh

# Create log directories
mkdir -p /var/log/supervisor

# Change to app directory and run database migrations
cd /app
npm run knex migrate:latest

# Start supervisor which will manage both nginx and the backend
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
