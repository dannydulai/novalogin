import axios            from "axios";
import pino             from "pino";
import { UAParser }     from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt           from 'bcrypt';
import db               from '../db.js';
import config           from './config.mjs';
import {
    isValidEmail,
    isValidPassword,
    genEmailKey,
    getCookie
} from './utils.mjs';

const logger = pino({ name: "account" });

export async function saveTFA(user_id, secret) {
    try {
        throw "NotImplementedError";
        return (r.status == "Success");

    } catch (err) {
        logger.error(err, "save tfa request failed");
        return false;
    }
}

export async function verify(access_token) {
    try {
        const r = (await db.raw(`
            SELECT email FROM users LEFT JOIN token_info using(user_id) WHERE token_id = :access_token
        `,{access_token})).rows[0];
        return (r && r.email) ? r.email : false;
    } catch (err) {
        logger.error(err, "access token verification request failed");
        return false;
    }
}

export async function getLocation(ip) {
    let location = 'Unknown';
    if (config.GEOIP_SERVICE_URL) {
        try {
            const geoip = (await axios.get(config.GEOIP_SERVICE_URL, { params: { ip } })).data;
            if (!geoip.country) {
                location = 'Unknown';
            } else {
                if (geoip.state && geoip.state != geoip.country)
                    geoip.country = geoip.state + ", " + geoip.country;
                if (geoip.city)
                    geoip.country = geoip.city + ", " + geoip.country;
                location = geoip.country;
            }
        } catch {
            location = 'Unknown';
        }
    }
    return location;
}

export function getUAInfo(useragent) {
    let browser = 'Unknown';
    let os = 'Unknown';
    let platform = 'Unknown';
    try {
        const ua = UAParser(useragent);
        if (ua?.browser?.name) browser = ua.browser.name;
        if (ua?.os?.name) os = ua.os.name;
    } catch {
    }

    return { browser, os, platform };
}

async function _loginswitch(opts) {
    if (opts.email && opts.password) {
        return await loginEmailPassword(opts);
    } else if (opts.googleEmail && opts.googleId) {
        return await loginGoogle(opts);
    } else if (opts.association) {
        return await loginAssociation(opts);
    } else if (opts.token && opts.session) {
        return await loginToken(opts);
    } else {
        throw "Invalid login options";
    }
}

/** Checks user credentials and returns their user_Id or null if invalid */
export async function login(cookBI, useragent, app_id, app_name, ip, authinfo) {
    try {
        const { browser, os } = getUAInfo(useragent);

        const location = await getLocation(ip);

        const r = await _loginswitch({
            app_id,
            app_name,
            os,
            browser,
            ip,
            location,
            ...(cookBI?.session && { session: cookBI.session }),
            ...authinfo
        });

        if (r.status !== "Success") {
            return { ...r, location };
        }
        if (!r.user_id || !r.access_token || !r.logout_token) {
            logger.error(r, "Success returned for login, but did not return user_id, access_token, or logout_token");
            return { status: "UnexpectedError" };
        }

        return {...r, location};

    } catch (err) {
        logger.error(err, "Account check request failed");
        return { status: "UnexpectedError" };
    }
}

export async function logout(opts) {
    try {
        if (opts.logout_token) {
            await db.raw(`
                DELETE FROM tokens
                USING token_info
                WHERE token_info.token_id = tokens.token_id
                AND token_info.user_id = tokens.user_id
                AND token_info.logout_token = :logout_token
            `, { logout_token: opts.logout_token });
        }
        if (opts.session_token) {
            await db.raw(`
                DELETE FROM tokens
                USING token_info
                WHERE token_info.token_id = tokens.token_id
                AND token_info.user_id = tokens.user_id
                AND token_info.session_token = :session_token
            `, { session_token: opts.session_token });
        }
    } catch (err) {
        logger.error(err, "Account check request failed");
    }
}

/**
 * Verify user authentication from cookie
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object|null} User info if authenticated, null if not (and sends 401)
 */
export async function verifyAuthMiddleware(req, res, next) {
    try {
        const cookieData = getCookie(req, config.COOKIE_NAME_LI);
        if (!cookieData.user_id || !cookieData.access_token) {
            return res.status(401).send({ status: "Unauthorized", message: "Incomplete authentication data" });
        }
        
        // Verify the access token
        const email = await verify(cookieData.access_token);
        if (!email) {
            return res.status(401).send({ status: "Unauthorized", message: "Invalid access token" });
        }
        
        // Add auth info to request object
        req.auth = {
            user_id: cookieData.user_id,
            access_token: cookieData.access_token,
            email,
            session: cookieData.session
        };
        
        next();
    } catch (err) {
        logger.error(err, "Authentication middleware error");
        return res.status(500).send({ status: "ServerError" });
    }
}

