import 'dotenv/config';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import requestIp from 'request-ip';
import db from '../db.js';

import * as utils from './utils.mjs';
import * as auth from './auth.mjs';

// Environment variables
const COOKIE_NAME_BI = process.env.COOKIE_NAME_BI || 'bi';
const COOKIE_NAME_LI = process.env.COOKIE_NAME_LI || 'li';
const LOGIN_COOKIE_VERSION = process.env.LOGIN_COOKIE_VERSION || '1';
const ACCOUNT_APP_ID = process.env.ACCOUNT_APP_ID;


export default function(app, logger) {
    // Create account endpoint
    app.post("/api/account/create", async (req, res) => {
        try {
            // Validate recaptcha
            if (!req.body.recaptcha) {
                return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
            }
            if (!(await auth.validateRecaptcha(req.body.recaptcha))) {
                return res.status(400).send({ status: "InvalidRecaptcha" });
            }

            const { status, user_id, cookieLI } = await createUser(req, req.body);
            if (status !== 'Success') {
                return res.status(400).send({ status });
            }

            const cookieBI = {
                v: LOGIN_COOKIE_VERSION,
                session: cookieLI.session,
            };

            utils.setCookie(res, COOKIE_NAME_BI, cookieBI);
            utils.setCookie(res, COOKIE_NAME_LI, cookieLI);

            return res.status(200).send({ status });
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });
}

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
    referralcode
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
            referralcode
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
    referralcode
}) {
    try {
        const { emailCleaned: validatedEmail, emailKey, success } = utils.genEmailKey(email);
        if (!success) {
            return { status: "InvalidEmail" };
        }

        let user_id = uuidv4();
        let newReferralCode = utils.getReferralCode();

        while (true) {
            const txn = await db.transaction();
            try {
                let referrer = null;

                if (referralcode) {
                    const result = await txn.raw("SELECT firstname, user_id FROM users WHERE referralcode = ?", [referralcode]);
                    if (result.rowCount === 0) {
                        await txn.commit();
                        return { status: "ReferralNotFound" };
                    }
                    
                    // We're ignoring referrer functionality as requested
                }

                const [user] = (await txn.raw(
                    `INSERT INTO users (
                        user_id, email, email_key, referralcode, password, 
                        firstname, lastname, log
                    ) VALUES (
                        :user_id, :email, :email_key, :referralcode, :password, 
                        :firstname, :lastname, :log
                    ) RETURNING *`,
                    {
                        user_id,
                        firstname,
                        lastname,
                        email: validatedEmail,
                        email_key: emailKey,
                        referralcode: newReferralCode,
                        password: await bcrypt.hash(password, await bcrypt.genSalt()),
                        log: `Created: ${new Date().toISOString()}`
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
                        appid,
                        appname,
                        os,
                        browser
                    ) VALUES (
                        :session_token,
                        :logout_token,
                        :access_token,
                        :user_id,
                        :ip,
                        :location,
                        :appid,
                        :appname,
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
                    appid: ACCOUNT_APP_ID,
                    appname: 'Account',
                    os,
                    browser,
                });

                const cookieLI = {
                    v: LOGIN_COOKIE_VERSION,
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

                if (e.constraint === "referralcode_idx") {
                    newReferralCode = utils.getReferralCode();
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
