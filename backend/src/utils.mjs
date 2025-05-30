import "dotenv/config";
import pino             from "pino";
import pkceChallenge    from 'pkce-challenge';
import cookieEncrypter  from 'cookie-encrypter';
import knex             from '../db.js';
import fs               from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UAParser }     from 'ua-parser-js';

const logger = pino({ name: "account" });

export const ACCOUNT_APP_ID       = process.env.ACCOUNT_APP_ID;
export const ADMIN_APP_ID         = process.env.ADMIN_APP_ID;
export const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const LOGIN_COOKIE_VERSION = 1;

const SESSION_SECRET = process.env.SESSION_SECRET;
const COOKIE_DOMAIN  = process.env.COOKIE_DOMAIN;

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
    const uuid = uuidv4();
    const base64Uuid = Buffer.from(uuid, 'hex').toString('base64');
    newReferralCode = base64Uuid.substring(0, 22);
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

export function getCookie(req, name) {
    let cookie = null;
    try { cookie = JSON.parse(cookieEncrypter.decryptCookie(req.cookies[name], { key: SESSION_SECRET })); } catch { }
    return cookie;
}

export function setCookie(res, name, value, sameSite = 'strict') {
    if (process.env.NODE_ENV !== 'production') {
        logger.warn({message: 'Running not in production mode, secure not set on cookie'});
    }
    res.cookie(name, cookieEncrypter.encryptCookie(JSON.stringify(value), { key: SESSION_SECRET }),
        {
            sameSite,
            maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
            ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });
}

export function clearCookie(res, name) {
    res.clearCookie(name, {
            ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {})
        });
}

export async function lookupAppInfo(id) {
    try {
        // If no ID is provided, default to the account app
        if (!id) {
            return {
                id: ACCOUNT_APP_ID,
                secret: "7B229E8C-4F29-4480-91E7-01AD0E3C2731",
                name: process.env.ACCOUNT_APP_NAME || 'Account',
            };
        }
        
        // these values are hardcoded into the login service code, and not the
        // db, since they are served up by the login service.. we don't want to
        // end up accidentally deleting the db and then not be able to admin
        // the db
        if (id == ADMIN_APP_ID) {
            return {
                id: ADMIN_APP_ID,
                secret: process.env.ADMIN_APP_SECRET,
                name: process.env.ADMIN_APP_NAME || 'Login',
            };
        }

        if (id == ACCOUNT_APP_ID) {
            return {
                id: ACCOUNT_APP_ID,
                secret: "7B229E8C-4F29-4480-91E7-01AD0E3C2731",
                name: process.env.ACCOUNT_APP_NAME || 'Account',
            };
        }

        return (await knex.raw(`SELECT * FROM apps WHERE id = :id`, { id })).rows[0];
    } catch (e) {
        logger.error(e);
        return null;
    }
}

/// Coming soon...
//import jwt        from 'jsonwebtoken';
//import jwksClient from 'jwks-rsa';
//
///export async function verifyAppleIdToken(idToken, clientId, nonce) {
///    const applePublicKeyUrl = 'https://appleid.apple.com/auth/keys';
///
///    // Get keys from apple Json web key set endpoint (JWKS)
///    const client = jwksClient({
///        jwksUri: applePublicKeyUrl,
///    });
///
///    // Callback passed to jwt.verify that will return the actual key from the JWKS endpoint
///    function getKey(header, callback) {
///        client.getSigningKey(header.kid, (err, key) => {
///            const signingKey = key.publicKey || key.rsaPublicKey;
///            callback(null, signingKey);
///        });
///    }
///
///    return new Promise((resolve, reject) => {
///        jwt.verify(
///            idToken,
///            getKey,
///            {
///                audience: clientId,
///                issuer: 'https://appleid.apple.com',
///                algorithms: ['RS256'],
///            },
///            (err, decodedToken) => {
///                if (err) {
///                    reject(err);
///                } else {
///                    if (decodedToken.nonce === nonce) {
///                        resolve(decodedToken);
///                    } else {
///                        reject(new Error('Invalid nonce'));
///                    }
///                }
///            }
///        );
///    });
///}

