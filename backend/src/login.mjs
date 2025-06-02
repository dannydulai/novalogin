import pkceChallenge    from 'pkce-challenge';
import axios            from 'axios';
import requestIp        from 'request-ip';
import { OAuth2Client } from 'google-auth-library';
import twofactor        from 'node-2fa';
import jwk              from 'jsonwebtoken';
import rsaPemToJwk      from 'rsa-pem-to-jwk';
import fs               from 'fs';

import config     from './config.mjs';
import * as utils from './utils.mjs';
import * as auth  from './auth.mjs';
import db         from '../db.js';

// Initialize Google OAuth client
const googleClient   = new OAuth2Client(config.GOOGLE_CLIENT_ID);
const oidcEnabled    = config.OIDC_PUBLIC_KEY && config.OIDC_PRIVATE_KEY;
const oidcPublicKey  = oidcEnabled ? fs.readFileSync(config.OIDC_PUBLIC_KEY, 'utf8') : null;
const oidcPrivateKey = oidcEnabled ? fs.readFileSync(config.OIDC_PRIVATE_KEY, 'utf8') : null;
const oidcJwk        = oidcEnabled ? rsaPemToJwk(oidcPublicKey, { use: 'sig' }, 'public') : null;

export default function (app, logger) {
    /**
     * Generate a code exchange for authentication
     */
    async function generateCodeExchange(challenge, exchangeInfo, url, state) {
        try {
            const code = (await db.raw(`INSERT INTO codes ( challenge, value ) VALUES ( :challenge, :value ) RETURNING code`, { 
                challenge, 
                value: JSON.stringify(exchangeInfo) 
            })).rows[0].code;

            if (url.indexOf("?") == -1)
                url += "?code=" + code;
            else
                url += "&code=" + code;

            if (state)
                url += "&state=" + encodeURIComponent(state);

            return url;

        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    /**
     * Get code exchange information
     */
    async function getCodeExchange(code, opts) {
        try {
            if (opts.verifier)
                return JSON.parse((await db.raw(`DELETE FROM codes WHERE code = :code AND challenge = :challenge RETURNING value`, { 
                    code, 
                    challenge: "PKCE-" + pkceChallenge.generateChallenge(opts.verifier) 
                })).rows[0].value);
            else
                return JSON.parse((await db.raw(`DELETE FROM codes WHERE code = :code AND challenge = :challenge RETURNING value`, { 
                    code, 
                    challenge: "APPSECRET-" + opts.client_secret 
                })).rows[0].value);
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    /**
     * Handle login process
     */
    async function doLogin(req, res, authinfo) {
        const loginappinfo = await utils.lookupAppInfo(config.ACCOUNT_APP_ID);
        const cookBI = utils.getCookie(req, config.COOKIE_NAME_BI);

        // Let's check if the user provided valid credentials, and then save the login session cookie.
        const loginResponse = await auth.login(cookBI, req.get('User-Agent'), loginappinfo.id, loginappinfo.name, requestIp.getClientIp(req), authinfo);

        if (loginResponse.status != 'Success') return { loginResponse };

        const cookII = { 
            v: config.LOGIN_COOKIE_VERSION,
            user_id: loginResponse.user_id,
            groups: loginResponse.groups,
            access_token: loginResponse.access_token,
            logout_token: loginResponse.logout_token,
            session: loginResponse.session,
            temp: {
                id:        req.query.id || req.body.id,
                cb:        req.query.cb || req.body.cb,
                challenge: req.query.challenge || req.body.challenge,
                state:     req.query.state || req.body.state,
                email:     req.query.email || req.body.email,
                location:  loginResponse.location,
                tfa:       loginResponse.tfa,
            },
        };
        
        utils.setCookie(res, config.COOKIE_NAME_BI, { v: config.LOGIN_COOKIE_VERSION, session: loginResponse.session });
        
        if (!cookII.temp.tfa.enabled) {
            utils.sendEmailAlert({
                id: 'login-success',
                use_handlebars: true,
                user_id: cookII.user_id,
                location: cookII.temp.location
            });
        }
        
        return { loginResponse, cookBI, cookII };
    }

    /**
     * Save login cookie
     */
    async function saveCookLI(_req, res, cookII) {
        if (cookII.temp) {
            utils.setCookie(res, config.COOKIE_NAME_II, cookII, 'lax'); // Needs to be lax for navigations purposes
            utils.clearCookie(res, config.COOKIE_NAME_LI);
        } else {
            utils.setCookie(res, config.COOKIE_NAME_LI, cookII, 'lax'); // Needs to be lax for navigations purposes
            utils.clearCookie(res, config.COOKIE_NAME_II);
        }
    }

    // Logout endpoint (POST)
    app.post("/api/login/logout", async (req, res) => {
        try {
            if (req.query.logout_token || req.body.logout_token) {
                await auth.logout({ logout_token: req.query.logout_token || req.body.logout_token });
                utils.clearCookie(res, config.COOKIE_NAME_LI);
                utils.clearCookie(res, config.COOKIE_NAME_II);
                return res.send();
            } else {
                const cookLI = utils.getCookie(req, config.COOKIE_NAME_LI);
                if (cookLI && cookLI.logout_token)
                    await auth.logout({ logout_token: cookLI.logout_token });
                utils.clearCookie(res, config.COOKIE_NAME_LI);
                utils.clearCookie(res, config.COOKIE_NAME_II);
                return res.send();
            }
        } catch (e) {
            logger.error(e);
            return res.status(500).send("Server Error");
        }
    });

    // Logout endpoint (GET) - DO NOT USE COOKIES
    app.get("/api/login/logout", async (req, res) => {
        try {
            if (!req.query.logout_token) return res.status(400).send({ status: "BadRequest", field: "logout_token" });
            await auth.logout({ logout_token: req.query.logout_token });
            return res.send();
        } catch (e) {
            logger.error(e);
            return res.status(500).send("Server Error");
        }
    });

    // Google callback
    app.post("/api/login/gcb", async (req, res) => {
        try {
            if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

            // Allow null ID - will default to account app
            const appinfo = await utils.lookupAppInfo(req.body.id);
            if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

            const ticket = await googleClient.verifyIdToken({
                idToken: req.body.id_token,
                audience: config.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { email, sub } = payload;

            if (!email) return res.status(400).send({ status: "InvalidEmail" });
            if (!sub)   return res.status(400).send({ status: "BadRequest" });

            const { loginResponse, cookII } = await doLogin(req, res, { googleEmail: email, googleId: sub });

            if (loginResponse.status === 'NotFound') return res.status(400).send({ status: "NotFound" });
            if (loginResponse.status != 'Success')   return res.status(400).send({ status: "ServerError" });

            await saveCookLI(req, res, cookII);
            return res.status(200).send();
        } catch (e) {
            logger.error(e);
            return res.status(500).send({status: "ServerError"});
        }
    });

    // Login status
    app.post("/api/login/status", async (req, res) => {
        try {
            const appinfo = await utils.lookupAppInfo(req.body.id);
            if (!appinfo) return res.status(400).send("Bad Request (invalid id)");

            // BI is the browser identity stuff -- is so we can identify browsers that have logged in before
            const cookBI = utils.getCookie(req, config.COOKIE_NAME_BI);

            // If no BI or BI is outdated, clear cookies and force login
            if (!cookBI || cookBI.v != config.LOGIN_COOKIE_VERSION) {
                utils.clearCookie(res, config.COOKIE_NAME_BI);
                utils.clearCookie(res, config.COOKIE_NAME_II);
                utils.clearCookie(res, config.COOKIE_NAME_LI);
                return res.send({ state: "login"});
            }

            // II is session state during login
            const cookII = utils.getCookie(req, config.COOKIE_NAME_II) || utils.getCookie(req, config.COOKIE_NAME_LI);

            // If II is outdated, clear cookies and force login
            if (!cookII || cookII.v != config.LOGIN_COOKIE_VERSION) {
                utils.clearCookie(res, config.COOKIE_NAME_II);
                utils.clearCookie(res, config.COOKIE_NAME_LI);
                return res.send({ state: "login"});
            }

            // Make sure token is still OK
            if (!await auth.verify(cookII.access_token)) {
                utils.clearCookie(res, config.COOKIE_NAME_II);
                utils.clearCookie(res, config.COOKIE_NAME_LI);
                return res.send({ state: "login" });
            }

            const resData = {};

            if (req.query?.info) {
                const info = await db('users').select('email', 'firstname', 'lastname').where({ user_id: cookII.user_id }).first();
                resData.email = info.email;
                resData.name  = `${info.firstname} ${info.lastname}`;
            }

            // TFA applied to login yet
            if (cookII.temp?.tfa?.enabled) {
                resData.state = 'tfa';
                return res.send(resData);
            }

            // App requires confirmation from user
            if (appinfo.login_callback) {
                if (!cookII.confirmed?.[appinfo.id]) {
                    resData.state = 'confirmapp';
                    resData.appname = appinfo.name;
                    return res.send(resData);
                }
            }

            // DONE
            return res.send({ state: 'loggedin', ...resData});
        } catch (e) {
            console.log(e);
            return res.status(500).send({ state: 'ServerError' });
        }
    });

    // Setup token
    app.post("/api/login/setup-token", async (req, res) => {
        try {
            if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

            // Allow null ID - will default to account app
            const appinfo = await utils.lookupAppInfo(req.body.id);
            if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

            const cookBI = utils.getCookie(req, config.COOKIE_NAME_BI);
            if (!cookBI) return res.status(400).send({ status: "BadRequest", field: config.COOKIE_NAME_BI });

            // Must have a cookLI
            const cookII = utils.getCookie(req, config.COOKIE_NAME_II) || utils.getCookie(req, config.COOKIE_NAME_LI);
            if (!cookII) return res.status(400).send({ status: "BadRequest", field: "cookLI" });

            for (let group of appinfo.groups || []) {
                if ((cookII.groups || []).indexOf(group) == -1) {
                    return res.status(403).send({ status: "AppForbidden", name: appinfo.name });
                }
            }

            if (appinfo.login_callback) {
                if (!cookII.confirmed?.[appinfo.id]) {
                    return res.status(400).send({ status: "AppNotConfirmed" });
                } else if (!req.query.challenge && !req.body.challenge) {
                    return res.status(400).send({ status: "BadRequest", field: "challenge" });
                } else {
                    delete cookII.temp;
                    await saveCookLI(req, res, cookII);
                    const url = await generateCodeExchange("PKCE-" + (req.query.challenge || req.body.challenge), { cookII, appinfo, ua: req.get('User-Agent') }, appinfo.login_callback, req.query.state || req.body.state);
                    return res.send({ status: "Success", redirect: url });
                }

            } else if (req.body.id === config.ADMIN_APP_ID) {
                delete cookII.temp;
                await saveCookLI(req, res, cookII);
                return res.send({ status: 'Success', redirect: '/admin' });

            } else if (req.body.id === config.ACCOUNT_APP_ID || !req.body.id) { // Empty ID defaults to account app
                delete cookII.temp;
                await saveCookLI(req, res, cookII);
                let redirect = req.query.cb || req.body.cb || '/account';
                if (!redirect.startsWith('/')) redirect = '/account';
                return res.send({ status: 'Success', redirect });

            } else {
                // web app, just generate exchange and redirect them back to the login callback
                if (!req.query.cb && !req.body.cb) {
                    res.status(400).send({ status: "BadRequest", field: "cb" });
                    return true;
                }
                delete cookII.temp;
                await saveCookLI(req, res, cookII);
                const url = await generateCodeExchange("APPSECRET-" + appinfo.secret, { cookII, appinfo, ua: req.get('User-Agent') }, req.query.cb || req.body.cb, req.query.state || req.body.state);
                return res.send({ status: 'Success', redirect: url });
            }
        } catch (e) {
            console.log(e);
            return res.status(500).send();
        }
    });

    // Enter credentials
    app.post("/api/login/enter-credentials", async (req, res) => {
        try {
            // Required params
            if (!req.body.email)     return res.status(400).send({ status: "BadRequest", field: "email" });
            if (!req.body.password)  return res.status(400).send({ status: "BadRequest", field: "password" });

            // Validate recaptcha
            if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

            // Validate app - allow null ID which will default to account app
            const appinfo = await utils.lookupAppInfo(req.body.id);
            if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

            // doLogin sets the cookies necessary for the status route
            const { loginResponse, cookBI, cookII } = await doLogin(req, res, { email: req.body.email, password: req.body.password });

            // Login Failed
            if (loginResponse.status != 'Success') {
                if (loginResponse.status === 'NotFound') {
                    return res.status(401).send({ status: 'NotFound' });
                } else {
                    return res.status(401).send({ status: 'Unauthorized' });
                }
                // Login Succeeded
            } else {
                await saveCookLI(req, res, cookII);
                return res.send({ status: 'Success' });
            }
        } catch (e) {
            logger.error(e);
            return res.status(500).send({status: 'ServerError'});
        }
    });

    // Enter TFA
    app.post("/api/login/enter-tfa", async (req, res) => {
        try {
            if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

            // Allow null ID - will default to account app
            const appinfo = await utils.lookupAppInfo(req.body.id);
            if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

            const cookBI = utils.getCookie(req, config.COOKIE_NAME_BI);
            if (!cookBI) return res.status(400).send({ status: "BadRequest", field: config.COOKIE_NAME_BI });

            const cookII = utils.getCookie(req, config.COOKIE_NAME_II);
            if (!cookII) return res.status(400).send({ status: "BadRequest", field: config.COOKIE_NAME_II });

            if (req.body.tfa === 'goback') {
                await auth.logout({ session: cookBI.session });
                utils.clearCookie(res, config.COOKIE_NAME_LI);
                utils.clearCookie(res, config.COOKIE_NAME_II);
                return res.status(200).send({ status: "LoggedOut" });
            }

            // no tfa needed!
            if (!cookII.temp?.tfa.secret) return res.send();

            if (!twofactor.verifyToken(cookII.temp?.tfa.secret, req.body.tfa)) {
                console.log("token failed to validate", cookII.temp?.tfa.secret, req.body.tfa);
                return res.status(400).send({ status: "BadToken" });
            }

            utils.sendEmailAlert({
                id: 'login-success-tfa',
                use_handlebars: true,
                user_id: cookII.user_id,
                location: cookII.temp.location
            });
            delete(cookII.temp.tfa);
            saveCookLI(req, res, cookII);
            return res.send();
        } catch (e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    // Confirm app
    app.post("/api/login/confirm-app", async (req, res) => {
        try {
            if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

            // Allow null ID - will default to account app
            const appinfo = await utils.lookupAppInfo(req.body.id);
            if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

            const cookBI = utils.getCookie(req, config.COOKIE_NAME_BI);
            const cookII = utils.getCookie(req, config.COOKIE_NAME_II) || utils.getCookie(req, config.COOKIE_NAME_LI); // Could already be logged in, just approving different app

            if (!cookBI) return res.status(400).send({ status: "BadRequest", field: config.COOKIE_NAME_BI });
            if (!cookII) return res.status(400).send({ status: "BadRequest", field: config.COOKIE_NAME_II });

            if (!appinfo.login_callback) return res.status(400).send({ status: "AppRequestNoConfirm" });

            // mobile/desktop app, we need to confirm the user is allowed to connect the app
            if (req.body.confirmapp_result === 'confirmed') {
                cookII.confirmed = cookII.confirmed || {};
                cookII.confirmed[appinfo.id] = true;
                await saveCookLI(req, res, cookII);
                return res.send({ status: "Success" });

            } else {
                delete cookII.confirmed?.[appinfo.id];
                await saveCookLI(req, res, cookII);

                let url = appinfo.login_callback;
                if (url.indexOf("?") == -1) {
                    url += "?error=access_denied";
                } else {
                    url += "&error=access_denied";
                }
                return res.send({ status: "Canceled", redirect: url });
            }
        } catch(e) {
            logger.error(e);
            return res.status(500).send({ status: "ServerError" });
        }
    });

    // Token endpoint
    app.get("/api/login/token", async (req, res) => {
        if (!req.query.code)     return res.status(400).send("Bad Request (missing code)");
        if (!req.query.verifier && !req.query.secret) return res.status(400).send("Bad Request (missing verifier/secret)");
        await ssotoken(req, res, req.query.code, req.query.verifier, req.query.secret);
    });

    /**
     * SSO token exchange
     */
    async function ssotoken(req, res, code, verifier, client_secret) {
        try {
            const result = await getCodeExchange(code, { ...(client_secret && { client_secret }), ...(!client_secret && { verifier }) });
            if (result && result.cookII && result.appinfo) {
                let { cookII, appinfo, ua } = result;

                if (appinfo.login_callback) {
                    const loginResponse = await auth.login({ session: cookII.session }, ua, appinfo.id, appinfo.name, requestIp.getClientIp(req), {
                        token: cookII.access_token,
                        session: cookII.session,
                    });
                    if (loginResponse.status != 'Success') {
                        cookII = undefined;
                    } else {
                        cookII.user_id      = loginResponse.user_id;
                        cookII.groups       = loginResponse.groups;
                        cookII.access_token = loginResponse.access_token;
                        cookII.logout_token = loginResponse.logout_token;
                    }
                }

                if (cookII) {
                    cookII = { ...cookII };
                    delete(cookII.session);
                    if (oidcEnabled && appinfo.oidc) {
                        // Generate OIDC ID token
                        const userInfo = await db('users').select('email', 'firstname', 'lastname').where({ user_id: cookII.user_id }).first();
                        
                        const idTokenPayload = {
                            iss: config.HOST,
                            sub: cookII.user_id.toString(),
                            aud: appinfo.id,
                            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
                            iat: Math.floor(Date.now() / 1000),
                            email: userInfo.email,
                            name: `${userInfo.firstname} ${userInfo.lastname}`.trim(),
                            given_name: userInfo.firstname,
                            family_name: userInfo.lastname
                        };

                        const idToken = jwk.sign(idTokenPayload, oidcPrivateKey, { algorithm: 'RS256' });

                        return res.status(200).send({
                            access_token: cookII.access_token,
                            token_type: 'Bearer',
                            expires_in: 3600,
                            id_token: idToken,
                            scope: 'openid email profile'
                        });
                    } else {
                        return res.status(200).send(cookII);
                    }
                }
            }
        } catch (e) {
            logger.error(e);
        }
        return res.status(404).send("Not found");
    }

    if (oidcEnabled) {
        // OIDC token endpoint
        // This is used for OIDC clients to exchange the code for a token
        app.post("/api/oidc-token", async (req, res) => {
            if (!req.body.code) return res.status(400).send("Bad Request (missing code)");
            if (!req.body.client_secret && !req.body.verifier) return res.status(400).send("Bad Request (missing client_secret/verifier)");
            await ssotoken(req, res, req.body.code, req.body.verifier, req.body.client_secret);
        });

        app.get("/api/oidc-userinfo", async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).send({ error: 'invalid_token', error_description: 'Missing or invalid authorization header' });
                }

                const accessToken = authHeader.substring(7);
                const email = await auth.verify(accessToken);
                
                if (!email) {
                    return res.status(401).send({ error: 'invalid_token', error_description: 'Invalid access token' });
                }

                const userInfo = await db('users').select('user_id', 'email', 'firstname', 'lastname').where({ email }).first();
                
                if (!userInfo) {
                    return res.status(404).send({ error: 'user_not_found', error_description: 'User not found' });
                }

                return res.status(200).send({
                    sub: userInfo.user_id.toString(),
                    email: userInfo.email,
                    name: `${userInfo.firstname} ${userInfo.lastname}`.trim(),
                    given_name: userInfo.firstname,
                    family_name: userInfo.lastname,
                    email_verified: true
                });
            } catch (e) {
                logger.error(e);
                return res.status(500).send("Server Error");
            }
        });

        app.get("/api/.well-known/openid-configuration", async (req, res) => {
            return res.status(200).send({
                issuer: config.HOST,
                authorization_endpoint: config.HOST + "/login",
                end_session_endpoint: config.HOST + "/account",
                token_endpoint: config.HOST + "/api/oidc-token",
                jwks_uri: config.HOST + "/api/oidc-jwks",
                response_types_supported: ["code"],
                grant_types_supported: ["authorization_code"],
                code_challenge_methods_supported: ["S256"],
                token_endpoint_auth_methods_supported: ["client_secret_post"],
                id_token_signing_alg_values_supported: ["RS256"],
                subject_types_supported: ["public"],
                userinfo_endpoint: config.HOST + "/api/oidc-userinfo",

            });
        });

        app.get("/api/jwks", async (req, res) => {
            return res.status(200).send({
                keys: [jwk]
            });
        });
    } else {
        logger.info("OIDC is not enabled, skipping OIDC routes");
    }





    // Apple callback - disabled for now
    /*
    app.post("/api/login/acb", async (req, res) => {
        try {
            if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });
            if (!req.body.id_token) return res.status(400).send({ status: "BadRequest", field: "code" });
            if (!req.body.nonce) return res.status(400).send({ status: "BadRequest", field: "nonce" });

            const id_token = req.body.id_token;

            // Verify JWT
            const {
                sub,
            } = await auth.verifyAppleIdToken(id_token, 'com.roon.website.signin', req.body.nonce);

            const { accountServerResponse, cookII } = await doLogin(req, res, { association: { association_id: sub }});
            if (accountServerResponse.status === 'NotFound')     {
                return res.status(200).send({status: 'NotFound'});
            } else if (accountServerResponse.status != 'Success') {
                return res.status(200).send({status: accountServerResponse.status});
            } else {
                // Success
                await saveCookLI(req, res, cookII);
                return res.status(200).send({status: 'Success'});
            }
        } catch (e) {
            console.log(e);
            return res.status(500).send({status: 'ServerError'});
        }
    });
    */
}
