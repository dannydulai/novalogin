import fs     from 'fs';
import path   from 'path';
import bcrypt from 'bcrypt';
import knex   from './accountdb.js';

const LoginResult = {
  Success: 'Success',
  NotFound: 'NotFound',
  Unauthorized: 'Unauthorized',
  Banned: 'Banned',
  NeedsToBeClaimed: 'NeedsToBeClaimed',
  UnexpectedError: 'UnexpectedError',
  InvalidRequest: 'InvalidRequest',
};

export async function AuthArc(token) {
  let userid = null;
  let groups = [];
  let machineids = [];
  let expiration = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 days

  try {
    const userResult = await knex.raw(`
      SELECT users.userid, users.groups
      FROM users
      INNER JOIN tokens USING (userid)
      WHERE users.isfraud IS NOT TRUE
        AND tokens.tokenid = :token
      LIMIT 1
    `, { token });

    const userRows = userResult.rows;
    if (userRows.length === 0) {
      return { status: LoginResult.Unauthorized };
    }

    userid = userRows[0].userid;
    groups = userRows[0].groups || [];

    const machineResult = await knex.raw(`
      SELECT machines.machineid
      FROM users
      INNER JOIN licenses USING (userid)
      INNER JOIN machines USING (licenseid)
      WHERE users.isfraud IS NOT TRUE
        AND users.userid = :userid
        AND licenses.closed IS NULL
    `, { userid });

    machineids = machineResult.rows.map(row => row.machineid);

    return {
      status: LoginResult.Success,
      userid,
      groups,
      machineids,
      expiration,
    };
  } catch (err) {
    console.error(err);
    return { status: LoginResult.UnexpectedError };
  }
}

export async function AuthApp(token, machineid) {
    let userid = null;
    let groups = [];
    let expiration = new Date();

    try {
        const userRes = await knex.raw(`
      SELECT users.userid, users.groups, users.isfraud
      FROM users, tokens
      WHERE tokens.tokenid = :token AND tokens.userid = users.userid
    `, { token });

        const userRow = userRes.rows[0];
        if (!userRow) return { status: LoginResult.Unauthorized };

        userid = userRow.userid;
        groups = userRow.groups || [];
        if (userRow.isfraud === true) return { status: LoginResult.NotFound };

        const licenseRes = await knex.raw(`
      SELECT licenses.status
      FROM machines
      LEFT JOIN licenses ON machines.licenseid = licenses.licenseid
      WHERE machines.userid = :userid
        AND machines.machineid = :machineid
        AND licenses.closed IS NULL
    `, { userid, machineid });

        if (licenseRes.rows.length > 0) {
            const status = licenseRes.rows[0].status;
            expiration = new Date(Date.now() + (status === 'Trial' ? 7 : 30) * 86400 * 1000);
            return { status: LoginResult.Success, userid, groups, expiration };
        }

        const serialRes = await knex.raw(`
      SELECT COUNT(*) as count
      FROM serialmachines
      LEFT JOIN serialauth ON
        serialmachines.vendorid = serialauth.vendorid AND
        serialmachines.serial = serialauth.serial AND
        serialmachines.machinetype = serialauth.machinetype
      WHERE serialmachines.userid = :userid AND serialmachines.machineid = :machineid
    `, { userid, machineid });

        if (serialRes.rows[0].count !== '0') {
            expiration = new Date(Date.now() + 30 * 86400 * 1000);
            return { status: LoginResult.Success, userid, groups, expiration };
        }

        return { status: LoginResult.Unauthorized };
    } catch (err) {
        console.error(err);
        return { status: LoginResult.UnexpectedError };
    }
}

export async function AuthRoon1(token, machineid) {
    let userid = null;
    let groups = [];
    let expiration = new Date();

    try {
        const userRes = await knex.raw(`
      SELECT users.userid, users.groups, users.isfraud
      FROM users, tokens
      WHERE tokens.tokenid = :token AND tokens.userid = users.userid
    `, { token });

        const userRow = userRes.rows[0];
        if (!userRow) return { status: LoginResult.Unauthorized };

        userid = userRow.userid;
        groups = userRow.groups || [];

        if (userRow.isfraud === true) return { status: LoginResult.NotFound };

        const licenseRes = await knex.raw(`
      SELECT licenses.status
      FROM machines
      LEFT JOIN licenses ON machines.licenseid = licenses.licenseid
      WHERE machines.userid = :userid
        AND machines.machineid = :machineid
        AND licenses.closed IS NULL
    `, { userid, machineid });

        if (licenseRes.rows.length > 0) {
            const status = licenseRes.rows[0].status;
            expiration = new Date(Date.now() + (status === 'Trial' ? 7 : 30) * 86400 * 1000);
            return { status: LoginResult.Success, userid, groups, expiration };
        }

        const serialRes = await knex.raw(`
      SELECT COUNT(*) AS count
      FROM serialmachines
      LEFT JOIN serialauth ON
        serialmachines.vendorid = serialauth.vendorid AND
        serialmachines.serial = serialauth.serial AND
        serialmachines.machinetype = serialauth.machinetype
      WHERE serialmachines.userid = :userid AND serialmachines.machineid = :machineid
    `, { userid, machineid });

        if (parseInt(serialRes.rows[0].count) !== 0) {
            expiration = new Date(Date.now() + 30 * 86400 * 1000);
            return { status: LoginResult.Success, userid, groups, expiration };
        }

        return { status: LoginResult.Unauthorized };
    } catch (err) {
        console.error(err);
        return { status: LoginResult.UnexpectedError };
    }
}

