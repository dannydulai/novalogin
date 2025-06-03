const axios           = require('axios');
const cookieEncrypter = require('cookie-encrypter');
const cookie          = require('cookie');
const cookie_parser   = require('cookie-parser');
const express         = require('express');

module.exports = function(options) {
    if (!options.app_id)        throw new Error('app_id is required');
    if (!options.app_secret)    throw new Error('app_secret is required');
    if (!options.cookie_secret) throw new Error('cookie_secret is required');
    if (!options.auth_url)      throw new Error('auth_url is required');

    // Required options
    const app_id           = options.app_id;
    const app_secret       = options.app_secret;
    const cookie_secret    = options.cookie_secret;
    const auth_url         = options.auth_url;

    // Optional
    const cookie_name      = options.cookie_name || 'novaLI';
    const verify_url       = options.verify_url  || (`${auth_url}/api/login/verify`);
    const token_url        = options.token_url   || (`${auth_url}/api/login/token`);
    const login_url        = options.login_url   || (`${auth_url}/login`);
    const logout_url       = options.logout_url  || (`${auth_url}/api/login/logout`);

    function getCookie(req, name, key) {
        let _cookie = null;
        try {
            const cookieValue = cookie.parse(req.headers.cookie || '');
            _cookie = JSON.parse(cookieEncrypter.decryptCookie(cookieValue[name], { key: key || cookie_secret }));
        } catch (e) {}
        return _cookie;
    }

    function decodeRoonLICookie(roonLICookie, key) {
        try {
            let r = JSON.parse(cookieEncrypter.decryptCookie(roonLICookie, { key: key || cookie_secret }));
            return r;
        } catch (e) {}
        return null;
    }

    function setCookie(res, name, value, key) {
        const opts = {
            path: '/',
            maxAge: 10 * 365 * 24 * 60 * 60, // Express uses seconds, not milliseconds
        };
        const signedValue = cookieEncrypter.encryptCookie(JSON.stringify(value), { key: key || cookie_secret });
        res.cookie(name, signedValue, opts);
    }

    function clearCookie(res, name) {
        res.clearCookie(name, { path: '/' });
    }

    async function validate_token(token) {
        try {
            const r = (await axios.get(verify_url, {
                params: {
                    token,
                    secret: app_secret
                }
            })).data;
            return (r.status === "Success");
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async function hardCheck(req, res, next) {
        const reqCookie = getCookie(req, cookie_name);
        if (!reqCookie) return res.status(401).json({ isValid: false });

        const { access_token } = reqCookie;
        if (!access_token) return res.status(401).json({ isValid: false });

        const valid = await validate_token(access_token);
        if (!valid) return res.status(401).json({ isValid: false });

        req.auth = { isValid: true, credentials: reqCookie };
        next();
    }

    async function softCheck(hard_check_threshold = 1000 * 60 * 60) {
        return async (req, res, next) => {
            const reqCookie = getCookie(req, cookie_name);
            if (!reqCookie) return res.status(401).json({ isValid: false });

            const date_of_last_check = new Date(reqCookie.last_check);
            if (isNaN(date_of_last_check.getTime())) {
                return res.status(401).json({ isValid: false });
            } else {
                const time_since_last_check = Date.now() - date_of_last_check.getTime();
                if (time_since_last_check < 0) {
                    return res.status(401).json({ isValid: false });
                } else if (time_since_last_check > hard_check_threshold) {
                    const valid = await validate_token(reqCookie.access_token);
                    if (!valid) return res.status(401).json({ isValid: false });
                    setCookie(
                        res,
                        cookie_name,
                        { ...reqCookie, last_check: Date.now() }
                    );
                }
            }
            req.auth = { isValid: true, credentials: reqCookie };
            next();
        };
    }

    async function softTry(req, res, next) {
        const reqCookie = getCookie(req, cookie_name);
        if (!reqCookie) {
            clearCookie(res, cookie_name);
        }
        req.auth = { isValid: true, credentials: reqCookie };
        next();
    }

    async function softTryStandalone(rawcookie, key) {
        const cookie = decodeRoonLICookie(rawcookie, key);
        if (!cookie) return null;
        return cookie;
    }

    async function softCheckStandalone(rawcookie, key, _hard_check_threshold = null) {
        const cookie = decodeRoonLICookie(rawcookie, key);
        if (!cookie) return null;

        const hard_check_threshold = _hard_check_threshold || (1000 * 60 * 60);
        const date_of_last_check = new Date(cookie.last_check);
        if (isNaN(date_of_last_check.getTime())) {
            return null;
        } else {
            const time_since_last_check = Date.now() - date_of_last_check.getTime();
            if (time_since_last_check < 0) {
                return null;
            } else if (time_since_last_check > hard_check_threshold) {
                const valid = await validate_token(cookie.access_token);
                if (!valid) return null;
                return { ...cookie, last_check: Date.now() };
            }
        }
        return cookie;
    }

    async function hardCheckStandalone(rawcookie, key) {
        const cookie = decodeRoonLICookie(rawcookie, key);
        if (!cookie) return null;

        const { access_token } = cookie;
        if (!access_token) return null;

        const valid = await validate_token(access_token);
        if (!valid) return null;

        return cookie;
    }

    const router = express.Router();
    router.use(cookie_parser());

    router.get('/api/ligo', async (req, res) => {
        const { cb, state } = req.query;

        if (!cb) {
            return res.status(400).json({ status: "Callback required" });
        }

        let URL = `${login_url}?id=${options.app_id}&cb=${cb}`;
        if (state) {
            URL += `&state=${state}`;
        }

        res.redirect(URL);
    });

    router.get('/api/licb', async (req, res) => {
        try {
            const { code } = req.query;
            const response = await axios({
                method: 'GET',
                url: token_url + new URLSearchParams({
                    code,
                    secret: options.app_secret
                })
            });

            if (options.groups) {
                for (let group of options.groups) {
                    if (!response.data.groups.includes(group)) {
                        if (options.on_not_authorized) {
                            return await options.on_not_authorized(req, res, response.data);
                        } else {
                            return res.status(403).json({ status: "Not authorized" });
                        }
                    }
                }
            }

            setCookie(
                res,
                cookie_name,
                { ...response.data, last_check: Date.now() }
            );

            if (options.on_login) {
                await options.on_login(req, res, response.data);
            }

            res.status(200).send();
        } catch (e) {
            console.log(e);
            res.status(400).send();
        }
    });

    router.get('/api/logout', async (req, res) => {
        try {
            const logout_token = req.auth?.credentials?.logout_token;
            if (!logout_token) throw new Error('Missing logout token');

            const response = await axios({
                method: 'post',
                url: `${logout_url}?logout_token=${logout_token}`
            });
            if (response.status !== 200) throw new Error('Call to logout failed');
            clearCookie(res, cookie_name);

            if (options.on_logout) {
                await options.on_logout(req, res);
            }

            res.status(200).send();
        } catch (e) {
            console.log(e);
            res.status(500).send();
        }
    });

    return {
        router,
        middleware: {
            hardCheck,
            softCheck,
            softTry
        },
        standalone: {
            softTry: softTryStandalone,
            softCheck: softCheckStandalone,
            hardCheck: hardCheckStandalone
        }
    };
};

