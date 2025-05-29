import * as auth       from "./auth.mjs";
import {pipeline}      from 'node:stream';
import {promisify}     from 'node:util';
import fetch           from 'node-fetch';
import url             from 'url';
import { ACCOUNT_APP_ID, setCookie, lookupAppInfo, getCookie, clearCookie }   from "./utils.mjs";
const streamPipeline = promisify(pipeline);

async function userAuthenticate(session, res) {
    if (!session) {
        res.status(303).redirect(`/login?id=${ACCOUNT_APP_ID}`);
        return false;
    }

    const email = await auth.verify(session.access_token);
    if (!email) {
        res.status(303).redirect(`/login?id=${ACCOUNT_APP_ID}`);
        return false;
    }

    return email;
}

export default function(app, logger) {
    // LOGOUT uses /logout as defined in login.mjs
    // LOGIN Callback for account page
    // XXX Move logout routes to account 6 api routes
    app.post("/api/account/logout", async (req, res) => {
        try {
            const roonLI = getCookie(req, "roonLI");
            if (roonLI && roonLI.logout_token)
                await auth.logout({ logout_token: roonLI.logout_token });
            clearCookie(res, "roonLI");
            clearCookie(res, "roonII");
            return res.status(200).send();
        } catch (e) {
            return res.status(500).send();
        }
    })

    app.post("/api/account/session", async (req, res) => {
        try {
            const session = getCookie(req, "roonLI" );
            if (!await userAuthenticate(session, res)) return;

            if (req.body.logout_session)
                await auth.logout({ session: req.body.logout_session });

            if (req.body.logout_token)
                await auth.logout({ logout_token: req.body.logout_token });

            return res.status(200).send();
        } catch (e) {
            logger.error(e);
            return res.status(500).send("Server Error");
        }
    })

    // XXX Move these to account 6 api routes
    // XXX DELETE PAYMENT METHOD
    // XXX EDIT ACCOUNT INFO
}
