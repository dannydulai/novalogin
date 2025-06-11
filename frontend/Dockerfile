# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG APP_NAME
ARG APP_LOGO
ARG APP_PRIMARY_COLOR
ARG HIDE_POWERED_BY
ARG HIDE_REFERRAL_CODE
ARG GOOGLE_CLIENT_ID
ARG APPLE_CLIENT_ID
ARG RECAPTCHA_SITE_KEY

# Set environment variables for build
ENV APP_NAME=$APP_NAME
ENV APP_LOGO=$APP_LOGO
ENV APP_PRIMARY_COLOR=$APP_PRIMARY_COLOR
ENV HIDE_POWERED_BY=$HIDE_POWERED_BY
ENV HIDE_REFERRAL_CODE=$HIDE_REFERRAL_CODE
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV APPLE_CLIENT_ID=$APPLE_CLIENT_ID
ENV RECAPTCHA_SITE_KEY=$RECAPTCHA_SITE_KEY

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
