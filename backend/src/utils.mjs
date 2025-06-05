import pino             from "pino";
import pkceChallenge    from 'pkce-challenge';
import cookieEncrypter  from 'cookie-encrypter';
import knex             from '../db.js';
import bcrypt           from 'bcrypt';
import fs               from 'fs';
import path             from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UAParser }     from 'ua-parser-js';
import config           from './config.mjs';
import jwt              from 'jsonwebtoken';
import jwksClient       from 'jwks-rsa';
import nodemailer       from 'nodemailer';

import { SESv2Client, SendEmailCommand }  from '@aws-sdk/client-sesv2';
import { renderEmail }  from './emails.mjs';

const logger = pino({ name: "account" });

export function getUAInfo(useragent) {
    let browser = 'Unknown';
    let os = 'Unknown';
    let platform = 'Unknown';
    try {
        const ua = UAParser(useragent);
        if (ua?.browser?.name) browser = ua.browser.name;
        if (ua?.os?.name) os = ua.os.name;
    } catch {
    }

    return { browser, os, platform };
}


let badEmailDomains = null;
export function genEmailKey(email) {
  if (badEmailDomains === null) {
      badEmailDomains = new Set(fs.readFileSync(path.join(path.dirname('.'), '/src/bad-email-domains.txt'), 'utf-8').split('\n'));
  }

  let emailCleaned = email.trim().toLowerCase();

  if (emailCleaned.search(/[ \t\r\n\v]/) !== -1) return { success: false };

  const parts = emailCleaned.split('@');
  if (parts.length !== 2) return { success: false };
  let user = parts[0];
  let domain = parts[1];

  if (domain.indexOf('.') === -1) return { success: false };
  if (domain.indexOf('..') !== -1) return { success: false };
  if (badEmailDomains.has(domain)) return { success: false };

  user = user.replace(/\./g, '');
  if (['gmail.com', 'googlemail.com', 'google.com'].includes(domain)) {
    const plusIdx = user.indexOf('+');
    if (plusIdx !== -1) user = user.substring(0, plusIdx);
  } else if (domain === 'outlook.com') {
    const plusIdx = user.indexOf('+');
    if (plusIdx !== -1) user = user.substring(0, plusIdx);
  }

  if (user === '') return { success: false };

  const emailKey = user + '@' + domain;

  return {
    success: true,
    emailCleaned,
    emailKey,
  };
}

export function getReferralCode() {
  let newReferralCode;
  do {
    newReferralCode = Buffer.from(uuidv4().replaceAll('-',''), 'hex').toString('base64').replaceAll('=', '');
  } while (newReferralCode.includes('+') || newReferralCode.includes('/'));
  return newReferralCode;
}

export function isValidName(name) {
    name = name?.trim();
    return name && name.length > 0 && name.length < 256;
}

export function isValidEmail(email) {
  if (email.endsWith(".delete")) return false;
  if (email.endsWith(".fraud")) return false;
  if (email.length < 7) return false;
  if (email.length > 512) return false;
  if (email.indexOf("@") === -1) return false;
  if (email.search(/[ ;\\'"[\]{}()\r\n]/) !== -1) return false;
  if (email.charAt(0) === '-') return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;
  if (parts[0].length === 0) return false;
  if (parts[1].indexOf(".") === -1) return false;
  return true;
}

export function isValidPassword(password) {
  if (password.length < 4) return false;
  if (password.length > 512) return false;
  return true;
}


/**
 * Create email transporter based on configuration
 * @returns {Object} - Nodemailer transporter
 */
function createEmailTransporter() {
    // Check if SES credentials are available
    if (config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY) {
        const sesClient = new SESv2Client({
            region: config.AWS_REGION,
            credentials: {
                accessKeyId: config.AWS_ACCESS_KEY_ID,
                secretAccessKey: config.AWS_SECRET_ACCESS_KEY
            }
        });
        
        return nodemailer.createTransport({
            SES: { sesClient, SendEmailCommand }
        });
    }
    
    // Check if SMTP credentials are available
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
        return nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: parseInt(config.SMTP_PORT),
            secure: config.SMTP_SECURE,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS
            }
        });
    }
    
    // No email configuration available
    return null;
}

/**
 * Send email alert functionality
 * @param {Object} opts - Email options including id (template ID) and data
 */
