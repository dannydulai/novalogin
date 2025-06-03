import axios            from "axios";
import pino             from "pino";
import config           from "./config.js";
import { UAParser }     from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt           from 'bcrypt';
import accountdb        from './accountdb.js';
import {
    isValidEmail,
    isValidPassword,
    genEmailKey
} from './account6/utils.mjs';

const logger = pino({ name: "account" });

export async function saveTFA(userid, secret) {
    try {
        const r = (await axios.get(`${config.accountServerUrl}/accounts/6/savetfa`, {
                                       params: {
                                           m: "FC0E1058-7378-44AE-BE62-98DBD0AC2605",
                                           userid: userid,
                                           enabled: !!secret,
                                           secret: secret || '',
                                       }
                                   })).data;

        return (r.status == "Success");

    } catch (err) {
        logger.error(err, "save tfa request failed");
        return false;
    }
}

export async function webaccountinfo(access_token, recaptcha, userid = undefined) {
    try {
        const r = (await axios.get(`${config.accountServerUrl}/accounts/5/webaccountinfo?`, {
            params: {
                recaptcha: recaptcha || 'SKIP',
                token: access_token,
                userid
            }
        }));
        if (r.data.status === 'Success' ) {
            return r.data
        } else {
            throw r.data.status
        }
    } catch (e) {
        logger.error(e);
    }
};

export async function verify(access_token) {
    try {
        const r = (await axios.get(`${config.accountServerUrl}/accounts/6/verify`, {
                                       params: {
                                           m: "FC0E1058-7378-44AE-BE62-98DBD0AC2605",
                                           token: access_token,
                                       }
                                   })).data;

        return (r.status == "Success" ? r.email : false);

    } catch (err) {
        logger.error(err, "access token verification request failed");
        return false;
    }
}

export async function getProfiles(userid) {
    try {
        const r = (await axios.get(`${config.accountServerUrl}/accounts/3/profileslist`, {
                                       params: {
                                           token: "FC0E1058-7378-44AE-BE62-98DBD0AC2605",
                                           userid
                                       }
                                   })).data;

        return (r.status == "Success") ? r.profiles : false;

    } catch (err) {
        logger.error(err, "access token verification request failed");
        return false;
    }
}

