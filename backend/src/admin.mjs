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

app.post("/api/admin/users", async (req, res) => {
    try {
        const session = getCookie(req, config.COOKIE_NAME_LI);
        if (!await userAuthenticate(session, res)) return;
        if (!await userAuthorize(session, res)) return;

        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = { limit, offset };

        if (search) {
            whereClause = `WHERE email ILIKE :search OR firstname ILIKE :search OR lastname ILIKE :search`;
            params.search = `%${search}%`;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        const countResult = await db.raw(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get users
        const usersQuery = `
            SELECT user_id, email, firstname, lastname, groups, created, updated, tfa_enabled
            FROM users 
            ${whereClause}
            ORDER BY created DESC 
            LIMIT :limit OFFSET :offset
        `;
        const usersResult = await db.raw(usersQuery, params);

        return res.send({
            users: usersResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
})

app.post("/api/admin/users/update", async (req, res) => {
    try {
        const session = getCookie(req, config.COOKIE_NAME_LI);
        if (!await userAuthenticate(session, res)) return;
        if (!await userAuthorize(session, res)) return;

        const { user_id, email, firstname, lastname, groups } = req.body;

        if (!user_id) {
            return res.status(400).send("User ID is required");
        }

        // Verify groups is an array
        if (groups && !Array.isArray(groups)) {
            return res.status(400).send("Invalid groups");
        }

        // Build update query dynamically
        const updates = [];
        const params = { user_id };

        if (email !== undefined) {
            updates.push('email = :email');
            params.email = email;
        }
        if (firstname !== undefined) {
            updates.push('firstname = :firstname');
            params.firstname = firstname;
        }
        if (lastname !== undefined) {
            updates.push('lastname = :lastname');
            params.lastname = lastname;
        }
        if (groups !== undefined) {
            updates.push('groups = :groups');
            params.groups = groups;
        }

        if (updates.length === 0) {
            return res.status(400).send("No fields to update");
        }

        updates.push('updated = NOW()');

        const query = `UPDATE users SET ${updates.join(', ')} WHERE user_id = :user_id`;
        await db.raw(query, params);

        return res.send({ status: 'Success' });
    } catch (e) {
        logger.error(e);
        return res.status(500).send("Server Error");
    }
})

}
