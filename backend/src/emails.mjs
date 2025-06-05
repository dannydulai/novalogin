import Handlebars from 'handlebars';

// Email templates with handlebars syntax
const templates = {
    'login-success': {
        subject: 'Successful Login to {{app_name}}',
        text: `Hello,

We detected a successful login to your account from {{location}}.

If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.

Best regards,
The Security Team`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Successful Login</h2>
    <p>Hello,</p>
    <p>We detected a successful login to your account from <strong>{{location}}</strong>.</p>
    <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
    <p>Best regards,<br>The Security Team</p>
</div>`
    },

    'login-success-tfa': {
        subject: 'Successful Login with 2FA to {{app_name}}',
        text: `Hello,

We detected a successful login to your account from {{location}} using two-factor authentication.

If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.

Best regards,
The Security Team`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Successful Login with 2FA</h2>
    <p>Hello,</p>
    <p>We detected a successful login to your account from <strong>{{location}}</strong> using two-factor authentication.</p>
    <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
    <p>Best regards,<br>The Security Team</p>
</div>`
    },

    'welcome': {
        subject: 'Welcome to Nova Auth!',
        text: `Welcome to Nova Auth!

Thank you for creating your account. You can now securely authenticate with applications using our platform.

Get started by visiting your account dashboard to manage your profile and security settings.

Best regards,
The Nova Auth Team`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Welcome to Nova Auth!</h2>
    <p>Thank you for creating your account. You can now securely authenticate with applications using our platform.</p>
    <p>Get started by visiting your account dashboard to manage your profile and security settings.</p>
    <p>Best regards,<br>The Nova Auth Team</p>
</div>`
    },

    'password-reset': {
        subject: 'Password Reset Request',
        text: `Hello,

You requested a password reset for your account. Click the link below to reset your password:

{{reset_password_url}}

If you didn't request this, please ignore this email.

Best regards,
The Security Team`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Password Reset Request</h2>
    <p>Hello,</p>
    <p>You requested a password reset for your account. Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{reset_password_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
    </div>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280;">{{reset_password_url}}</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>The Security Team</p>
</div>`
    },

    'password-reset-success': {
        subject: 'Password Successfully Reset',
        text: `Hello,

Your password has been successfully reset from {{device_location}}.

If this was you, no action is needed. If you don't recognize this activity, please contact support immediately.

Best regards,
The Security Team`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #16a34a;">Password Successfully Reset</h2>
    <p>Hello,</p>
    <p>Your password has been successfully reset from <strong>{{device_location}}</strong>.</p>
    <p>If this was you, no action is needed. If you don't recognize this activity, please contact support immediately.</p>
    <p>Best regards,<br>The Security Team</p>
</div>`
    },

    'email-reset': {
        subject: 'Email Change Request',
        text: `Hello,

You requested to change your email address. Click the link below to confirm the change:

{{reset_email_url}}

If you didn't request this, please ignore this email.

Best regards,
The Security Team`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Email Change Request</h2>
    <p>Hello,</p>
    <p>You requested to change your email address. Click the button below to confirm the change:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{reset_email_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email Change</a>
    </div>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280;">{{reset_email_url}}</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>The Security Team</p>
</div>`
    },

    'email-reset-success': {
        subject: 'Email Address Successfully Changed',
        text: `Hello,

Your email address has been successfully changed from {{device_location}}.

If this was you, no action is needed. If you don't recognize this activity, please contact support immediately.

Best regards,
The Security Team`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #16a34a;">Email Address Successfully Changed</h2>
    <p>Hello,</p>
    <p>Your email address has been successfully changed from <strong>{{device_location}}</strong>.</p>
    <p>If this was you, no action is needed. If you don't recognize this activity, please contact support immediately.</p>
    <p>Best regards,<br>The Security Team</p>
</div>`
    }
};

/**
 * Render email template with provided data
 * @param {string} templateId - The template ID to render
 * @param {Object} data - Data to pass to the template
 * @returns {Object} - Rendered email with subject, text, and html
 */
export function renderEmail(templateId, data = {}) {
    const template = templates[templateId];
    
    if (!template) {
        throw new Error(`Email template '${templateId}' not found`);
    }

    // Compile and render each part of the template
    const subjectTemplate = Handlebars.compile(template.subject);
    const textTemplate = Handlebars.compile(template.text);
    const htmlTemplate = Handlebars.compile(template.html);

    return {
        subject: subjectTemplate(data),
        text: textTemplate(data),
        html: htmlTemplate(data)
    };
}

/**
 * Get list of available email templates
 * @returns {Array} - Array of template IDs
 */
export function getAvailableTemplates() {
    return Object.keys(templates);
}