export async function validateRecaptcha(
    recaptcha
) {
    try {
        if (!config.RECAPTCHA_SECRET) {
            console.warn("Recaptcha secret not set, skipping recaptcha validation");
            return true;
        }

        const res = await axios.post(`https://www.google.com/recaptcha/api/siteverify?response=${recaptcha}&secret=${config.RECAPTCHA_SECRET}`)

        const {
            action,
            score,
            hostname,
            success
        } = res.data;

        if (
            !Boolean(success)            ||
            !action                      ||
            !action.startsWith("login_") ||
            !score                       ||
            score < 0.5
        ) {
            logger.error(`Failed to verify recaptcha ${JSON.stringify(res.data)}`);
            return false;
        }

        return true;
    } catch(e) {
        logger.error(e, "Recaptcha validation failed");
        return false;
    }
}

// Login6 Port
async function loginEmailPassword({
  email,
  password, // if null, we're doing a passwordless login
  session,
  ip,
  location,
  app_id,
  app_name,
  os,
  browser,
  onSuccess
}) {
    let user_id        = null;
    const tfa         = {};

    session = session ?? uuidv4();
    email   = email.toLowerCase().trim();

    const txn = await db.transaction();
    try {
        if (!isValidEmail(email)) throw 'NotFound';
        if (password !== null && !isValidPassword(password)) {
            throw 'Unauthorized';
        }

        const { success, emailCleaned, emailKey } = genEmailKey(email);
        if (!success) throw 'NotFound';

        email = emailCleaned;

        const user = await txn('users')
            .select(
                'user_id',
                'password',
                'groups',
                'is_fraud',
                'email'
            )
            .where({ email_key: emailKey })
            .first();

        if (!user) throw 'NotFound';
        user_id = user.user_id;
        const dbPasswd = user.password.trim();

        if (password !== null && !await bcrypt.compare(password, dbPasswd)) {
            throw 'Unauthorized';
        }
        if (user.is_fraud) throw 'NotFound';
        email = user.email.trim();

        const result = await _login({
            txn,
            email,
            groups: user.groups,
            session,
            user_id,
            ip,
            location,
            app_id,
            app_name,
            os,
            browser,
            tfa,
            onSuccess
        });


        await txn.commit();

        return result;

    } catch (error) {
        await txn.rollback();
        const errorMap = {
            NotFound:         'NotFound',
            Unauthorized:     'Unauthorized',
            NeedsToBeClaimed: 'NeedsToBeClaimed',
        };
        if (errorMap[error]) {
            return { status: errorMap[error] };
        } else {
            logger.error(error);
            return { status: 'UnexpectedError' };
        }
    }
}

async function loginGoogle({
  googleEmail,
  googleId,
  session,
  ip,
  location,
  app_id,
  app_name,
  os,
  browser
}) {
    try {
        // Try login via association
        let result = await loginAssociation({
            association: { association_id: googleId },
            session,
            ip,
            location,
            app_id,
            app_name,
            os,
            browser
        });

        if (result.status === 'Success')  return result;

        // Only continue if error is that no association exists
        if (result.status !== 'NeedsAssociation') return result;

        result = await loginEmailPassword({
            email: googleEmail,
            password: null,
            session,
            ip,
            location,
            app_id,
            app_name,
            os,
            browser,
            onSuccess: async (txn, user_id) => {
                // Create association for account that has this email address
                // IF and only IF no association exists for this google account
                const existing = await txn('associations')
                    .where({association_type: 'google', association_id: googleId})
                    .whereNot({user_id})
                    .first();

                // Someone else already associated with this account.
                if (existing) throw 'AlreadyAssociated';

                await txn('associations')
                    .insert({
                        association_type:  'google',
                        association_id:    googleId,
                        user_id:           user_id,
                        updated:           txn.raw('CURRENT_TIMESTAMP'), // always update this field
                        data: {
                            email: googleEmail
                        }
                    })
                    .onConflict(['user_id', 'association_type', 'association_id'])
                    .merge();
            }
        });
        return result;
    } catch (error) {
        logger.error(error);
        return { status: 'UnexpectedError' };
    }
}

