# Multi-stage build for NovaAuth single container

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Setup backend and final image
FROM node:18-alpine

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

# Create app directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /start.sh

# Make startup script executable
RUN chmod +x /start.sh

# Create necessary directories and set permissions
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx /var/log/supervisor && \
    chown -R nginx:nginx /var/log/nginx /var/lib/nginx /run/nginx /usr/share/nginx/html

# Create non-root user for the app
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

# Set ownership for app directory
RUN chown -R appuser:appuser /app

# Expose port 80 for nginx
EXPOSE 80

# Start supervisor to manage both processes
CMD ["/start.sh"]
