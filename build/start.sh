#!/bin/sh

# Create log directories
mkdir -p /var/log/supervisor

# Start supervisor which will manage both nginx and the backend
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