export async function getLocation(ip) {
    let location = 'Unknown';
    try {
        const geoip = (await axios.get(`https://geoip.roonlabs.net/geoip/1/lookup`, { params: { ip } })).data;
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

async function _login(opts) {
    if (opts.email && opts.password) {
        return await login6EmailPassword(opts);
    } else if (opts.googleEmail && opts.googleId) {
        return await login6Google(opts);
    } else if (opts.association) {
        return await login6Association(opts);
    } else if (opts.token && opts.session) {
        return await login6Token(opts);
    } else {
        throw "Invalid login options";
    }
}

/** Checks user credentials and returns their userId or null if invalid */
export async function login(cookBI, useragent, appid, appname, ip, authinfo) {
    try {
        const { browser, os } = getUAInfo(useragent);

        const location = await getLocation(ip);

        const r = await _login({
            appid,
            appname,
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
        if (!r.userid || !r.access_token || !r.logout_token) {
            logger.error(r, "Account server returned Success for login, but did not return userid, access_token, or logout_token");
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
        const r = (await axios.get(`${config.accountServerUrl}/accounts/6/logout`, {
                                       params: {
                                           m:            "FC0E1058-7378-44AE-BE62-98DBD0AC2605",
                                           ...opts
                                       }
                                   })).data;

        if (r.status !== "Success") {
            logger.error(r, `Account server returned non-Success for logout on token ${JSON.stringify(opts)}`);
        }

    } catch (err) {
        logger.error(err, "Account check request failed");
    }
}

export async function validateRecaptcha(
    recaptcha
) {
    try {
        if (config.recaptchaSecret == "SKIPCAPTCHA")
            return true;

        const res = await axios.post(`https://www.google.com/recaptcha/api/siteverify?response=${recaptcha}&secret=${config.recaptchaSecret}`)

        const {
            action,
            score,
            hostname,
            success
        } = res.data;

        if (
            !Boolean(success)           ||
            !action                     ||
            !action.startsWith("roon_") ||
            !score                      ||
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
async function login6EmailPassword({
  email,
  password, // if null, we're doing a passwordless login
  session,
  ip,
  location,
  appid,
  appname,
  os,
  browser,
  onSuccess
}) {
    const logoutToken = uuidv4();
    const accessToken = uuidv4();
    let userid        = null;
    const tfa         = {};

    session = session ?? uuidv4();
    email   = email.toLowerCase().trim();

    const txn = await accountdb.transaction();
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
                'userid',
                'passwd',
                'claim_id',
                'groups',
                'isfraud',
                'email'
            )
            .where({ email_key: emailKey })
            .first();

        if (!user) throw 'NotFound';
        userid = user.userid;
        const dbPasswd = user.passwd.trim();

        if (password !== null && !await bcrypt.compare(password, dbPasswd)) {
            throw 'Unauthorized';
        }
        if (user.claim_id !== null) throw 'NeedsToBeClaimed';
        if (user.isfraud) throw 'NotFound';
        email = user.email.trim();

        const result = await _login6({
            txn,
            email,
            groups: user.groups,
            session,
            userid,
            ip,
            location,
            appid,
            appname,
            os,
            browser,
            logoutToken,
            accessToken,
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

async function login6Google({
  googleEmail,
  googleId,
  session,
  ip,
  location,
  appid,
  appname,
  os,
  browser
}) {
    try {
        // Try login via association
        let result = await login6Association({
            association: { association_id: googleId },
            session,
            ip,
            location,
            appid,
            appname,
            os,
            browser
        });

        if (result.status === 'Success')  return result;

        // Only continue if error is that no association exists
        if (result.status !== 'NeedsAssociation') return result;

        result = await login6EmailPassword({
            email: googleEmail,
            password: null,
            session,
            ip,
            location,
            appid,
            appname,
            os,
            browser,
            onSuccess: async (txn, userid) => {
                // Create association for account that has this email address
                // IF and only IF no association exists for this google account
                const existing = await txn('associations')
                    .where({association_type: 'google', association_id: googleId})
                    .whereNot({userid})
                    .first();

                // Someone else already associated with this account.
                if (existing) throw 'AlreadyAssociated';

                await txn('associations')
                    .insert({
                        association_type: 'google',
                        association_id:   googleId,
                        userid:           userid,
                        updated:          txn.raw('CURRENT_TIMESTAMP'), // always update this field
                        data: {
                            email: googleEmail
                        }
                    })
                    .onConflict(['userid', 'association_type', 'association_id'])
                    .merge();
            }
        });
        return result;
    } catch (error) {
        logger.error(error);
        return { status: 'UnexpectedError' };
    }
}

async function login6Association({
  association,
  session,
  ip,
  location,
  appid,
  appname,
  os,
  browser,
}) {

  const logoutToken = uuidv4();
  const accessToken = uuidv4();

  let userid = null;
  let email = null;
  const tfa = {};

  session = session ?? uuidv4();

  //
  // Attempting to login under the assumption that the association_id provided
  // was validated by the caller
  //
  const txn = await accountdb.transaction();
  try {
    const user = await txn('users')
      .leftJoin('associations', 'users.userid', 'associations.userid')
      .select(
        'users.userid',
        'email',
        'claim_id',
        'groups',
        'isfraud',
      )
      .where({ association_id: association.association_id })
      .first();

    if (!user)                  throw 'NeedsAssociation';
    if (user.claim_id !== null) throw 'NeedsToBeClaimed';
    if (user.isfraud)           throw 'NotFound';

    userid = user.userid;
    email = user.email.trim();

    const result = await _login6({
      txn,
      groups: user.groups,
      email,
      session,
      userid,
      ip,
      location,
      appid,
      appname,
      os,
      browser,
      logoutToken,
      accessToken,
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

async function login6Token({
  token,
  ip,
  location,
  appid,
  appname,
  os,
  browser,
  session,
}) {
  const logoutToken = uuidv4();
  const accessToken = uuidv4();
  let userid = null;
  let email = null;
  const tfa = {};

  const txn = await accountdb.transaction();
  try {
    const user = await txn('users')
      .leftJoin('token_info', 'users.userid', 'token_info.userid')
      .select(
        'users.userid',
        'email',
        'claim_id',
        'groups',
        'isfraud',
        'session_token'
      )
      .where({ tokenid: token })
      .first();

    if (!user) throw 'NotFound';
    if (user.claim_id !== null) throw 'NeedsToBeClaimed';
    if (user.isfraud) throw 'NotFound';

    userid = user.userid;
    email = user.email.trim();

    if (session !== user.session_token) {
      logger.warn(
        `userid:${userid}/${email} trying to login with session ${session} but token ${token} is for session ${user.session_token}`
      );
      throw 'InvalidRequest';
    }

    const result = await _login6({
      txn,
      groups: user.groups,
      email,
      session,
      userid,
      ip,
      location,
      appid,
      appname,
      os,
      browser,
      logoutToken,
      accessToken,
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

async function _login6({
  txn,
  email,
  groups,
  session,
  userid,
  ip,
  location,
  appid,
  appname,
  os,
  browser,
  logoutToken,
  accessToken,
  tfa,
  onSuccess, // Callback to run on successful login, if fails, entire txn is rolled back
}) {
  try {
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1000);

    const tokenInsert = await txn("tokens").insert({
      userid,
      expiration,
      tokenid: accessToken,
    });

    if (tokenInsert.length === 0) throw "UnexpectedError";

    const tokenInfoInsert = await txn("token_info").insert({
      userid,
      ip,
      location,
      appid,
      appname,
      os,
      browser,
      session_token: session,
      logout_token:  logoutToken,
      tokenid:       accessToken,
    });

    if (tokenInfoInsert.length === 0) throw "UnexpectedError";

      // XXX Anything related to tfa needs checking
    const userTfa = await txn("users")
      .select("tfa_enabled", "tfa_secret")
      .where({ userid: userid })
      .first();

    if (!userTfa) throw "UnexpectedError";


    // If callback exists, call it since authentication is succesful.
    if (onSuccess) await onSuccess(txn, userid);

    return {
        status: "Success",
        userid,
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












