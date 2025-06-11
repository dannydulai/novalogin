import axios from 'axios';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import requestIp from 'request-ip';
import { OAuth2Client } from 'google-auth-library';
import db from '../db.js';

import config from './config.mjs';
import * as utils from './utils.mjs';
import * as auth from './auth.mjs';

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// Authentication middleware
const requireAuth = auth.verifyAuthMiddleware;


export default function(app, logger) {

    app.post("/api/account/session", requireAuth, async (req, res) => {
        try {
            await auth.logout({
                logout_token: req.body.logout_token,
                session_token: req.body.session_token,
            });

            return res.status(200).send();
        } catch (e) {
            logger.error(e);
            return res.status(500).send("Server Error");
        }
    })

    
    // Update account information endpoint
    app.post("/api/account/update", requireAuth, async (req, res) => {
        try {
            const { user_id } = req.auth;
            
            // Validate input
            const { firstname, lastname } = req.body;
            
            if (!utils.isValidName(firstname)) {
                return res.status(400).send({ status: "InvalidFirstName" });
            }
            
            if (!utils.isValidName(lastname)) {
                return res.status(400).send({ status: "InvalidLastName" });
            }
            
            // Update user information
            await db('users')
                .where({ user_id })
                .update({
                    firstname,
                    lastname,
                    updated: db.fn.now()
                });
                
            return res.status(200).send({ status: "Success" });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });
    
    // Get account information endpoint
    app.post("/api/account/info", requireAuth, async (req, res) => {
        try {
            const { user_id } = req.auth;

            // Get user information
            const user = await db('users')
                .where({ user_id })
                .select(
                    'user_id',
                    'email',
                    'firstname',
                    'lastname',
                    'created',
                    'updated',
                    'referral_code',
                    'utm_data',
                    'groups',
                    'tfa_enabled',
                    'class'
                )
                .first();

            if (!user) {
                return res.status(404).send({ status: "UserNotFound" });
            }

            // Get user associations
            const associations = await db('associations')
                .where({ user_id })
                .select(
                    'association_id',
                    'association_type',
                    'created',
                    'updated',
                    'data'
                );

            // Get active sessions and mark the current one
            const { session } = utils.getCookie(req, config.COOKIE_NAME_LI);
            const sessions = await db('token_info')
                .join('tokens', 'token_info.token_id', 'tokens.token_id')
                .where({ 'token_info.user_id': user_id })
                .where('tokens.expiration', '>', db.fn.now())
                .select(
                    'token_info.session_token',
                    'token_info.app_id',
                    'token_info.app_name',
                    'token_info.ip',
                    'token_info.location',
                    'token_info.os',
                    'token_info.browser',
                    'token_info.created',
                    'token_info.logout_token'
                )
                .then(sessions => sessions.map(s => ({
                    ...s,
                    is_current: s.session_token === session
                })));

            return res.status(200).send({
                status: "Success",
                user,
                associations,
                sessions
            });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    // Unlink account association endpoint
    app.post("/api/account/unlink-account", requireAuth, async (req, res) => {
        try {
            const { user_id } = req.auth;
            const { associationType, associationId } = req.body;

            if (!associationType || !associationId) {
                return res.status(400).send({ status: "InvalidParameters" });
            }

            // Delete the association
            const result = await db('associations')
                .where({
                    user_id,
                    association_type: associationType,
                    association_id: associationId
                })
                .del();

            if (result === 0) {
                return res.status(404).send({ status: "AssociationNotFound" });
            }

            return res.status(200).send({ status: "Success" });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });
    // Create account endpoint
    app.post("/api/account/create", async (req, res) => {
        try {
            if (!(await auth.validateRecaptcha(req.body.recaptcha))) {
                return res.status(400).send({ status: "InvalidRecaptcha" });
            }

            const { status, user_id, cookieLI } = await createUser(req, req.body);
            if (status !== 'Success') {
                return res.status(400).send({ status });
            }

            const cookieBI = {
                v: config.LOGIN_COOKIE_VERSION,
                session: cookieLI.session,
            };

            utils.setCookie(res, config.COOKIE_NAME_BI, cookieBI);
            utils.setCookie(res, config.COOKIE_NAME_LI, cookieLI);

            return res.status(200).send({ status });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    /**
     * Create a new user account
     * @param {Object} req - Express request object
     * @param {Object} params - User creation parameters
     * @returns {Object} Status and user information
     */
    async function createUser(req, {
        recaptcha,
        firstname,
        lastname,
        email,
        password,
        referral_code
    }) {
        try {
            // Validate user input
            if (!utils.isValidName(firstname)) return { status: "InvalidName" };
            if (!utils.isValidName(lastname)) return { status: "InvalidName" };
            if (!utils.isValidEmail(email)) return { status: "InvalidEmail" };
            if (!utils.isValidPassword(password)) return { status: "InvalidPassword" };

            // Create the user
            const { status, user_id, cookieLI } = await _createUser(req, {
                firstname,
                lastname,
                email,
                password,
                referral_code
            });

            if (status !== "Success") {
                return { status };
            }

            // Send welcome email
            setTimeout(() => {
                utils.sendEmailAlert({
                    id: 'welcome',
                    user_id: user_id
                });
            }, 1000);

            return { status: "Success", user_id, cookieLI };
        } catch (e) {
            if (e.code === "23505") {
                if (e.constraint === "users_email_key" || e.constraint === "users_email_key_idx") {
                    return { status: "EmailExists" };
                }
            }
            logger.error(e);
            return { status: "UnexpectedError" };
        }
    }

    /**
     * Internal function to create a user in the database
     * @param {Object} req - Express request object
     * @param {Object} params - User creation parameters
     * @returns {Object} Status and user information
     */
    async function _createUser(req, {
        firstname,
        lastname,
        email,
        password,
        referral_code
    }) {
        // Extract UTM parameters from query string
        const utmData = {};
        utmData.utm_source   = req.query?.utm_source   || req.body?.utm_source   || null;
        utmData.utm_medium   = req.query?.utm_medium   || req.body?.utm_medium   || null;
        utmData.utm_campaign = req.query?.utm_campaign || req.body?.utm_campaign || null;
        utmData.utm_term     = req.query?.utm_term     || req.body?.utm_term     || null;
        utmData.utm_content  = req.query?.utm_content  || req.body?.utm_content  || null;

        try {
            const { emailCleaned: validatedEmail, emailKey, success } = utils.genEmailKey(email);
            if (!success) {
                return { status: "InvalidEmail" };
            }

            let user_id = uuidv4();
            let new_referral_code = config.HIDE_REFERRAL_CODE ? null : utils.getReferralCode();

            while (true) {
                const txn = await db.transaction();
                try {
                    let referrer = null;

                    if (!config.HIDE_REFERRAL_CODE && referral_code) {
                        const result = await txn.raw("SELECT firstname, user_id FROM users WHERE referral_code = ?", [referral_code]);
                        if (result.rowCount === 0) {
                            await txn.commit();
                            return { status: "ReferralNotFound" };
                        }

                        // We're ignoring referrer functionality as requested
                    }

                    const [user] = (await txn.raw(
                        `INSERT INTO users (
                        user_id, email, email_key, referral_code, password,
                        firstname, lastname, utm_data
                    ) VALUES (
                        :user_id, :email, :email_key, :referral_code, :password,
                        :firstname, :lastname, :utm_data
                    ) RETURNING *`,
                        {
                            user_id,
                            firstname,
                            lastname,
                            email: validatedEmail,
                            email_key: emailKey,
                            referral_code: new_referral_code,
                            password: await bcrypt.hash(password, await bcrypt.genSalt()),
                            utm_data: JSON.stringify(utmData),
                        }
                    )).rows;

                    const session_token = uuidv4();
                    const logout_token = uuidv4();
                    const access_token = uuidv4();

                    const [token] = (await txn.raw(`
                    INSERT INTO tokens (token_id, user_id, expiration)
                    VALUES (:access_token, :user_id, now() + interval '1000 year')
                    RETURNING *;
                `, {
                    access_token,
                    user_id: user.user_id
                })).rows;

                    const { os, browser } = auth.getUAInfo(req.get('User-Agent'));
                    await txn.raw(`
                    INSERT INTO token_info (
                        session_token,
                        logout_token,
                        token_id,
                        user_id,
                        ip,
                        location,
                        app_id,
                        app_name,
                        os,
                        browser
                    ) VALUES (
                        :session_token,
                        :logout_token,
                        :access_token,
                        :user_id,
                        :ip,
                        :location,
                        :app_id,
                        :app_name,
                        :os,
                        :browser
                    );
                `, {
                    session_token,
                    logout_token,
                    access_token,
                    user_id: user.user_id,
                    ip: requestIp.getClientIp(req),
                    location: await auth.getLocation(requestIp.getClientIp(req)),
                    app_id: config.ACCOUNT_APP_ID,
                    app_name: config.ACCOUNT_APP_NAME,
                    os,
                    browser,
                });

                    const cookieLI = {
                        v: config.LOGIN_COOKIE_VERSION,
                        user_id: user.user_id,
                        session: session_token,
                        groups: [],
                        access_token,
                        logout_token,
                    };

                    await txn.commit();
                    return { status: "Success", user_id: user.user_id, cookieLI };
                } catch (e) {
                    await txn.rollback();

                    if (e.constraint === "users_email_key_key" || e.constraint === "users_email_key") {
                        return { status: "EmailExists" };
                    }

                    if (e.constraint === "users_pkey") {
                        user_id = uuidv4();
                        continue;
                    }

                    if (e.constraint === "referral_code_key") {
                        new_referral_code = utils.getReferralCode();
                        continue;
                    }

                    throw e;
                }
            }
        } catch (e) {
            logger.error(e);
            return { status: "UnexpectedError" };
        }
    }

    app.post("/api/account/connect-apple", requireAuth, async (req, res) => {
        try {
            if (!config.APPLE_CLIENT_ID) return res.status(400).send({ status: "AppleNotConfigured" });
            if (!req.body.id_token)      return res.status(400).send();
            if (!req.body.nonce)         return res.status(400).send();
            const {
                sub,
                email,
                email_verified
            } = await utils.verifyAppleIdToken(req.body.id_token, config.APPLE_CLIENT_ID, req.body.nonce);

            const otheraccts = await db('associations')
            .where({association_type: 'apple', association_id: sub})
            .whereNot({user_id: req.auth.user_id})
            .first();

            if (otheraccts) {
                return res.status(400).send({ status: 'AlreadyAssociated' });
            }

            await db('associations')
            .insert({
                user_id: req.auth.user_id,
                association_type: 'apple',
                association_id: sub,
                updated: db.raw('now()'),
                data: {
                    email: email,
                    email_verified: email_verified
                }
            })
            .onConflict(['user_id', 'association_type', 'association_id'])
            .merge(['updated', 'data']);

            return res.status(200).send({ status: 'Success' });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    // Connect Google account - step 1 (get redirect URL)
    app.post("/api/account/connect-google-1", requireAuth, async (req, res) => {
        try {
            if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
                return res.status(400).send({ status: "GoogleNotConfigured" });
            }

            const stringifiedParams = new URLSearchParams({
                prompt: 'select_account',
                client_id: config.GOOGLE_CLIENT_ID,
                redirect_uri: `${config.HOST}/account`,
                scope: [
                    'openid',
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile',
                ].join(' '),
                response_type: 'code',
                access_type: 'offline',
                state: encodeURIComponent(JSON.stringify({ action: 'connect_google' }))
            }).toString();

            return res.status(200).send({
                status: "Success",
                redirect: `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`
            });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    // Connect Google account - step 2 (handle callback)
    app.post("/api/account/connect-google-2", requireAuth, async (req, res) => {
        try {
            const { user_id } = req.auth;
            const { code } = req.body;

            if (!code) {
                return res.status(400).send({ status: "InvalidCode" });
            }

            if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
                return res.status(400).send({ status: "GoogleNotConfigured" });
            }

            const txn = await db.transaction();
            try {
                const { data } = await axios({
                    url: `https://oauth2.googleapis.com/token`,
                    method: 'post',
                    data: {
                        client_id: config.GOOGLE_CLIENT_ID,
                        client_secret: config.GOOGLE_CLIENT_SECRET,
                        redirect_uri: `${config.HOST}/account`,
                        grant_type: 'authorization_code',
                        code,
                    },
                });

                const ticket = await googleClient.verifyIdToken({
                    idToken: data.id_token,
                    audience: config.GOOGLE_CLIENT_ID,
                });

                const payload = ticket.getPayload();
                const { email, sub } = payload;

                // Check if this Google account is already associated with another user
                const existing = await txn('associations')
                    .where({ association_type: 'google', association_id: sub })
                    .whereNot({ user_id })
                    .first();

                if (existing) {
                    await txn.rollback();
                    return res.status(400).send({ status: 'AlreadyAssociated' });
                }

                // Create or update the association
                await txn('associations')
                    .insert({
                        user_id,
                        association_type: 'google',
                        association_id: sub,
                        updated: txn.fn.now(),
                        data: { email }
                    })
                    .onConflict(['user_id', 'association_type', 'association_id'])
                    .merge(['updated', 'data']);

                await txn.commit();
                return res.status(200).send({ status: 'Success' });
            } catch (e) {
                await txn.rollback();
                logger.error(e);
                return res.status(500).send({ status: 'UnexpectedError' });
            }
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    // Reset password endpoint
    app.post("/api/account/reset-password", async (req, res) => {
        try {
            const email = req.query.email || req.body.email;
            const code = req.query.code || req.body.code;
            const password = req.query.password || req.body.password;

            if (email) {
                const result = await utils.resetPassword1(email, 'account');
                return res.json(result);
            } else if (password && code) {
                const result = await utils.resetPassword2(code, password, requestIp.getClientIp(req));
                return res.json(result);
            } else {
                return res.json({ status: 'InvalidRequest' });
            }
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    // Reset email endpoint
    app.post("/api/account/reset-email", async (req, res) => {
        try {
            const email = req.query.email || req.body.email;
            const code = req.query.code || req.body.code;

            if (email && code) {
                const result = await utils.resetEmail2(email, code, requestIp.getClientIp(req));
                return res.json(result);
            } else if (email) {
                const result = await utils.resetEmail1(email);
                return res.json(result);
            } else {
                return res.json({ status: 'InvalidRequest' });
            }
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });
}
