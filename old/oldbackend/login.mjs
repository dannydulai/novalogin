import pkceChallenge   from 'pkce-challenge';
import axios           from "axios";
import requestIp       from 'request-ip';

import * as auth       from "./auth.mjs";
import knex            from './db.js';
import accountdb       from './accountdb.js';
import { verifyAppleIdToken, getCookie, setCookie, clearCookie, lookupAppInfo, ACCOUNT_APP_ID, ADMIN_APP_ID, LOGIN_COOKIE_VERSION } from "./utils.mjs";

import {OAuth2Client}  from 'google-auth-library';
import twofactor       from "node-2fa";
// import jwt             from 'jsonwebtoken';
// import fs              from 'fs';
// import rsaPemToJwk     from 'rsa-pem-to-jwk';
// import jwt_decode      from "jwt-decode";


// import { OIDCUserInfo } from './account6/utils.mjs';

const googleClient             = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// const OIDCpublicKey  = fs.readFileSync("/run/secrets/login_jwt_public_key.pem", "utf8");
// const OIDCPrivateKey = fs.readFileSync("/run/secrets/login_jwt_private_key.pem", "utf8");
// const jwk            = rsaPemToJwk(OIDCpublicKey, { use: 'sig' }, 'public');


export default function (app, logger) {

async function sendEmailAlert(opts) {
    try {
        await axios.post('https://commsbridge.roonlabs.net/e/trigger', opts);
    } catch (e) {
        logger.error(e);
    }
}

async function generateCodeExchange(challenge, exchangeInfo, url, state) {
    try {
        const code = (await knex.raw(`INSERT INTO codes ( challenge, value ) VALUES ( :challenge, :value ) RETURNING code`, { challenge, value: JSON.stringify(exchangeInfo) })).rows[0].code;

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

async function getCodeExchange(code, opts) {
    try {
        if (opts.verifier)
            return JSON.parse((await knex.raw(`DELETE FROM codes WHERE code = :code AND challenge = :challenge RETURNING value`, { code, challenge: "PKCE-" + pkceChallenge.generateChallenge(opts.verifier) })).rows[0].value);
        else
            return JSON.parse((await knex.raw(`DELETE FROM codes WHERE code = :code AND challenge = :challenge RETURNING value`, { code, challenge: "APPSECRET-" + opts.client_secret })).rows[0].value);
    } catch (e) {
        logger.error(e)
        return null;
    }
}


async function doLogin(req, res, authinfo) {
    const loginappinfo = await lookupAppInfo(ACCOUNT_APP_ID);
    const cookBI = getCookie(req, config.cookieNameBI);

    // Let's check if the user provided valid credentials, and then save the login session cookie.
    const accountServerResponse = await auth.login(cookBI, req.get('User-Agent'), loginappinfo.id, loginappinfo.name, requestIp.getClientIp(req), authinfo);

    if (accountServerResponse.status != 'Success') return { accountServerResponse };

    const cookII = { v:            LOGIN_COOKIE_VERSION,
        userid:       accountServerResponse.userid,
        groups:       accountServerResponse.groups,
        access_token: accountServerResponse.access_token,
        logout_token: accountServerResponse.logout_token,
        session:      accountServerResponse.session,
        temp: {
            id:        req.query.id        || req.body.id,
            cb:        req.query.cb        || req.body.cb,
            challenge: req.query.challenge || req.body.challenge,
            state:     req.query.state     || req.body.state,
            email:     req.query.email     || req.body.email,
            location:  accountServerResponse.location,
            tfa:       accountServerResponse.tfa,
        },
    };
    setCookie(res, config.cookieNameBI, { v: LOGIN_COOKIE_VERSION, session: accountServerResponse.session });
    if (!cookII.temp.tfa.enabled) {
        sendEmailAlert({
            comm_id: 'd79914f2-7a25-41f6-bc17-6cf978e3456a',
            use_handlebars: true,
            user_id:  cookII.userid,
            location: cookII.temp.location
        })
    }
    return { accountServerResponse, cookBI, cookII };
}

async function saveCookLI(_req, res, cookII) {
    if (cookII.temp) {
        setCookie(res, config.cookieNameII, cookII, 'lax'); // Needs to be lax for navigations purposes
        clearCookie(res, config.cookieNameLI)
    } else {
        setCookie(res, config.cookieNameLI, cookII, 'lax'); // Needs to be lax for navigations purposes
        clearCookie(res, config.cookieNameII)
    }
}

// logout_token? : logout_token from the login procedure
app.post("/api/logout", async (req, res) => {
    try {
        if (req.query.logout_token || req.body.logout_token) {
            await auth.logout({ logout_token: req.query.logout_token || req.body.logout_token });
            clearCookie(res, config.cookieNameLI);
            clearCookie(res, config.cookieNameII);
            return res.send();
        } else {
            const cookLI = getCookie(req, config.cookieNameLI);
            if (cookLI && cookLI.logout_token)
                await auth.logout({ logout_token: cookLI.logout_token });
            clearCookie(res, config.cookieNameLI);
            clearCookie(res, config.cookieNameII);
            return res.send();
        }
    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
});

// logout_token? : logout_token from the login procedure
//
// DO NOT USE COOKIES IN THIS FUNCTION
app.get("/api/logout", async (req, res) => {
    try {
        if (!req.query.logout_token) return res.status(400).send({ status: "BadRequest", field: "logout_token" });
        await auth.logout({ logout_token: req.query.logout_token });
        return res.send();

    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
});


app.post("/api/acb", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });
        if (!req.body.id_token) return res.status(400).send({ status: "BadRequest", field: "code" });
        if (!req.body.nonce) return res.status(400).send({ status: "BadRequest", field: "nonce" });

        const id_token = req.body.id_token;

        // Verify JWT
        const {
            sub,
            // email,
            // email_verified,
        } = await verifyAppleIdToken(id_token, 'com.roon.website.signin', req.body.nonce);

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

app.post("/api/gcb", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

        if (!req.body.id) return res.status(400).send({ status: "BadRequest", field: "id" });
        const appinfo = await lookupAppInfo(req.body.id);
        if (!appinfo) return res.status(400).send({ status: "InvalidApp" });


        const ticket = await googleClient.verifyIdToken({
            idToken: req.body.id_token,
            audience: config.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, sub } = payload;

        if (!email) return res.status(400).send({ status: "InvalidEmail" });
        if (!sub)   return res.status(400).send({ status: "BadRequest" });

        const { accountServerResponse, cookII } = await doLogin(req, res, { googleEmail: email, googleId: sub });

        if (accountServerResponse.status === 'NotFound') return res.status(400).send({ status: "NotFound" });
        if (accountServerResponse.status != 'Success')   return res.status(400).send({ status: "ServerError" });

        await saveCookLI(req, res, cookII);
        return res.status(200).send();
    } catch (e) {
        logger.error(e);
        return res.status(500).send({status: "ServerError"});
    }
});

app.post("/api/login/status", async (req, res) => {
    try {
        const appinfo = await lookupAppInfo(req.body.id);
        if (!appinfo) return res.status(400).send("Bad Request (invalid id)");

        // BI is the browser identity stuff -- is so we can identify browsers that have logged in before
        const cookBI = getCookie(req, config.cookieNameBI);

        // If no BI or BI is outdated, clear cookies and force login
        if (!cookBI || cookBI.v != LOGIN_COOKIE_VERSION) {
            clearCookie(res, config.cookieNameBI);
            clearCookie(res, config.cookieNameII);
            clearCookie(res, config.cookieNameLI);
            return res.send({ state: "login"})
        }

        // II is session state during login
        const cookII = getCookie(req, config.cookieNameII) || getCookie(req, config.cookieNameLI);

        // If II is outdated, clear cookies and force login
        if (!cookII || cookII.v != LOGIN_COOKIE_VERSION) {
            clearCookie(res, config.cookieNameII);
            clearCookie(res, config.cookieNameLI);
            return res.send({ state: "login"})
        }

        // Make sure token is still OK
        if (!await auth.verify(cookII.access_token)) {
            clearCookie(res, config.cookieNameII);
            clearCookie(res, config.cookieNameLI);
            return res.send({ state: "login" })
        }

        const resData = {};

        if (req.query?.info) {
            const info = await accountdb('users').select('email', 'firstname', 'lastname').where({ userid: cookII.userid }).first();
            resData.email = info.email;
            resData.name  = `${info.firstname} ${info.lastname}`
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

        // App requires profile
        if (!appinfo.skipprofile) {
            const profiles = await auth.getProfiles(cookII.userid);

            if (profiles.length == 1) {
                cookII.profileid = profiles[0].id
                await saveCookLI(req, res, cookII)
            } else {
                // Profile not picked yet
                if (!cookII.profileid || !profiles.find(p => p.id === cookII.profileid)) {
                    return res.send({ state: 'profile', profiles, ...resData });
                }
            }
        }

        // DONE
        return res.send({ state: 'loggedin', ...resData});
    } catch (e) {
        console.log(e);
        return res.status(500).send({ state: 'ServerError' });
    }
});

app.post("/api/login/setup-token", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

        if (!req.body.id) return res.status(400).send({ status: "BadRequest", field: "id" });
        const appinfo = await lookupAppInfo(req.body.id);
        if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

        const cookBI = getCookie(req, config.cookieNameBI);
        if (!cookBI) return res.status(400).send({ status: "BadRequest", field: config.cookieNameBI });

        // Must have a cookLI
        const cookII = getCookie(req, config.cookieNameII) || getCookie(req, config.cookieNameLI);
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

        } else if (req.body.id === ADMIN_APP_ID) {
            delete cookII.temp;
            await saveCookLI(req, res, cookII);
            return res.send({ status: 'Success', redirect: '/admin' });

        } else if (req.body.id === ACCOUNT_APP_ID) {
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
})

app.post("/api/login/enter-credentials", async (req, res) => {
    try {
        // Required params
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!req.body.id)        return res.status(400).send({ status: "BadRequest", field: "id" });
        if (!req.body.email)     return res.status(400).send({ status: "BadRequest", field: "email" });
        if (!req.body.password)  return res.status(400).send({ status: "BadRequest", field: "password" });

        // Validate recaptcha
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

        // Validate app
        const appinfo = await lookupAppInfo(req.body.id);
        if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

        // doLogin sets the cookies necessary for the status route
        const { accountServerResponse, cookBI, cookII } = await doLogin(req, res, { email: req.body.email, password: req.body.password });

        // Login Failed
        if (accountServerResponse.status != 'Success') {
            if (accountServerResponse.status === 'NotFound') {
                return res.status(401).send({ status: 'NotFound' });
            } else {
                return res.status(401).send({ status: 'Unauthorized' });
            }
            // Login Succeeded
        } else {
            await saveCookLI(req, res, cookII);
            return res.send({ status: 'Success' })
        }
    } catch (e) {
        logger.error(e);
        return res.status(500).send({status: 'ServerError'});
    }
});

app.post("/api/login/enter-tfa", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

        if (!req.body.id) return res.status(400).send({ status: "BadRequest", field: "id" });
        const appinfo = await lookupAppInfo(req.body.id);
        if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

        const cookBI = getCookie(req, config.cookieNameBI);
        if (!cookBI) return res.status(400).send({ status: "BadRequest", field: config.cookieNameBI });

        const cookII = getCookie(req, config.cookieNameII);
        if (!cookII) return res.status(400).send({ status: "BadRequest", field: config.cookieNameII });

        if (req.body.tfa === 'goback') {
            await auth.logout({ session: cookBI.session });
            clearCookie(res, config.cookieNameLI)
            clearCookie(res, config.cookieNameII)
            return res.status(200).send({ status: "LoggedOut" });
        }

        // no tfa needed!
        if (!cookII.temp?.tfa.secret) return res.send();

        if (!twofactor.verifyToken(cookII.temp?.tfa.secret, req.body.tfa)) {
            console.log("token failed to validate", cookII.temp?.tfa.secret, req.body.tfa)
            return res.status(400).send({ status: "BadToken" });
        }

        sendEmailAlert({
            comm_id: 'd79914f2-7a25-41f6-bc17-6cf978e3456a',
            use_handlebars: true,
            user_id:  cookII.userid,
            location: cookII.temp.location
        })
        delete(cookII.temp.tfa)
        saveCookLI(req, res, cookII);
        return res.send();
    } catch (e) {
        logger.error(e);
        return res.status(500).send({ status: "ServerError" });
    }
});

