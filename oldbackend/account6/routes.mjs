import express   from 'express';
import axios     from 'axios';
import csrf      from 'csurf';
import url       from "url";
import requestIp from 'request-ip';

import { v4 as uuidv4 } from 'uuid';
import { getCookie, setCookie, LOGIN_COOKIE_VERSION } from "../utils.mjs";
import { webaccountinfo } from '../auth.mjs'
import {
    auth,
    recaptcha,
    connectToApple,
    connectToGoogle1,
    connectToGoogle2,
    getAssociatedAccounts,
    getWebUserInfo,
    getUserInfo,
    updateWebUserInfo,
    createUser,
    resetPassword1,
    resetPassword2,
    resetEmail1,
    resetEmail2,
    unassociate,
} from './utils.mjs'; // account6 utils
import db                from '../accountdb.js';

// Router
const router = express.Router();

function _USE(method, route, config, handler) {
    if (typeof config === 'function') {
        handler = config;
        config = {};
    }

    const m = [];
    if (config.auth === undefined || config.auth === true) m.push(auth(config))
    if (config.recaptcha) m.push(recaptcha)
    return router[method](route, ...m, handler);
}

function _POST(route, config, handler)   { return _USE('post', route, config, handler); }
function _PUT(route, config, handler)    { return _USE('put', route, config, handler); }
function _DELETE(route, config, handler) { return _USE('delete', route, config, handler); }

_POST('/prices', {auth: false}, async (req, res) => {
    try {
        const { secret } = req.body || req.query;
        if (secret && secret === '66cc47ad-500b-4061-826a-a45fdb576add') {
            // Used for internal tooling / programmatic access
            return res.send(pricingUtils.pricingTable);
        } else {
            // Used for user facing prices
            const cookLI = getCookie(req, config.cookieNameLI);
            if (cookLI) {
                req.ui = await getUserInfo(cookLI.access_token);
            } else {
                req.ui = { }; // Not logged in, so force geoip to get prices

                // XXX Remove this when ready to go live
                const istest = req.query?.istest || req.body?.istest;
                if (istest) {
                    const user_ip       = requestIp.getClientIp(req);
                    const country_iso   = (await axios(`http://geoip-api.roon.prd-roonlabs-1.prd.roonlabs.internal/geoip/1/lookup?ip=${user_ip}`)).data.country_iso;
                    const user_currency = pricingUtils.countryToCurrency(country_iso);
                    req.ui.currency     = user_currency;
                }
            }
            const prices = await pricingUtils.pricing(req);
            return res.send(prices);
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});


_POST('/reset-password', {auth: false}, async (req, res) => {
    try {
        const email    = req.query.email    || req.body.email;
        const code     = req.query.code     || req.body.code;
        const password = req.query.password || req.body.password;
        if (email) {
            const result = await resetPassword1(email);
            return res.json(result);
        } else if (password && code) {
            const result = await resetPassword2(code, password, requestIp.getClientIp(req));
            return res.json(result);
        } else {
            return res.json({status: 'InvalidRequest'});
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});

_POST('/reset-email', {auth: false}, async (req, res) => {
    try {
        const email    = req.query.email    || req.body.email;
        const code     = req.query.code     || req.body.code;
        if (email && code) {
            const result = await resetEmail2(email, code, requestIp.getClientIp(req));
            return res.json(result);
        } else if (email) {
            const result = await resetEmail1(email);
            return res.json(result);
        } else {
            return res.json({status: 'InvalidRequest'});
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});


_POST('/unassociate', async (req, res) => {
    try {
        await unassociate(req.ui.userid, req.body.association_id, req.body.association_type);
        return res.status(200).send();
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});

_POST('/connect-google-1', async (req, res) => {
    try {
        return res.json(await connectToGoogle1(req.ui));
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});

_POST('/connect-google-2', async (req, res) => {
    try {
        return res.json(await connectToGoogle2(req.ui, req.body.code));
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});

_POST('/connect-apple', async (req, res) => {
    try {
        if (!req.body.id_token) {
            return res.status(400).send();
        }
        if (!req.body.nonce) {
            return res.status(400).send();
        }
        await connectToApple(req.ui, req.body.id_token, req.body.nonce);
        return res.status(200).send();
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});

_POST('/createaccount', {auth: false, recaptcha: true}, async (req, res) => {
    try {
        const { status, roonLI } = await createUser(req, req.body);
        if (status !== 'Success') {
            return res.send({status});
        }

        const roonBI = {
            v:       LOGIN_COOKIE_VERSION,
            session: roonLI.session,
        }

        setCookie(res, config.cookieNameBI, roonBI);
        setCookie(res, config.cookieNameLI, roonLI);

        return res.status(200).send({status});
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});

// Update userinfo
_PUT('/webuserinfo', async (req, res) => {
    try {
        const {
            firstname,
            lastname,
            phone
        } = req.body;
        await updateWebUserInfo(req.ui, firstname, lastname, phone);
        return res.status(200).send();
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});

// Get userinfo
_POST('/webuserinfo', {adminRO: true}, async (req, res) => {
    try {
        const ui = await getWebUserInfo(req.ui.userid);
        return res.status(200).send({status: 'Success', user: ui });
    } catch (e) {
        console.log(e);
        return res.status(500).send();
    }
});

_POST('/webaccountinfo', {adminRO: true}, async (req, res) => {
    try {

        let [user, associatedAccounts] = await Promise.all([
            webaccountinfo(req[config.cookieNameLI].access_token, null, req.query.userid),
            getAssociatedAccounts(req.ui),
        ]);

        user.currentSession     = req[config.cookieNameLI].session;
        user.associatedAccounts = associatedAccounts;
        user                    = { ...user, ...referralStats };

        return res.status(200).send(user)
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

export default router;
