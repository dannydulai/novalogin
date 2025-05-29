import pino            from "pino";
import pkceChallenge   from 'pkce-challenge';
import cookieEncrypter from 'cookie-encrypter';

import jwt        from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import config          from './config.js';
import knex            from './db.js';

const logger = pino({ name: "account" });

export const ACCOUNT_APP_ID       = "9FE57595-FD11-4E28-B37F-9C5C29A9CC5B";
export const ADMIN_APP_ID         = "87A883F5-E413-4B0A-B619-ED866E975D2E";
export const GOOGLE_CLIENT_ID     = '92734372290-cq0btomrba7c886npam0do95d09uqbkq.apps.googleusercontent.com';
export const GOOGLE_CLIENT_SECRET = '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';
export const LOGIN_COOKIE_VERSION = 1;

export function getCookie(req, name) {
    let cookie = null;
    try { cookie = JSON.parse(cookieEncrypter.decryptCookie(req.cookies[name], { key: config.sessionSecret })); } catch { }
    return cookie;
}

export function setCookie(res, name, value, sameSite = 'strict') {
    if (process.env.NODE_ENV !== 'production') {
        logger.warn({message: 'Running not in production mode, secure not set on cookie'});
    }
    res.cookie(name, cookieEncrypter.encryptCookie(JSON.stringify(value), { key: config.sessionSecret }),
        {
            sameSite,
            maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
            ...(config.cookieDomain ? { domain: config.cookieDomain} : {}),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });
}

export function clearCookie(res, name) {
    res.clearCookie(name, {
            ...(config.cookieDomain ? { domain: config.cookieDomain} : {})
        });
}

export async function lookupAppInfo(id) {
    try {
        // these values are hardcoded into the login service code, and not the
        // db, since they are served up by the login service.. we don't want to
        // end up accidentally deleting the db and then not be able to admin
        // the db
        if (id == ADMIN_APP_ID) {
            return {
                id:  ADMIN_APP_ID,
                secret: "3D4EC30F-5F57-4BDE-8A38-3E98F8A07BDE",
                name: 'Roon Unified Login',
                skipprofile: true
            };
        }

        if (id == ACCOUNT_APP_ID) {
            return {
                id:  ACCOUNT_APP_ID,
                secret: "7B229E8C-4F29-4480-91E7-01AD0E3C2731",
                name: 'Roon Unified Login',
                skipprofile: true
            };
        }

        return (await knex.raw(`SELECT * FROM apps WHERE id = :id`, { id })).rows[0];
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
