# NovaAuth 🚀

**This is NOT OAuth** - it's a streamlined alternative! No complex scopes, no token refresh headaches, just clean authentication that works.

NovaAuth is a modern, self-hosted authentication service that provides login flows for your applications. NovaAuth handles user registration, authentication, two-factor authentication, and session management so you can focus on building your app. It supports login through client_id / client_secret exchange for your self hosted backends, OIDC support for third party applications, and PKCE authentication for mobile / desktop apps.

**This is designed to be forked and customized** - take this project, make it your own, and build the authentication system that perfectly fits your needs.

## ✨ Features

- **OAuth-style Authentication Flow** - PKCE-based authentication with callback URLs
- **Multi-Factor Authentication** - Built-in 2FA support with TOTP
- **Social Login** - Google and Apple Sign-In integration
- **Admin Dashboard** - Manage users, apps, and authentication settings
- **Session Management** - Secure cookie-based sessions with configurable expiration
- **Referral System** - Built-in user referral tracking with UTM data capture
- **Customizable UI** - Brand your login pages with custom colors and logos
- **Google reCAPTCHA Support** - Spam and bot protection
- **Docker Ready** - Single container deployment with PostgreSQL support
- **Extensible Schema** - Add your own user data fields and customize as needed

## 🏗️ Architecture

This repository contains several components:

- **`backend/`** - Node.js/Express API server that handles authentication logic
- **`frontend/`** - Vue.js application providing login/registration UI
- **`express-nova-login/`** - NPM package for integrating NovaAuth with Express.js apps
- **`vue-nova-login/`** - NPM package for integrating NovaAuth with Vue.js apps
- **`examples/`** - Example applications showing integration patterns (including Flutter)
- **`build/`** - Docker configuration for single-container deployment

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- PostgreSQL database (can be external)

### Minimal Setup

1. **Clone and customize**
   ```bash
   git clone <repository-url>
   cd novaauth
   # Make it your own!
   git remote set-url origin <your-repo-url>
   ```

2. **Configure environment variables**
   
   Edit `build/docker-compose.yml` and set these required variables:
   ```yaml
   environment:
     # Database connection
     DB_HOST: "your-postgres-host"
     DB_USER: "your-db-user"
     DB_PASSWORD: "your-db-password"
     DB_NAME: "your-db-name"
     
     # Application secrets (generate UUIDs)
     ADMIN_APP_ID: "your-admin-app-uuid"
     ADMIN_APP_SECRET: "your-admin-secret"
     ACCOUNT_APP_ID: "your-account-app-uuid"
     ACCOUNT_APP_SECRET: "your-account-secret"
     SESSION_SECRET: "your-session-secret"
     
     # Admin user
     ADMIN_USER: "admin@yourdomain.com"
     ADMIN_PASSWORD: "secure-password"
   ```

3. **Start the service**
   ```bash
   cd build
   docker-compose up --build
   ```

4. **Access the application**
   - Login UI: http://localhost:8080
   - Admin login: Use the credentials you set in `ADMIN_USER`/`ADMIN_PASSWORD`

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `password123` |
| `DB_NAME` | Database name | `novaauth` |
| `ADMIN_APP_ID` | Admin app UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `ADMIN_APP_SECRET` | Admin app secret | `admin-secret-key` |
| `ACCOUNT_APP_ID` | Account app UUID | `550e8400-e29b-41d4-a716-446655440001` |
| `ACCOUNT_APP_SECRET` | Account app secret | `account-secret-key` |
| `SESSION_SECRET` | Session encryption key | `your-32-char-secret` |
| `ADMIN_USER` | Initial admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Initial admin password | `secure-password` |

### Optional Variables

#### Frontend Customization
| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | `NovaAuth` |
| `APP_LOGO` | Custom logo URL | `` |
| `APP_PRIMARY_COLOR` | Brand color (hex) | `#4f46e5` |
| `HIDE_POWERED_BY` | Hide "Powered by" footer | `false` |
| `HIDE_REFERRAL_CODE` | Hide referral codes | `false` |

#### Authentication
| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `` |
| `APPLE_CLIENT_ID` | Apple Sign-In client ID | `` |
| `RECAPTCHA_SECRET` | reCAPTCHA secret key | `` |
| `RECAPTCHA_SITE_KEY` | reCAPTCHA site key | `` |

#### Email Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server host | `` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `` |
| `SMTP_PASS` | SMTP password | `` |
| `FROM_EMAIL` | From email address | `noreply@example.com` |
| `FROM_NAME` | From name | `NovaAuth` |

#### AWS SES (Alternative to SMTP)
| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `` |

#### Advanced Settings
| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Service hostname | `localhost` |
| `COOKIE_DOMAIN` | Cookie domain | `` |
| `COOKIE_VERSION` | Cookie version | `1` |
| `NODE_ENV` | Environment | `production` |
| `GEOIP_SERVICE_URL` | GeoIP service URL | `` |

## 🔗 Integrating Your Applications

