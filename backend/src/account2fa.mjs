import QRCode from 'qrcode';
import twofactor from 'node-2fa';
import requestIp from 'request-ip';
import db from '../db.js';

import config from './config.mjs';
import * as utils from './utils.mjs';
import * as auth from './auth.mjs';

export default function(app, logger) {
    // Authentication middleware
    const requireAuth = auth.verifyAuthMiddleware;
    /**
     * Prepare for adding 2FA to an account
     * Generates a secret and QR code
     */
    app.post("/api/account/tfa/add-prep", requireAuth, async (req, res) => {
        try {
            const { user_id, email } = req.auth;

            // Get user information
            const user = await db('users')
                .where({ user_id })
                .select('tfa_enabled')
                .first();

            if (!user) {
                return res.status(404).send({ status: "UserNotFound" });
            }

            // Check if 2FA is already enabled
            if (user.tfa_enabled) {
                return res.status(400).send({ status: 'AlreadyEnabled' });
            }

            // Generate new 2FA secret
            const secret = twofactor.generateSecret({ name: config.appName, account: email }).secret;

            // Generate QR code
            const qrCode = await QRCode.toDataURL(
                `otpauth://totp/${encodeURIComponent(config.appName)}:${encodeURIComponent(email)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(config.appName)}`, 
                { scale: 6 }
            );

            return res.status(200).send({
                status: "Success",
                secret,
                qr: qrCode
            });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    /**
     * Add 2FA to an account
     * Verifies the token and saves the secret
     */
    app.post("/api/account/tfa/add", requireAuth, async (req, res) => {
        try {
            if (!req.body.secret) {
                return res.status(400).send({ status: "BadRequest", field: "secret" });
            }
            
            if (!req.body.token) {
                return res.status(400).send({ status: "BadRequest", field: "token" });
            }

            const { user_id, email } = req.auth;

            // Get user information
            const user = await db('users')
                .where({ user_id })
                .select('tfa_enabled', 'email')
                .first();

            if (!user) {
                return res.status(404).send({ status: "UserNotFound" });
            }

            // Check if 2FA is already enabled
            if (user.tfa_enabled) {
                return res.status(400).send({ status: 'AlreadyEnabled' });
            }

            // Verify the token
            const verified = twofactor.verifyToken(req.body.secret, req.body.token);
            if (!verified) {
                // If token is invalid, generate a new QR code
                const secret = twofactor.generateSecret({ name: config.appName, account: user.email }).secret;
                const qrCode = await QRCode.toDataURL(
                    `otpauth://totp/${encodeURIComponent(config.appName)}:${encodeURIComponent(user.email)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(config.appName)}`, 
                    { scale: 6 }
                );
                
                return res.status(400).send({
                    status: "BadToken",
                    qr: qrCode,
                    secret
                });
            }

            // Save the 2FA secret and enable 2FA
            await db('users')
                .where({ user_id })
                .update({
                    tfa_secret: req.body.secret,
                    tfa_enabled: true,
                    updated: db.fn.now()
                });

            return res.status(200).send({ status: 'Success' });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    /**
     * Remove 2FA from an account
     * Verifies the token and removes the secret
     */
    app.post("/api/account/tfa/remove", requireAuth, async (req, res) => {
        try {
            if (!req.body.token) {
                return res.status(400).send({ status: "BadRequest", field: "token" });
            }

            const { user_id } = req.auth;

            // Get user information
            const user = await db('users')
                .where({ user_id })
                .select('tfa_enabled', 'tfa_secret')
                .first();

            if (!user) {
                return res.status(404).send({ status: "UserNotFound" });
            }

            // Check if 2FA is not enabled
            if (!user.tfa_enabled) {
                return res.status(200).send({ status: 'Success' });
            }

            // Verify the token
            const verified = twofactor.verifyToken(user.tfa_secret, req.body.token);
            if (!verified) {
                return res.status(400).send({ status: "BadToken" });
            }

            // Remove the 2FA secret and disable 2FA
            await db('users')
                .where({ user_id })
                .update({
                    tfa_secret: null,
                    tfa_enabled: false,
                    updated: db.fn.now()
                });

            return res.status(200).send({ status: 'Success' });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });
}