app.post("/api/login/confirm-app", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

        if (!req.body.id) return res.status(400).send({ status: "BadRequest", field: "id" });
        const appinfo = await lookupAppInfo(req.body.id);
        if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

        const cookBI = getCookie(req, config.cookieNameBI);
        const cookII = getCookie(req, config.cookieNameII) || getCookie(req, config.cookieNameLI); // Could already be logged in, just approving different app

        if (!cookBI) return res.status(400).send({ status: "BadRequest", field: config.cookieNameBI });
        if (!cookII) return res.status(400).send({ status: "BadRequest", field: config.cookieNameII });

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

app.post("/api/login/pick-profile", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

        if (!req.body.id) return res.status(400).send({ status: "BadRequest", field: "id" });
        const appinfo = await lookupAppInfo(req.body.id);
        if (!appinfo) return res.status(400).send({ status: "InvalidApp" });

        const cookBI = getCookie(req, config.cookieNameBI);
        if (!cookBI) return res.status(400).send({ status: "BadRequest", field: config.cookieNameBI });

        const cookII = getCookie(req, config.cookieNameII) || getCookie(req, config.cookieNameLI);
        if (!cookII) return res.status(400).send({ status: "BadRequest", field: config.cookieNameII });

        if (!req.body.profileid) return res.status(400).send({ status: "BadRequest", field: "profileid" });


        // "goback"
        if (req.body.profileid == "goback") {
            await auth.logout({ session: cookBI.session });
            clearCookie(res, config.cookieNameLI)
            clearCookie(res, config.cookieNameII)
            return res.status(200).send({ status: "LoggedOut" });
        }

        let good = false;
        const profiles = await auth.getProfiles(cookII.user_id);
        if (Array.isArray(profiles)) {
            for (const profile of profiles) {
                if (profile.id == req.body.profileid) {
                    cookII.profileid = profile.id
                    await saveCookLI(req, res, cookII)
                    return res.send({ status: "Success" });
                }
            }
            return res.status(400).send({ status: "InvalidProfile" });

        } else {
            throw "profiles is not an array for user_id " + cookII.user_id;
        }

    } catch(e) {
        logger.error(e);
        return res.status(500).send({ status: "ServerError" });
    }

});

