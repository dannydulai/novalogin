// XXX Need to migrate this code to use accounts6/utils.mjs - auth() middleware so that you can proxy these actions
// for a user as an admin
import pkceChallenge   from 'pkce-challenge'
import csrf            from 'csurf';
import axios           from "axios";

import * as auth       from "./auth.mjs";
import config          from "./config.js";
import knex            from './db.js';
import accountdb       from './accountdb.js';

import twofactor       from "node-2fa";
import QRCode          from 'qrcode';

import dayjs           from 'dayjs';
import relativeTime    from 'dayjs/plugin/relativeTime.js';
dayjs.extend(relativeTime)

import { getCookie, setCookie, clearCookie, lookupAppInfo, ACCOUNT_APP_ID } from "./utils.mjs";

export default function (app, logger) {

async function userAuthenticate(session, res) {
    if (!session) {
        res.status(401).send();
        return;
    }

    const email = await auth.verify(session.access_token);
    if (!email) {
        res.status(401).send();
        return;
    }

    return email;
}

// For all (see account6/utils.mjs)
// XXX recaptcha middleware
//
app.post("/api/tfa/add-prep", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

        const session = getCookie(req, "roonLI");
        const email = await userAuthenticate(session, res);
        if (!email) return;

        // XXX This call is way too heavy
        const accountinfo = (await axios.get(`${config.accountServerUrl}/accounts/5/webaccountinfo`, {
                                       params: {
                                           token: session.access_token,
                                           recaptcha: "SKIP",
                                       }
                                   })).data;

        if (accountinfo.status == "Success") {
            let secret;
            if (accountinfo.user.tfa?.enabled) {
                return res.status(400).send({ status: 'AlreadyEnabled' });
            } else {
                secret = twofactor.generateSecret({ name: "Roon", account: email }).secret;
            }

            res.send({
                secret,
                qr: await QRCode.toDataURL(`otpauth://totp/Roon:${encodeURIComponent(email)}?secret=${encodeURIComponent(secret)}&issuer=Roon`, { scale: 6 }),
            });

        } else {
            throw new Error("failed to get user info: " + JSON.stringify(accountinfo))
        }


    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
})

app.post("/api/tfa/add", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });
        if (!req.body.secret) return res.status(400).send({ status: "BadRequest", field: "secret" });

        const session = getCookie(req, "roonLI" );

        // XXX This call is way too heavy
        const accountinfo = (await axios.get(`${config.accountServerUrl}/accounts/5/webaccountinfo`, {
                                       params: {
                                           token: session.access_token,
                                           recaptcha: "SKIP",
                                       }
                                   })).data;

        if (accountinfo.status == "Success") {
            if (accountinfo.user.tfa?.enabled) {
                return res.status(400).send({status: 'AlreadyEnabled'});
            } else if (!twofactor.verifyToken(req.body.secret, req.body.token)) {
                const secret = twofactor.generateSecret({ name: "Roon", account: accountinfo.user.email }).secret;
                return res.send({
                    qr:        await QRCode.toDataURL(`otpauth://totp/Roon:${encodeURIComponent(accountinfo.user.email)}?secret=${encodeURIComponent(secret)}&issuer=Roon`, { scale: 6 }),
                    error:     "BadToken",
                });

            } else {
                await auth.saveTFA(session.userid, req.body.secret);
                return res.send({ status: 'Success' });
            }

        } else {
            throw new Error("failed to get user info: " + JSON.stringify(accountinfo))
        }

    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
})

app.post("/api/tfa/remove", async (req, res) => {
    try {
        if (!req.body.recaptcha) return res.status(400).send({ status: "BadRequest", field: "recaptcha" });
        if (!(await auth.validateRecaptcha(req.body.recaptcha))) return res.status(400).send({ status: "InvalidRecaptcha" });

        const session = getCookie(req, "roonLI" );
        const [user]  = await accountdb("users").where({ userid: session.userid });

        if (!user.tfa_enabled) {
            return res.send();
        } else if (!twofactor.verifyToken(user.tfa_secret, req.body.token)) {
            return res.status(400).send({status: "BadToken"});

        } else {
            await auth.saveTFA(session.userid, null);
            return res.send();
        }

    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
})

}
