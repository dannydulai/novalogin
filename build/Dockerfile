# Multi-stage build for NovaAuth single container

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-build

# Build arguments for frontend environment variables
ARG APP_NAME
ARG APP_LOGO
ARG APP_PRIMARY_COLOR
ARG HIDE_POWERED_BY
ARG HIDE_REFERRAL_CODE
ARG GOOGLE_CLIENT_ID
ARG APPLE_CLIENT_ID
ARG RECAPTCHA_SITE_KEY

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Set environment variables for build
ENV APP_NAME=$APP_NAME
ENV APP_LOGO=$APP_LOGO
ENV APP_PRIMARY_COLOR=$APP_PRIMARY_COLOR
ENV HIDE_POWERED_BY=$HIDE_POWERED_BY
ENV HIDE_REFERRAL_CODE=$HIDE_REFERRAL_CODE
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV APPLE_CLIENT_ID=$APPLE_CLIENT_ID
ENV RECAPTCHA_SITE_KEY=$RECAPTCHA_SITE_KEY

# Build the frontend with variables
RUN npm run build

# Stage 2: Setup backend and final image
FROM node:18-alpine

# Install nginx, supervisor, and bash for debugging
RUN apk add --no-cache nginx supervisor bash

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
COPY build/nginx.conf /etc/nginx/nginx.conf
COPY build/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY build/start.sh /start.sh

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