export async function AuthRoon2(token, machineid) {
    const expiration = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
    let userid = null;
    let groups = [];

    try {
        const userResult = await knex.raw(
            `SELECT users.userid, users.groups, users.isfraud
             FROM users, tokens
             WHERE tokens.tokenid = :token AND tokens.userid = users.userid`,
            { token }
        );

        if (userResult.rows.length === 0) {
            return { status: 'Unauthorized' };
        }

        const row = userResult.rows[0];
        userid = row.userid;
        groups = row.groups || [];

        if (row.isfraud === true) {
            return { status: 'NotFound' };
        }

        const licenseResult = await knex.raw(
            `SELECT licenses.status
             FROM machines
             LEFT JOIN licenses ON machines.licenseid = licenses.licenseid
             WHERE machines.userid = :userid
               AND machines.machineid = :machineid
               AND licenses.closed IS NULL`,
            { userid, machineid }
        );

        if (licenseResult.rows.length > 0) {
            return {
                status: 'Success',
                userid,
                groups,
                expiration
            };
        }

        return { status: 'Unauthorized' };
    } catch (e) {
        console.error(e);
        return { status: 'UnexpectedError' };
    }
}

export async function CheckToken(token) {
    try {
        const result = await knex.raw(
            `SELECT users.userid, users.groups, users.isfraud
             FROM tokens, users
             WHERE tokens.tokenid = :token AND tokens.userid = users.userid`,
            { token }
        );

        if (result.rows.length === 0) {
            return { status: 'NotFound' };
        }

        const row = result.rows[0];
        if (row.isfraud === true) {
            return { status: 'NotFound' };
        }

        return {
            status: 'Success',
            userid: row.userid,
            groups: row.groups || []
        };
    } catch (e) {
        console.error(e);
        return { status: 'UnexpectedError' };
    }
}

export async function CheckLogin(email, password) {
    try {
        const normalizedEmail = (email || '').toLowerCase();

        if (!isValidEmail(normalizedEmail)) return { status: 'NotFound' };
        if (!isValidPassword(password)) return { status: 'InvalidRequest' };

        const { emailKey: email_key, success } = genEmailKey(normalizedEmail);
        if (!success) return { status: 'NotFound' };

        const result = await knex.raw(
            `SELECT passwd, userid, groups, isfraud
             FROM users
             WHERE email_key = :email_key`,
            { email_key }
        );

        if (result.rows.length === 0) {
            return { status: 'NotFound' };
        }

        const row = result.rows[0];
        const dbpasswd = (row.passwd || '').trim();

        const isMatch = await bcrypt.compare(password, dbpasswd);
        if (!isMatch) return { status: 'Unauthorized' };

        if (row.isfraud === true) {
            return { status: 'NotFound' };
        }

        return {
            status: 'Success',
            userid: row.userid,
            groups: row.groups || []
        };
    } catch (e) {
        console.error(e);
        return { status: 'UnexpectedError' };
    }
}

let badEmailDomains = null;
export function genEmailKey(email) {
  if (badEmailDomains === null) {
      badEmailDomains = new Set(fs.readFileSync(path.join(path.dirname('.'), '/account6/bad-email-domains.txt'), 'utf-8').split('\n'));
  }

  let emailCleaned = email.trim().toLowerCase();

  if (emailCleaned.search(/[ \t\r\n\v]/) !== -1) return { success: false };

  const parts = emailCleaned.split('@');
  if (parts.length !== 2) return { success: false };
  let user = parts[0];
  let domain = parts[1];

  if (domain.indexOf('.') === -1) return { success: false };
  if (domain.indexOf('..') !== -1) return { success: false };
  if (badEmailDomains.has(domain)) return { success: false };

  user = user.replace(/\./g, '');
  if (['gmail.com', 'googlemail.com', 'google.com'].includes(domain)) {
    const plusIdx = user.indexOf('+');
    if (plusIdx !== -1) user = user.substring(0, plusIdx);
  } else if (domain === 'outlook.com') {
    const plusIdx = user.indexOf('+');
    if (plusIdx !== -1) user = user.substring(0, plusIdx);
  }

  if (user === '') return { success: false };

  const emailKey = user + '@' + domain;

  return {
    success: true,
    emailCleaned,
    emailKey,
  };
}

export function isValidEmail(email) {
  if (email.endsWith(".delete")) return false;
  if (email.endsWith(".fraud")) return false;
  if (email.length < 7) return false;
  if (email.length > 512) return false;
  if (email.indexOf("@") === -1) return false;
  if (email.search(/[ ;\\'"[\]{}()\r\n]/) !== -1) return false;
  if (email.charAt(0) === '-') return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;
  if (parts[0].length === 0) return false;
  if (parts[1].indexOf(".") === -1) return false;
  return true;
}

export function isValidPassword(password) {
  if (password.length < 4) return false;
  if (password.length > 512) return false;
  return true;
}

export function isValidBirthdate(birthdate) {
    if (!/^\d{8}$/.test(birthdate)) return false;

    const year = parseInt(birthdate.substring(0, 4), 10);
    const month = parseInt(birthdate.substring(4, 6), 10);
    const day = parseInt(birthdate.substring(6, 8), 10);

    if (
        isNaN(year) || isNaN(month) || isNaN(day) ||
        year < 1901 || year > (new Date().getFullYear() - 13) ||
        month < 0 || month > 12 || day < 0 || day > 31
    ) {
        return false;
    }

    if (day !== 0) {
        const dateStr = `${year.toString().padStart(4, '0')}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return false;
    }

    return true;
}

export function tryParseGuid(value) {
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return guidRegex.test(value) ? value : null;
}
