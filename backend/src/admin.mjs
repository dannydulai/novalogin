import 'dotenv/config';
import db from '../db.js';
import * as auth from './auth.mjs';
import config from './config.mjs';
import { getCookie, clearCookie } from './utils.mjs';

export default function(app, logger) {

async function userAuthenticate(session, res) {
    if (!session || !await auth.verify(session.access_token)) {
        res.status(401).send();
        return false;
    }
    return true;
}

async function userAuthorize(session, res) {
    if (!session || !((session.groups || []).includes("admin"))) {
        res.status(403).send("Forbidden");
        return false;
    }
    return true;
}

app.post("/api/admin/logout", async (req, res) => {
    const cookLI = getCookie(req, config.COOKIE_NAME_LI);
    if (cookLI && cookLI.logout_token)
        await auth.logout({ logout_token: cookLI.logout_token });
    clearCookie(res, config.COOKIE_NAME_LI);
    clearCookie(res, config.COOKIE_NAME_II);
    return res.send();
})

app.post("/api/admin/data", async (req, res) => {
    try {
        const session = getCookie(req, config.COOKIE_NAME_LI);
        if (!await userAuthenticate(session, res)) return;
        if (!await userAuthorize(session, res)) return;

        const rows = (await db.raw(`SELECT * FROM apps ORDER BY app_id`)).rows;
        return res.send(rows);
    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
})

app.post("/api/admin/submit", async (req, res) => {
    try {
        const cookie = getCookie(req, config.COOKIE_NAME_LI);
        if (!await userAuthenticate(cookie, res)) return;
        if (!await userAuthorize(cookie, res)) return;

        // verify groups is an array
        if (req.body.groups && !Array.isArray(req.body.groups)) return res.status(400).send("Invalid groups");

        if (req.body.add == "new") {
            await db.raw(`INSERT INTO apps (name, login_callback, groups) VALUES ( :name, :login_callback, :groups )`, {
                name:           req.body.name,
                login_callback: req.body.login_callback,
                groups:         req.body.groups || []
            });
        }

        if (req.body.save) {
            let opts = {}
            if (req.body.name) opts.name = req.body.name;
            if (req.body.login_callback != undefined) opts.login_callback = req.body.login_callback;
            if (req.body.groups) opts.groups = req.body.groups;
            await db.raw(`UPDATE apps SET ${Object.keys(opts).map(x => `${x} = :${x}`).join(', ')} WHERE app_id = :app_id `, {
                name:           req.body.name,
                login_callback: req.body.login_callback,
                app_id:         req.body.save,
                groups:         req.body.groups || []
            });
        }

        if (req.body.del)
            await db.raw(`DELETE FROM apps WHERE app_id = :app_id`, { app_id: req.body.del });

        return res.send();
    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
})

}