//
// code     : code to exchange for login info
// verifier : PKCE verifier
// secret   : app secret
//
// DO NOT USE COOKIES IN THIS FUNCTION
async function ssotoken (req, res, code, verifier, client_secret) {
    try {
        const result = await getCodeExchange(code, { ...(client_secret && { client_secret }), ...(!client_secret && { verifier }) });
        if (result && result.cookII && result.appinfo) {
            let { cookII, appinfo, ua } = result;

            if (appinfo.login_callback) {
                const accountServerResponse = await auth.login({ session: cookII.session }, ua, appinfo.id, appinfo.name, requestIp.getClientIp(req), {
                    token: cookII.access_token,
                    session: cookII.session,
                });
                if (accountServerResponse.status != 'Success') {
                    cookII = undefined;
                } else {
                    cookII.userid =       accountServerResponse.userid;
                    cookII.groups =       accountServerResponse.groups;
                    cookII.access_token = accountServerResponse.access_token;
                    cookII.logout_token = accountServerResponse.logout_token;
                }
            }

            if (cookII) {
                cookII = { ...cookII };
                delete(cookII.session);
                // if (appinfo.oidc) {
                    // const info  = await accountdb('users').select('email', 'firstname', 'lastname').where({ userid: cookII.userid }).first();
                    // const email = info.email;
                    // const name  = `${info.firstname} ${info.lastname}`
                    // return res.status(200).send({
                    //     access_token: cookII.access_token,
                    //     token_type: "Bearer",
                    //     expires_in: 3600 * 24, // 24 hours
                    //     id_token: jwt.sign({
                    //         sub: cookII.userid,
                    //         aud: appinfo.id,
                    //         email,
                    //         name,
                    //         iss: "https://account.roon.app",
                    //     }, OIDCPrivateKey, { algorithm: 'RS256', expiresIn: '1h' }),
                    // });
                // } else {
                    return res.status(200).send(cookII);
                // }
            }
        }
    } catch (e) {
        logger.error(e)
    }
    return res.status(404).send("Not found");
};
app.get("/api/token", async (req, res) => {
    if (!req.query.code)     return res.status(400).send("Bad Request (missing code)");
    if (!req.query.verifier && !req.query.secret) return res.status(400).send("Bad Request (missing verifier/secret)");
    await ssotoken(req, res, req.query.code, req.query.verifier, req.query.secret);
});
// app.post("/api/oidc-token", async (req, res) => {
//     if (!req.body.code)          return res.status(400).send("Bad Request (missing code)");
//     if (!req.body.client_secret) return res.status(400).send("Bad Request (missing secret)");
//     await ssotoken(req, res, req.body.code, null, req.body.client_secret); // PCKE not allowed for OIDC
// });
//
// app.get("/api/oidc-userinfo", async (req, res) => {
//     const authHeader = req.headers.authorization;
//     const authcode   = authHeader && authHeader.split(' ')[1];
//     if (!authcode) return res.status(401).send("Unauthorized");
//     try {
//         const userinfo = await OIDCUserInfo(authcode);
//         if (userinfo) {
//             return res.json({
//                 sub:            userinfo.userid,
//                 email:          userinfo.email,
//                 name:           `${userinfo.firstname} ${userinfo.lastname}`,
//                 email_verified: true,
//             });
//         } else {
//             return res.status(401).send("Unauthorized");
//         }
//     } catch (e) {
//         console.log(e);
//         return res.status(500).send("ServerError");
//     }
// });
//
// app.get("/api/.well-known/openid-configuration", async (req, res) => {
//     return res.send({
//         issuer: "https://account.roon.app",
//         authorization_endpoint: "https://account.roon.app/login",
//         end_session_endpoint: "https://account.roon.app/account",
//         token_endpoint: "https://account.roon.app/api/oidc-token",
//         jwks_uri: "https://account.roon.app/api/jwks",
//         response_types_supported: ["code"],
//         grant_types_supported: ["authorization_code"],
//         code_challenge_methods_supported: ["S256"],
//         token_endpoint_auth_methods_supported: ["client_secret_post"],
//         id_token_signing_alg_values_supported: ["RS256"],
//         subject_types_supported: ["public"],
//         userinfo_endpoint: "https://account.roon.app/api/oidc-userinfo",
//     });
// });
//
//
// app.get("/api/jwks", async (req, res) => {
//     return res.send({
//         keys: [jwk]
//     });
// });

}