export async function sendEmailAlert(opts) {
    try {
        const transporter = createEmailTransporter();
        
        if (!transporter) {
            // No email configuration - just log
            console.log(`[EMAIL ALERT] Would send email with template '${opts.id}' and data:`, JSON.stringify(opts, null, 2));
            return;
        }

        if (!opts.id) {
            throw new Error('Email template ID is required');
        }

        // Get user email if user_id is provided but email is not
        let email = opts.email;
        if (!email && opts.user_id) {
            const user = await knex('users').where({ user_id: opts.user_id }).select('email').first();
            if (user) {
                email = user.email;
            }
        }

        if (!email) {
            throw new Error('Email address is required');
        }
        
        const emailContent = renderEmail(opts.id, opts);
        
        const mailOptions = {
            from: `${config.FROM_NAME} <${config.FROM_EMAIL}>`,
            to: email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
        };
        
        const result = await transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully to ${email}`, { messageId: result.messageId, templateId: opts.id });
        
    } catch (e) {
        logger.error('Error sending email alert:', e);
        console.error('Error sending email alert:', e);
    }
}

export function getCookie(req, name) {
    let cookie = null;
    try { cookie = JSON.parse(cookieEncrypter.decryptCookie(req.cookies[name], { key: config.SESSION_SECRET })); } catch { }
    return cookie;
}

export function setCookie(res, name, value, sameSite = 'strict') {
    if (config.NODE_ENV !== 'production') {
        logger.warn({message: 'Running not in production mode, secure not set on cookie' });
    }

    res.cookie(name, cookieEncrypter.encryptCookie(JSON.stringify(value), { key: config.SESSION_SECRET }),
        {
            sameSite,
            maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
            ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
            httpOnly: true,
            secure: config.NODE_ENV === 'production'
        });
}

export function clearCookie(res, name) {
    res.clearCookie(name, {
            ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {})
        });
}

export async function lookupAppInfo(id) {
    try {
        // If no ID is provided, default to the account app
        if (!id) {
            return {
                app_id: config.ACCOUNT_APP_ID,
                secret: config.ACCOUNT_APP_SECRET,
                name: config.ACCOUNT_APP_NAME,
            };
        }
        
        // these values are hardcoded into the login service code, and not the
        // db, since they are served up by the login service.. we don't want to
        // end up accidentally deleting the db and then not be able to admin
        // the db
        if (id == config.ADMIN_APP_ID) {
            return {
                app_id: config.ADMIN_APP_ID,
                secret: config.ADMIN_APP_SECRET,
                name: config.ADMIN_APP_NAME,
            };
        }

        if (id == config.ACCOUNT_APP_ID) {
            return {
                app_id: config.ACCOUNT_APP_ID,
                secret: config.ACCOUNT_APP_SECRET,
                name: config.ACCOUNT_APP_NAME,
            };
        }

        return (await knex.raw(`SELECT * FROM apps WHERE app_id = :id`, { id })).rows[0];
    } catch (e) {
        logger.error(e);
        return null;
    }
}

export async function verifyAppleIdToken(idToken, clientId, nonce) {
    const applePublicKeyUrl = 'https://appleid.apple.com/auth/keys';

    // Get keys from apple Json web key set endpoint (JWKS)
    const client = jwksClient({
        jwksUri: applePublicKeyUrl,
    });

    // Callback passed to jwt.verify that will return the actual key from the JWKS endpoint
    function getKey(header, callback) {
        client.getSigningKey(header.kid, (err, key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    }

    return new Promise((resolve, reject) => {
        jwt.verify(
            idToken,
            getKey,
            {
                audience: clientId,
                issuer: 'https://appleid.apple.com',
                algorithms: ['RS256'],
            },
            (err, decodedToken) => {
                if (err) {
                    reject(err);
                } else {
                    if (decodedToken.nonce === nonce) {
                        resolve(decodedToken);
                    } else {
                        reject(new Error('Invalid nonce'));
                    }
                }
            }
        );
    });
}

const ResetPasswordResult = {
    NotFound: 'NotFound',
    InvalidPassword: 'InvalidPassword',
    UnexpectedError: 'UnexpectedError',
    Success: 'Success',
};

export async function resetPassword1(email, from) {
    const code = uuidv4();
    email = email.toLowerCase();

    try {
        if (!isValidEmail(email)) return { status: ResetPasswordResult.NotFound };

        const { success, emailCleaned, emailKey } = genEmailKey(email);
        if (!success) return { status: ResetPasswordResult.NotFound };

        const [user] = (await knex.raw("SELECT user_id, email, is_fraud FROM users WHERE email_key = ?", [emailKey])).rows;
        if (user) {
            if (user.is_fraud) return { status: ResetPasswordResult.NotFound };
        }

        const updateResult = await knex.raw("UPDATE users SET password_reset_token = ? WHERE email_key = ?", [code, emailKey]);
        if (updateResult.rowCount !== 1) return { status: ResetPasswordResult.NotFound };

        const reset_password_url = `${config.HOST}/reset-password-confirm?code=${code}`;

        await sendEmailAlert({
            id: 'password-reset',
            user_id: user.user_id,
            email: user.email,
            reset_password_url,
        });

        return { status: ResetPasswordResult.Success };

    } catch (e) {
        logger.error(e.toString());
        return { status: ResetPasswordResult.UnexpectedError };
    }
}

export async function resetPassword2(code, password, ip) {
    let email = null;

    const trx = await knex.transaction();
    try {
        if (!isValidPassword(password)) throw ResetPasswordResult.InvalidPassword;
        const [user] = (await trx.raw("SELECT email, user_id FROM users WHERE password_reset_token = ?", [code])).rows;

        if (!user) throw ResetPasswordResult.NotFound;

        email = user.email.trim();
        const userId = user.user_id;

        await trx.raw("DELETE FROM tokens WHERE user_id = ?", [userId]);
        await trx.raw("DELETE FROM token_info WHERE user_id = ?", [userId]);

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const updatedUser = await trx.raw("UPDATE users SET password = ?, password_reset_token = null WHERE password_reset_token = ?", [hashedPassword, code]);

        if (updatedUser.rowCount !== 1) throw ResetPasswordResult.UnexpectedError;

        await trx.commit();

        await sendEmailAlert({
            id: 'password-reset-success',
            user_id: user.user_id,
            email: user.email,
            device_location: ip,
        });

        return { status: ResetPasswordResult.Success };
    } catch (e) {
        await trx.rollback();
        logger.error(e);
        if (ResetPasswordResult[e]) return { status: e };
        return { status: ResetPasswordResult.UnexpectedError };
    }
}

export async function resetEmail1(email) {
    const code = uuidv4();
    email = email.toLowerCase();
    try {
        if (!isValidEmail(email)) throw 'NotFound';

        const { emailCleaned: email_cleaned, emailKey: email_key } = genEmailKey(email);
        if (!email_cleaned || !email_key) throw 'NotFound';

        const userInfo = await knex('users')
            .where('email_key', email_key)
            .select('is_fraud')
            .first();

        if (!userInfo) throw 'NotFound';
        const { is_fraud } = userInfo;

        if (is_fraud !== null && is_fraud) throw 'NotFound';

        const updatedRows = await knex('users')
            .where('email_key', email_key)
            .returning('*')
            .update({ password_reset_token: code });

        if (updatedRows.length !== 1) throw 'NotFound';

        const user = updatedRows[0];

        await sendEmailAlert({
            id: 'email-reset',
            user_id: user.user_id,
            email: user.email,
            reset_email_url: `${config.HOST}/reset-email-confirm?code=` + code,
        });

        return { status: 'Success' };
    } catch (e) {
        logger.error(e);
        if (typeof e === 'string') return { status: e };
        return { status: 'UnexpectedError' };
    }
}

export async function resetEmail2(email, code, ip) {
    const trx = await knex.transaction();
    try {
        if (!isValidEmail(email)) throw 'InvalidEmail';

        let oldemail;

        // Get email for return and user_id to delete tokens
        const userInfo = await trx('users')
            .where('password_reset_token', code)
            .select('email', 'user_id')
            .first();

        if (!userInfo) throw 'NotFound';
        oldemail = userInfo.email.trim();
        const { user_id } = userInfo;

        // Kill all tokens due to email change
        await trx('tokens').where('user_id', user_id).del();
        await trx('token_info').where('user_id', user_id).del();

        const { emailCleaned: email_cleaned, emailKey: email_key } = genEmailKey(email);
        if (!email_cleaned || !email_key) throw 'InvalidEmail';

        // Reset the email
        const updatedRows = await trx('users')
            .where('password_reset_token', code)
            .returning('*')
            .update({
                email_key,
                email: email_cleaned,
                password_reset_token: null,
                updated: trx.fn.now()
            });

        if (updatedRows.length !== 1) throw 'UnexpectedError';

        await trx.commit();

        const user = updatedRows[0];

        await sendEmailAlert({
            id: 'email-reset-success',
            user_id: user.user_id,
            email: user.email,
            device_location: ip,
        });

        return { status: 'Success' };
    } catch (e) {
        await trx.rollback();
        if (e.code === '23505') {
            if (e.constraint === 'users_email_key' || e.constraint === 'users_email_idx') return { status: 'EmailExists' };
        }
        if (typeof e === 'string') return { status: e };
        return { status: 'UnexpectedError' };
    }
}

