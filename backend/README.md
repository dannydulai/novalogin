# Login System

A modular authentication system that can be run standalone or integrated with an existing Express application.

## Database Schema

The system uses PostgreSQL with the following tables:

### Users
Stores user account information:
- `user_id`: UUID primary key
- `email`: User's email address (unique)
- `email_key`: Normalized email for lookups (unique)
- `password`: Hashed password
- `firstname`, `lastname`: User's name
- `referred_by`: Reference to another user who referred this user
- `referral_code`: Unique code for referrals
- `groups`: Array of group names for permissions
- `tfa_enabled`: Whether two-factor authentication is enabled
- `tfa_secret`: Secret for two-factor authentication
- `class`: User classification (e.g., "Normal")
- `is_fraud`: Flag for fraudulent accounts

### Associations
Links external authentication providers to user accounts:
- `user_id`: Reference to users table
- `association_id`: External ID (e.g., Google account ID)
- `association_type`: Provider type (e.g., "google")
- `data`: Additional JSON data about the association

### Tokens
Manages authentication tokens:
- `token_id`: UUID primary key
- `user_id`: Reference to users table
- `expiration`: When the token expires

### Apps
Registered applications that can use the login system:
- `app_id`: UUID primary key
- `secret`: Secret key for the app
- `login_callback`: URL to redirect after login
- `name`: Application name
- `oidc`: Whether OpenID Connect is enabled
- `groups`: Required groups for access

### Token Info
Additional information about tokens:
- `token_id`: Reference to tokens table
- `user_id`: Reference to users table
- `app_id`: Reference to apps table
- `app_name`: Name of the app
- `ip`, `location`, `os`, `browser`: Client information
- `logout_token`: Token used for logout
- `session_token`: Token for the session

### Codes
Temporary codes for authentication flows:
- `code`: UUID primary key
- `expiration`: When the code expires
- `challenge`: Challenge for PKCE or app secret verification
- `value`: Data associated with the code

## Environment Variables

The system uses the following environment variables:

### Database Configuration
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_NAME`: PostgreSQL database name

### Cookie Configuration
- `COOKIE_NAME_BI`: Browser identity cookie name (default: 'bi')
- `COOKIE_NAME_II`: Intermediate identity cookie name (default: 'ii')
- `COOKIE_NAME_LI`: Login identity cookie name (default: 'li')
- `COOKIE_DOMAIN`: Domain for cookies
- `SESSION_SECRET`: Secret for cookie encryption

### Application Configuration
- `LOGIN_COOKIE_VERSION`: Version of the cookie format (default: '1')
- `ADMIN_APP_ID`: ID for the admin application
- `ADMIN_APP_SECRET`: Secret for the admin application
- `ADMIN_APP_NAME`: Name for the admin application (default: 'Login')
- `ACCOUNT_APP_ID`: ID for the account application
- `ACCOUNT_APP_NAME`: Name for the account application (default: 'Account')

### Authentication Providers
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Server Configuration
- `PORT`: Port for the standalone server (default: 3000)
- `NODE_ENV`: Environment ('production' enables secure cookies)

## Usage

### As a Standalone Server
```bash
# Start the server
node backend/index.mjs

# Start with a custom port
PORT=4000 node backend/index.mjs
```

### As a Module in an Express Application
```javascript
import express from 'express';
import { registerWithApp } from './backend/index.mjs';

const app = express();

// Register login routes at /api/login
registerWithApp(app);

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
```