async function loginAssociation({
  association,
  session,
  ip,
  location,
  app_id,
  app_name,
  os,
  browser,
}) {

  let user_id = null;
  let email = null;
  const tfa = {};

  session = session ?? uuidv4();

  //
  // Attempting to login under the assumption that the association_id provided
  // was validated by the caller
  //
  const txn = await db.transaction();
  try {
    const user = await txn('users')
      .leftJoin('associations', 'users.user_id', 'associations.user_id')
      .select(
        'users.user_id',
        'email',
        'groups',
        'is_fraud',
      )
      .where({ association_id: association.association_id })
      .first();

    if (!user)         throw 'NeedsAssociation';
    if (user.is_fraud) throw 'NotFound';

    user_id = user.user_id;
    email   = user.email.trim();

    const result = await _login({
      txn,
      groups: user.groups,
      email,
      session,
      user_id,
      ip,
      location,
      app_id,
      app_name,
      os,
      browser,
      tfa,
    });

    await txn.commit();

    return result;
  } catch (error) {
    await txn.rollback();
    const errorMap = {
      NotFound: 'NotFound',
      NeedsToBeClaimed: 'NeedsToBeClaimed',
      InvalidRequest: 'InvalidRequest',
      NeedsAssociation: 'NeedsAssociation',
    };
    if (errorMap[error]) {
      return { status: errorMap[error] };
    } else {
      logger.error(error);
      return { status: 'UnexpectedError' };
    }
  }
}

async function loginToken({
  token,
  ip,
  location,
  app_id,
  app_name,
  os,
  browser,
  session,
}) {
  let user_id = null;
  let email   = null;
  const tfa   = {};

  const txn = await db.transaction();
  try {
    const user = await txn('users')
      .leftJoin('token_info', 'users.user_id', 'token_info.user_id')
      .select(
        'users.user_id',
        'email',
        'groups',
        'is_fraud',
        'session_token'
      )
      .where({ token_id: token })
      .first();

    if (!user)         throw 'NotFound';
    if (user.is_fraud) throw 'NotFound';

    user_id = user.user_id;
    email   = user.email.trim();

    if (session !== user.session_token) {
      logger.warn(
        `user_id:${user_id}/${email} trying to login with session ${session} but token ${token} is for session ${user.session_token}`
      );
      throw 'InvalidRequest';
    }

    const result = await _login({
      txn,
      groups: user.groups,
      email,
      session,
      user_id,
      ip,
      location,
      app_id,
      app_name,
      os,
      browser,
      tfa,
    });

    await txn.commit();

    return result;
  } catch (error) {
    await txn.rollback();
    const errorMap = {
      NotFound: 'NotFound',
      NeedsToBeClaimed: 'NeedsToBeClaimed',
      InvalidRequest: 'InvalidRequest',
    };
    if (errorMap[error]) {
      return { status: errorMap[error] };
    } else {
      logger.error(error);
      return { status: 'UnexpectedError' };
    }
  }
}

async function _login({
  txn,
  email,
  groups,
  session,
  user_id,
  ip,
  location,
  app_id,
  app_name,
  os,
  browser,
  tfa,
  onSuccess, // Callback to run on successful login, if fails, entire txn is rolled back
}) {
  try {
    const logoutToken = uuidv4();
    const accessToken = uuidv4();
    const expiration  = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1000);

    const tokenInsert = await txn("tokens").insert({
      user_id,
      expiration,
      token_id: accessToken,
    });

    if (tokenInsert.length === 0) throw "UnexpectedError";

    const tokenInfoInsert = await txn("token_info").insert({
      user_id,
      ip,
      location,
      app_id,
      app_name,
      os,
      browser,
      session_token: session,
      logout_token:  logoutToken,
      token_id:       accessToken,
    });

    if (tokenInfoInsert.length === 0) throw "UnexpectedError";

    const userTfa = await txn("users")
      .select("tfa_enabled", "tfa_secret")
      .where({ user_id: user_id })
      .first();

    if (!userTfa) throw "UnexpectedError";


    // If callback exists, call it since authentication is succesful.
    if (onSuccess) await onSuccess(txn, user_id);

    return {
        status: "Success",
        user_id,
        groups,
        session,
        access_token: accessToken,
        logout_token: logoutToken,
        location,
        tfa: {
            enabled: userTfa.tfa_enabled,
            secret:  userTfa.tfa_secret,
        }
    }
  } catch (error) {
    const errorMap = {
      UnexpectedError: "UnexpectedError",
    };
    if (errorMap[error]) {
      return { status: errorMap[error] };
    } else {
      logger.error(error);
      return { status: "UnexpectedError" };
    }
  }
}












