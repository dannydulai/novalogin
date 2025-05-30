import axios from 'axios';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import requestIp from 'request-ip';
import db from '../db.js';

import config from './config.mjs';
import * as utils from './utils.mjs';
import * as auth from './auth.mjs';

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
                    use_handlebars: true,
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
        try {
            const { emailCleaned: validatedEmail, emailKey, success } = utils.genEmailKey(email);
            if (!success) {
                return { status: "InvalidEmail" };
            }

            let user_id = uuidv4();
            let new_referral_code = utils.getReferralCode();

            while (true) {
                const txn = await db.transaction();
                try {
                    let referrer = null;

                    if (referral_code) {
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
                        firstname, lastname
                    ) VALUES (
                        :user_id, :email, :email_key, :referral_code, :password,
                        :firstname, :lastname
                    ) RETURNING *`,
                        {
                            user_id,
                            firstname,
                            lastname,
                            email: validatedEmail,
                            email_key: emailKey,
                            referral_code: new_referral_code,
                            password: await bcrypt.hash(password, await bcrypt.genSalt()),
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

                    if (e.constraint === "users_email_key" || e.constraint === "users_email_key_idx") {
                        return { status: "EmailExists" };
                    }

                    if (e.constraint === "users_pkey") {
                        user_id = uuidv4();
                        continue;
                    }

                    if (e.constraint === "referral_code_idx") {
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
}