NovaAuth uses a **PKCE-based authentication flow** that's similar to OAuth but simpler. It works perfectly with PKCE libraries like the one used in our Flutter example.

### 1. Register Your Application

First, register your application in the NovaAuth admin panel:

1. Login to the admin interface at `http://your-novaauth-host:8080`
2. Navigate to "Applications"
3. Create a new application with:
   - **Name**: Your app name
   - **Callback URL**: Where users return after authentication
   - **App ID**: Generated UUID for your app
   - **App Secret**: Secret key for your app

### 2. Integration Options

#### Express.js Integration

Install the Express middleware:
```bash
npm install express-nova-login
```

Configure in your Express app:
```javascript
const novaLogin = require('express-nova-login');

const auth = novaLogin({
  app_id: 'your-app-id',
  app_secret: 'your-app-secret',
  auth_url: 'http://your-novaauth-host:8080',
  cookie_secret: 'your-cookie-secret'
});

// Protect routes
app.get('/dashboard', auth.requireAuth, (req, res) => {
  // req.user contains authenticated user info
  res.json({ user: req.user });
});

// Login redirect
app.get('/login', (req, res) => {
  auth.redirectToLogin(req, res, '/dashboard');
});
```

#### Vue.js Integration

Install the Vue plugin:
```bash
npm install vue-nova-login
```

Configure in your Vue app:
```javascript
import { createApp } from 'vue';
import NovaAuth from 'vue-nova-login';

const app = createApp(App);

app.use(router);
app.use(NovaAuth, {
  loginUrl: 'http://your-novaauth-host:8080',
  appId: 'your-app-id'
});
```

Use in components:
```javascript
// Redirect to login
this.$novaAuth.login('/dashboard');

// Check authentication status
if (this.$novaAuth.isAuthenticated()) {
  // User is logged in
}

// Logout
this.$novaAuth.logout();
```

#### Flutter/Mobile Integration

Check out `examples/mobileapp/` for a complete Flutter implementation using PKCE. The flow works with any PKCE library:

1. Generate code verifier and challenge
2. Redirect to NovaAuth with challenge
3. Handle callback with authorization code
4. Exchange code + verifier for user info

### 3. Manual Integration

For other frameworks, implement the PKCE flow manually:

1. **Redirect to NovaAuth**:
   ```
   GET http://your-novaauth-host:8080/login?id={app_id}&cb={callback_url}&challenge={pkce_challenge}&state={state}
   ```

2. **Handle the callback**:
   NovaAuth redirects back with: `{callback_url}?code={auth_code}&state={state}`

3. **Exchange code for user info**:
   ```
   POST http://your-novaauth-host:8080/api/exchange
   {
     "code": "auth_code",
     "verifier": "pkce_verifier"
   }
   ```

## 🗄️ Database Schema & Customization

The database schema is defined in `backend/migrations/20250529123051_init.cjs`. Here's what you should know:

### Core Tables (Don't Change These)
- **`users`** - Core user data, authentication info
- **`tokens`** - Session tokens and expiration
- **`apps`** - Registered applications
- **`codes`** - Authorization codes for PKCE flow
- **`associations`** - Social login associations
- **`token_info`** - Session metadata and device tracking

### Safe to Customize
- **Add new columns to `users`** - Store additional user data
- **Add new tables** - Create your own data structures
- **Modify `utm_data` JSONB field** - Store custom tracking data
- **Extend `groups` array** - Add custom user roles

### Key Fields You Can Extend
```sql
-- In users table:
utm_data jsonb DEFAULT '{}'::jsonb,  -- Store marketing data
groups text[] DEFAULT '{}',          -- Custom user roles
class text DEFAULT 'Normal',         -- User classification
-- Add your own columns here!
```

**Pro tip**: Use JSONB fields for flexible data storage without schema changes.

## 🛠️ Development & Customization

### Local Development Setup

1. **Start PostgreSQL**:
   ```bash
   docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
   ```

2. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Building for Production

Use the provided Docker setup:
```bash
cd build
docker-compose up --build
```

### Customization Ideas

- **Add custom user fields** - Store profile data, preferences, etc.
- **Implement custom auth flows** - Add magic links, SMS verification
- **Extend the admin panel** - Add user management features
- **Custom email templates** - Brand your verification emails
- **Add webhooks** - Notify your apps of user events
- **Implement SSO** - Connect to LDAP, SAML, etc.

## 🎯 Why Fork This?

- **Full control** - No vendor lock-in, no usage limits
- **Customizable** - Modify anything to fit your needs
- **Self-hosted** - Your data stays with you
- **Production ready** - Used in real applications
- **Modern stack** - Vue.js, Node.js, PostgreSQL
- **Docker ready** - Easy deployment anywhere

## 📝 License

MIT License - Fork it, customize it, make it yours!

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, new features, or documentation improvements.

## 📞 Support

- Check the `examples/` directory for integration patterns
- Review the database schema in `backend/migrations/`
- Look at existing integrations in `express-nova-login/` and `vue-nova-login/`
