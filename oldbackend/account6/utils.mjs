import fs               from 'fs';
import path             from 'path';
import jwt_decode       from "jwt-decode";
import bcrypt           from 'bcrypt';
import {OAuth2Client}   from 'google-auth-library';
import knex             from 'knex';
import Stripe           from 'stripe';
import axios            from "axios";
import requestIp        from 'request-ip';
import jwt              from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
    SQSClient,
    SendMessageCommand
} from "@aws-sdk/client-sqs";

import * as pricingUtils from "./pricing.mjs";
import * as authUtils from "../auth.mjs";
import config         from '../config.js';
import db             from '../accountdb.js';

import { verifyAppleIdToken, getCookie, ACCOUNT_APP_ID, LOGIN_COOKIE_VERSION, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET }  from '../utils.mjs' // login utils

const RECAPTCHAKEY = config.recaptchaSecret || "";
const APPLE_SIGNIN_PRIVATE_KEY = process.env.APPLE_SIGNIN_PRIVATE_KEY || fs.readFileSync("/run/secrets/apple_signin_private_key", "utf8").replace(/\n$/, '');
const googleClient             = new OAuth2Client(GOOGLE_CLIENT_ID);


const sqs  = new SQSClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY || fs.readFileSync("/run/secrets/aws_access_key", "utf8").replace(/\n$/, ''),
        secretAccessKey: process.env.AWS_SECRET_KEY || fs.readFileSync("/run/secrets/aws_secret_key", "utf8").replace(/\n$/, ''),
    }
});
const dev  = Stripe('sk_test_kQSKOOxf0QrRo1fsBVHoKysg');
const prod = Stripe('sk_live_8wQQbyzyCCHWbX4y8BHNY5yN');

export function stripe(o, locale) {
    if (o?.groups?.includes("stripe-test"))
        return dev;
    return prod;
}

export function stripePk(o) {
    if (o?.groups?.includes("stripe-test"))
        return "pk_test_QdYi9wySxKIB8z3NM3KvFqVH";
    return "pk_live_hSgrwjSRwVNFAuJbGsfzGPX1";
}

export async function recaptcha(req, res, next) {
    try {
        const ui = req.ui;
        if (!await verifyRecaptcha(req.query.recaptcha || req.body.recaptcha, ui)) {
            return res.send({ status: "InvalidRecaptcha" });
        }
        next();
    } catch (error) {
        console.log(error)
        return res.send({ status: 'UnexpectedError' })
    }
}

export function auth({ adminRO, bodyAuthSecret }) {
    return async function(req, res, next) {
        try {
            const roonLI = getCookie(req, 'roonLI') || (
                !!bodyAuthSecret &&
                req.headers['x-body-auth-secret'] === bodyAuthSecret &&
                req.body.roonLI
            );
            if (!roonLI) return res.send({ status: 'Unauthorized'});

            const ui = await getUserInfo(roonLI.access_token);
            if (!ui)
                return res.send({ status: "Unauthorized" });

            if (req.query.userid && req.query.userid != ui.userid) {
                if (ui.groups?.includes("admin-rw") || (adminRO && ui.groups?.includes('admin-ro'))) {
                    // Admin is acting on behalf of user set in query params
                    req.ui      = await adminGetUserInfo(req.query.userid);
                    req.adminui = ui;
                } else {
                    return res.send({ status: "Unauthorized" });
                }
            } else {
                req.ui = ui;
            }

            req.roonLI = roonLI;
            next();
        } catch (error) {
            console.log(error)
            return res.send({ status: 'UnexpectedError' })
        }
    }
}

export async function unassociate(userid, association_id, association_type) {
    await db('associations')
    .where({
        userid,
        association_id,
        association_type
    })
    .del();
}

export async function connectToGoogle1(ui) {
    const stringifiedParams = new URLSearchParams({
        prompt: 'select_account',
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: 'https://account.roon.app/account/connect',
        scope: [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' '), // space seperated string
        response_type: 'code',
        access_type: 'offline',
        state: JSON.stringify({setup: true})
    }).toString();
    return { status: "Success", redirect: `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}` };
}

export async function connectToGoogle2(ui, code) {
    const txn   = await db.transaction();
    try {
        const { data } = await axios({
            url: `https://oauth2.googleapis.com/token`,
            method: 'post',
            data: {
                client_id:     GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: 'https://account.roon.app/account/connect',
                grant_type:   'authorization_code',
                code,
            },
        });
        const ticket = await googleClient.verifyIdToken({
            idToken: data.id_token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, sub } = payload;

        const existing = await txn('associations')
            .where({association_type: 'google', association_id: sub})
            .whereNot({userid: ui.userid})
            .first();
        if (existing) {
            await txn.rollback();
            return { status: 'AlreadyAssociated' };
        } else {
            // Association check with sub
            await txn('associations')
                .insert({
                    userid: ui.userid,
                    association_type: 'google',
                    association_id: sub,
                    updated: txn.raw('now()'),
                    data: {
                        email
                    }
                })
                .onConflict(['userid', 'association_type', 'association_id'])
                .merge();
        }
        await txn.commit();
        return { status: 'Success' }
    } catch (e) {
        await txn.rollback();
        console.log(e);
        return { status: 'UnexpectedError' };
    }
}

export async function connectToApple(ui, id_token, nonce) {
    // Verify JWT with apple
    const {
        sub,
        email,
        email_verified,
    } = await verifyAppleIdToken(id_token, 'com.roon.website.signin', nonce);

    const otheraccts = await db('associations')
        .where({association_type: 'apple', association_id: sub})
        .whereNot({userid: ui.userid})
        .first();

    if (otheraccts) throw 'Apple account already associated with another account';

    // Association check with sub
    await db('associations')
        .insert({
            userid: ui.userid,
            association_type: 'apple',
            association_id: sub,
            updated: db.raw('now()'),
            data: {
                email,
                email_verified
            }
        })
        .onConflict(['userid', 'association_type', 'association_id'])
        .merge();
}

export async function createPaymentIntent(req, ui, license, billing, src, payment_method_type = null, special = null) {
    // Check if license is required
    if (src !== 'accountpage:claim_special' && !license) {
        throw 'A license is required for this operation';
    }

    let metadata = {};
    let amount   = 0;
    const pricingModel = await pricingUtils.pricing(req);
    if (billing === 'lifetime') {
        metadata.receiptline   = 'Roon Lifetime Subscription'
        metadata.purpose       = 'renewal: lifetime'
        metadata.accountAction = { v: 1, renewal: 'lifetime' }
        metadata.SKU = 'ROONSUB-LIFETIME';
        if (src == 'accountpage:claim_special') {
            if (!license)           metadata.accountAction.newLicenseRequired = 1;
            if (special.code)       metadata.accountAction.specialCode        = special.code;
            if (special.code)       metadata.accountAction.specialValue       = special.value;
            if (special.special_id) metadata.accountAction.specialId          = special.special_id;
            metadata.accountAction.isSpecialOffer = 1;
            metadata.purpose = 'special: lifetime';
            amount = special.data.price;
        } else if (src == 'accountpage:20_percent_off_lifetime') {
            amount = pricingModel.twenty_pct_off_lifetime.value;
        } else {
            amount = pricingModel.lifetime.value;
            /*
            if (license.willrefundonlifetime) {
                amount -= license.willrefundonlifetime;
            }
            */
        }
    } else if (billing === 'monthly') {
        metadata.receiptline   = 'Roon Monthly Subscription'
        metadata.purpose       = 'renewal: month'
        metadata.accountAction = { v: 1, renewal: 'month' }
        metadata.qty           = 1;
        metadata.receipt_sent  = 1;
        metadata.SKU           = 'ROONSUB-MONTHLY-1M';
        if (src == 'accountpage:claim_special') {
            if (!license)           metadata.accountAction.newLicenseRequired = 1;
            if (special.code)       metadata.accountAction.specialCode        = special.code;
            if (special.code)       metadata.accountAction.specialValue       = special.value;
            if (special.special_id) metadata.accountAction.specialId          = special.special_id;
            metadata.accountAction.isSpecialOffer = 1;
            metadata.purpose = 'special: month';
            metadata.qty = special.data.months || 1;
            metadata.SKU = 'ROONSUB-MONTHLY-' + metadata.qty + 'M';
            amount       = special.data.price;
        } else {
            amount = pricingModel.monthly.value;
        }
    } else if (billing === 'yearly') {
        metadata.receiptline   = 'Roon Yearly Subscription'
        metadata.purpose       = 'renewal: year'
        metadata.accountAction = { v: 1, renewal: 'year' }
        metadata.SKU           = 'ROONSUB-YEARLY-12M';
        if (src == 'accountpage:claim_special') {
            if (!license)           metadata.accountAction.newLicenseRequired = 1;
            if (special.code)       metadata.accountAction.specialCode        = special.code;
            if (special.code)       metadata.accountAction.specialValue       = special.value;
            if (special.special_id) metadata.accountAction.specialId          = special.special_id;
            metadata.accountAction.isSpecialOffer = 1;
            metadata.purpose = 'special: year';
            metadata.qty     = 365; // XXX Get support for variable days, requires code parsing updates
            amount           = special.data.price;
        } else {
            amount = pricingModel.annual.value;
            if (license.state == 'used') {
                metadata.qty = 395;
                metadata.SKU = 'ROONSUB-YEARLY-13M';
            } else {
                metadata.qty = 365;
            }
        }
    } else {
        throw '';
    }

    metadata.src = src || '';
    metadata.accountAction = JSON.stringify(metadata.accountAction);

    if (payment_method_type === 'alipay') {
        // Alipay requires capture_method = automatic, no fingerprint check
        metadata.paymentMethodType = 'alipay';
        return await stripe(ui).paymentIntents.create({
            amount,
            customer: ui.stripecustomerid,
            currency: pricingModel.currency,
            payment_method_types: ['alipay'],
            setup_future_usage: 'off_session',
            metadata: {
                ...metadata,
                userid:                  ui.userid,
                licenseid:               license?.licenseid,
                userCreatedWithin30Days: license?.iswithin30days,
            }
        })
    } else if (payment_method_type === 'klarna') {
        metadata.paymentMethodType = 'klarna';

        const ip     = requestIp.getClientIp(req);
        const geoip  = (await axios.get(`https://geoip.roonlabs.net/geoip/1/lookup`, { params: { ip } })).data;
        if (!geoip.country_iso) {
            console.log('Unable to determine country for IP', ip);
            return null;
        }
        return await stripe(ui).paymentIntents.create({
            amount,
            customer: ui.stripecustomerid,
            currency: pricingModel.currency,
            payment_method_types: ['klarna'],
            payment_method_data: {
                type: 'klarna',
                billing_details: {
                    address: {
                        country: geoip.country_iso,
                    },
                    email: ui.email,
                }
            },
            metadata: {
                ...metadata,
                userid:                  ui.userid,
                licenseid:               license?.licenseid,
                userCreatedWithin30Days: license?.iswithin30days,
            }
        })
    } else {
        // Fingerprint check done in webhook
        return await stripe(ui).paymentIntents.create({
            amount,
            customer: ui.stripecustomerid,
            confirm:  false,
            currency: pricingModel.currency,
            capture_method: 'manual',
            setup_future_usage: 'off_session',
            metadata: {
                ...metadata,
                userid:                  ui.userid,
                licenseid:               license?.licenseid,
                userCreatedWithin30Days: license?.iswithin30days,
            }
        })
    }
}

export async function canTrial(userid) {
    const res = await db.raw(`SELECT count(*) FROM licenses WHERE userid = ? AND (closed IS NULL OR closed >= (NOW() - interval '90 days'))`, [ userid ]);
    return (res.rows[0].count == 0);
}

async function willRefundOnLifetime(stripe, license) {
    return 0;
    throw 'Needs to be reimplemented for multiple currency support';
    const { paymentid: paymentId } = license;

    if (paymentId) {
        try {
            let payment        = await stripe.charges.retrieve(paymentId);
            let amountRefunded = payment.amount_refunded;
            let amount         = payment.amount;
            let created        = payment.created;

            if (!amountRefunded || amountRefunded === 0) {
                if (amount <= 14988) {
                    // If there was a payment in the last year, and the license is open
                    // or the license closed within the past 7 days, a refund is available.
                    if ((Date.now() - created * 1000) < (365 * 24 * 60 * 60 * 1000)) {
                        if (license.closed) {
                            // Check license was closed in past 7 days
                            const now    = new Date();
                            const closed = new Date(license.closed);
                            const msSinceClosed = (now - closed);
                            if (msSinceClosed <= (7 * 1000 * 60 * 60 * 24) - 1000 * 60 * 10) { // 10 min buffer
                                return amount;
                            }
                        } else {
                            return amount;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error retrieving payment:', error);
        }
    }
    return undefined;
}

export async function getAssociatedAccounts(ui) {
    return (await db.raw('SELECT * FROM associations WHERE userid = :userid', {userid: ui.userid})).rows;
}

export async function getLicenseForChangeBilling(ui, licenseid, { needsPaymentMethod, needsRefundAmount } = {}) {
    const [lic] = (await db.raw(`
    SELECT
        l.licenseid,
        l.billing,
        l.autorenew,
        l.closed,
        l.expiration,
        l.trialexpiration,
        l.status,
        l.licensetype,
        l.paymentid,
        l.created,
        l.utm_content = 'black-friday-2024' as isblackfriday2024,
        l.utm_content = 'cyber-monday-2024' as iscybermonday2024,
        ((CURRENT_TIMESTAMP - u.created) < interval '30 days') as iswithin30days,
        json_build_object(
            'userid',    u.userid,
            'email',     u.email,
            'firstname', u.firstname,
            'lastname',  u.lastname
        ) as user
    FROM licenses l
    LEFT JOIN users u using(userid)
    WHERE userid = :userid and licenseid = :licenseid;
    `,{userid: ui.userid, licenseid})).rows;
    if (ui.stripecustomerid) {
        if (needsRefundAmount)
            lic.willrefundonlifetime  = await willRefundOnLifetime(stripe(ui), lic)
        if (needsPaymentMethod)
            lic.existingPaymentMethod = await getLatestPaymentMethod(ui);
    }
    delete lic.paymentid;
    return lic;
}

export async function getLicenses(ui) {
    const res = await db.raw(`
    SELECT
        l.licenseid,
        l.billing,
        l.autorenew,
        l.closed,
        l.closereason,
        l.expiration,
        l.trialexpiration,
        l.status,
        l.licensetype,
        l.paymentid,
        l.created,
        l.utm_source = 'kkbox-promo' as iskkboxpromo,
        l.utm_content = 'black-friday-2024' as isblackfriday2024,
        l.utm_content = 'cyber-monday-2024' as iscybermonday2024,
        ((CURRENT_TIMESTAMP - u.created) < interval '30 days') as iswithin30days,
        json_build_object(
            'userid',    u.userid,
            'email',     u.email,
            'firstname', u.firstname,
            'lastname',  u.lastname
        ) as user
    FROM licenses l
    LEFT JOIN users u using(userid)
    WHERE
        userid = :userid
        AND (closed IS NULL OR closed >= (NOW() - interval '90 days'))
        ORDER BY closed DESC NULLS FIRST, created DESC;
    `,{userid: ui.userid});

    let open   = 0;
    let closed = 0;
    for (let lic of res.rows) {
        if (lic.closed && lic.closereason !== 'PastDue') {
            closed++;
        } else {
            open++;
        }
    }

    let lics;
    if (closed === 0)    lics = res.rows;
    else if (open === 0) lics = res.rows.slice(0, 1);
    else                 lics = res.rows.filter(lic => !lic.closed || (lic.closed && lic.closereason === 'PastDue'));

    return await Promise.all(lics
        .map(async lic => {
            lic.willrefundonlifetime = await willRefundOnLifetime(stripe(ui), lic);
            lic.expiration_date      = lic.status == 'Trial' ? lic.trialexpiration : lic.expiration;
            delete lic.paymentid;
            return lic;
        })
    );
}

export async function updateWebUserInfo(ui, firstname, lastname, phone) {
    await db.raw(`
        UPDATE users
        SET firstname = :firstname,
            lastname  = :lastname,
            phone     = :phone
        WHERE userid = :userid
    `,{userid: ui.userid, firstname, lastname, phone: phone || null})

    const user_ids = ['roon:' + ui.userid.toString()];
    if (ui.bigcommercecustomerid !== null) {
        if (ui.groups?.includes('bigcommerce-test')) {
            user_ids.push('bigcommerce-test:' + ui.bigcommercecustomerid);
        } else {
            user_ids.push('bigcommerce:' + ui.bigcommercecustomerid);
        }
    }
    if (ui.stripecustomerid !== null) {
        if (ui.groups?.includes('stripe-test')) {
            user_ids.push('stripe-test:' + ui.stripecustomerid);
        } else {
            user_ids.push('stripe:' + ui.stripecustomerid);
        }
    }

    const event = {
        type: 'account.changed',
        user_ids,
        properties: {
            'firstname:STRING':    firstname,
            'lastname:STRING':     lastname,
            'phone:STRING':        phone || '',
        },
    };

    queueEvent(event);
}

export async function getInternalUserInfo(userid, email) {
    if (!userid && !email) return null;
    const filter = userid ? 'u.userid = :userid' : 'u.email = :email';
    const res = await db.raw(`
        WITH license as (
            SELECT
                userid,
                CASE
                WHEN SUM((licenses.status IS NOT NULL)::integer) = 0 THEN 'none'
                WHEN 'Lifetime' = ANY(ARRAY_AGG(licenses.status)) THEN 'lifetime'
                WHEN 'Subscription' = ANY(ARRAY_AGG(licenses.status)) THEN
                    CASE
                    WHEN SUM(CASE WHEN licenses.status = 'Subscription' AND licenses.billing = 'monthly' THEN 1 ELSE 0 END) > 0 THEN
                    'monthly'
                    ELSE
                    'yearly'
                    END
                WHEN 'Trial' = ANY(ARRAY_AGG(licenses.status)) THEN 'trial'
                ELSE 'other'
                END AS license
            FROM licenses
            LEFT JOIN users u using(userid)
            WHERE
                closed is null AND ${filter}
			GROUP BY userid
        )
        SELECT
            u.userid,
            u.firstname,
            u.lastname,
            u.email,
            u.groups,
            license,
            COALESCE(JSON_AGG(json_build_object(
            'company', json_build_object(
				'name', companies.name,
				'website', companies.website,
				'companyid', companies.companyid,
				'phone', companies.phone,
				'street', companies.street,
				'city', companies.city,
				'zipcode', companies.zipcode,
				'state', companies.state,
				'country', companies.country,
				'class', companies.class,
				'is_store_dealer', companies.is_store_dealer,
				'can_auto_approve_users', companies.can_auto_approve_users
			),
            'account', row_to_json(companyaccounts.*)
            )) FILTER (WHERE companyaccounts.companyid IS NOT NULL), '{}') AS companies
        FROM users u
        LEFT JOIN license         using(userid)
        LEFT JOIN companyaccounts using(userid)
        LEFT JOIN companies       using(companyid)
        WHERE ${filter}
        GROUP BY u.userid, license
    `, {userid, email});
    return res?.rows?.[0];
}

export async function getCommunityUserInfo(userid) {
    const res = await db.raw(`SELECT users.email, users.firstname, users.lastname FROM users where userid = ?`, [ userid ]);
    return res?.rows?.[0];
}

export async function getWebUserInfo(userid) {
    const res = await db.raw(`SELECT users.email, users.firstname, users.lastname, users.phone FROM users where userid = ?`, [ userid ]);
    return res?.rows?.[0];
}

export async function adminGetUserInfo(userid) {
    const res = await db.raw(`SELECT users.email, users.userid, users.groups, users.stripecustomerid, users.currency FROM users where userid = ?`, [ userid ]);
    return res?.rows?.[0];
}

export async function OIDCUserInfo(token) {
    const res = await db.raw(`SELECT
        users.email,
        users.userid,
        users.groups,
        users.firstname,
        users.lastname
    FROM tokens LEFT JOIN users USING (userid) WHERE tokens.tokenid = ?`, [ token ]);
    return res?.rows?.[0];
}

export async function getUserInfo(token) {
    const res = await db.raw(`SELECT
        users.email,
        users.userid,
        users.groups,
        users.stripecustomerid,
        users.bigcommercecustomerid,
        users.currency
    FROM tokens LEFT JOIN users USING (userid) WHERE tokens.tokenid = ?`, [ token ]);
    return res?.rows?.[0];
}

export async function verifyRecaptcha(recaptcha, ui) {
    if (recaptcha == "SKIP" || config.recaptchaSecret === 'SKIPCAPTCHA')
        return true;

    try {
        const res = await axios(`https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHAKEY}&response=${recaptcha}`, { method: 'post' });
        const json = res.data;

        if (!json.success) {
            console.log("Recaptcha failed: success != true", {json, ui: ui || null, date: Date.now()});
            return false;
        }
        if (!json.action?.startsWith("roon_")) {
            console.log("Recaptcha failed: invalid action", {json, ui: ui || null, date: Date.now()});
            return false;
        }
        if ((json.score ?? 0) < 0.5) {
            console.log("Recaptcha failed: score lower than 0.5", {json, ui: ui || null, date: Date.now()});
            return false;
        }
        /* || (
           json.hostname != "roonlabs.com" &&
           json.hostname != "roon.app" &&
           !json.hostname.endsWith(".roonlabs.net") &&
           !json.hostname.endsWith(".roonlabs.com")
           !json.hostname.endsWith(".roon.app")
           ) */

        return true;
    } catch (e) {
        console.log(e)
        return false;
    }
}

export async function getLatestPaymentMethod(ui) {
    if (!ui.stripecustomerid) return null;
    const customer = await stripe(ui).customers.retrieve(ui.stripecustomerid, {expand:
        ['default_source', 'invoice_settings.default_payment_method']});
    const pm = customer.default_source || customer.invoice_settings?.default_payment_method;
    if (pm?.metadata?.notYetFingerprintChecked) return null;

    // Old customers;
    if (pm?.id.startsWith("card_")) return { type: 'card', card: pm };

    return pm;

    /* OLD WAY
    const payment_methods = await stripe(ui).paymentMethods.list({ customer: ui.stripecustomerid, })
    const good_pms = payment_methods.data.filter(pm => !pm.metadata.notYetFingerprintChecked);
    if (good_pms.length)
        return good_pms.sort((a,b) => b.created - a.created)[0];
    return null;
    */
}

// Performs fingerprint check for given payment method
// adds card to cards table for provided user/card
export async function fingerPrintCheck(res, ui, paymentMethod) {
    try {
        const fingerprint = paymentMethod.card.fingerprint;
        const [row] = (await db.raw(`
            INSERT INTO cards (userid, fingerprint, date, log) VALUES (?, ?, NOW(), '')
            ON CONFLICT (userid, fingerprint) DO UPDATE
            set date = cards.date -- Dummy update to get back current row if there is a conflict
            RETURNING *
        `, [ ui.userid, fingerprint ])).rows;
        if (row?.userid != ui.userid) {
            await stripe(ui).paymentMethods.detach(paymentMethod.id);
            res.send({ status: "CardAlreadyInUse" });
            return false;
        }
    } catch (e) {
        console.log(e);
        await stripe(ui).paymentMethods.detach(paymentMethod.id);
        throw e;
    }
    return true;
};

//
// XXX Do we need radar info on this payment intent? or do we just care about original radar info
// on the setup intent at point of payment info collection?
//
// Performs 1.01 check on a given payment method
export async function _101Check(res, ui, paymentMethod, setiId) {
    try {
    const paymentIntent = await stripe(ui).paymentIntents.create({
        amount: 101,
        off_session: true,
        currency: 'usd',
        confirm: true,
        customer: ui.stripecustomerid,
        capture_method: 'manual',
        payment_method: paymentMethod.id,
        metadata: { userid: ui.userid }
    });

    if (paymentIntent?.status == "requires_capture") {
        await stripe(ui).paymentIntents.cancel(paymentIntent.id);
    } else {
        if (setiId)
            stripe(ui).paymentMethods.detach(paymentMethod.id); // don't await, just do it in the bg
        if (paymentIntent?.status == "requires_payment_method") {
            res.send({
                status: "CardValidationFailed",
            });
            return false;
        } else {
            res.send({
                status: "CardError",
                message: paymentIntent?.last_payment_error?.message
            });
            return false;
        }
    }
    return true;
    } catch (e) {
        // Pass on failed payment intent since 3ds considered valid
        if (e.code == 'authentication_required') {
            return true;
        } else if (e.code) {
            console.log(e.code);
            res.send({
                status: "PaymentAuthorizationError",
                message: "Payment authorization error. Please check with the card's issuing bank."
            });
            return false;
        } else {
            throw e;
        }
    }
};

// gets or creates stripe customer, attaches stripe id and any latest payment method to ui
// updates accounts users table to add stripe customer id
export async function getOrCreateStripeCustomer(res, ui, { needsPaymentMethodOnFile } = {}) {
    if (ui.stripecustomerid) {
        if (needsPaymentMethodOnFile) {
            // get stripe payment method info for user
            let existing_method = await getLatestPaymentMethod(ui);
            if (existing_method?.type === 'card') {
                ui.payment_method_on_file = {
                    id:  existing_method.id,
                    type: "card",// | "alipay" | "paypal",
                    card: {
                        brand:     existing_method.card.brand,
                        name:      existing_method.billing_details?.name || existing_method.card?.name,
                        last4:     existing_method.card.last4,
                        exp_month: existing_method.card.exp_month,
                        exp_year:  existing_method.card.exp_year
                    }
                }
            } else if (existing_method?.type === 'alipay') {
                ui.payment_method_on_file = {
                    type: "alipay",
                    id: existing_method.id,
                    alipay: existing_method.alipay
                }
            }
        }

    } else {
        const customer = await stripe(ui).customers.create({
            email: ui.email,
            metadata: {
                userid: ui.userid
            }
        });
        ui.stripecustomerid = customer.id;
        res = await db.raw(`UPDATE users SET stripecustomerid = ? WHERE userid = ?`, [ customer.id, ui.userid ]);
        if (res.rowCount != 1) {
            console.log(`error saving stripe customer id to user ${ui.userid}`);
            res.send({ status: "UnexpectedError" });
            return false;
        }
    }
    return true;
}

export function LogMessage(s) {
    const time = new Date(Date.now()).toISOString().substring(0,19).replaceAll(/[-:T]+/g,'')
    return `${time} ${s}`
}

export async function createTrialLicense(req, res, ui) {
    try {
        const billing      = req.query.billing       || req.body.billing;
        const utm_source   = req.query.utm_source    || req.body.utm_source;
        const utm_medium   = req.query.utm_medium    || req.body.utm_medium;
        const utm_campaign = req.query.utm_campaign  || req.body.utm_campaign;
        const utm_term     = req.query.utm_term      || req.body.utm_term;
        const utm_content  = req.query.utm_content   || req.body.utm_content;
        const referralcode = req.query.r || req.body.r; // referralcode

        if (billing == "monthly") {
            // ok
        } else if (billing == "yearly") {
            // ok
        } else if (billing == "lifetime") {
            // ok
        } else {
            res.send({ status: "InvalidBilling" });
            return false;
        }

        const selling_userid = null;
        if (referralcode) {
            const rows = await db.raw('SELECT userid from users where referralcode = ?', [referralcode]);
            if (rows.length) {
                selling_userid = rows[0].userid;
            } else {
                res.send({ status: 'InvalidReferralCode' })
                return false
            }
        }

        const expirationdays = 14;

        let log = LogMessage(`started trial of (${billing} ${expirationdays} day)`);
        log += "\n" + LogMessage("status: null -> Trial");
        log += "\n" + LogMessage("licensetype: null -> Roon1");
        log += "\n" + LogMessage(`trialexpiration: now+${expirationdays} days`);
        log += "\n" + LogMessage("autorenew: true");

        if (selling_userid != null) {
            log += "\n" + LogMessage(`selling_userid: ${selling_userid}`);
        }

        const query=`
        INSERT INTO licenses ( created, licenseid, userid, licensetype, status, log, autorenew, trialexpiration,
                               billing, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
                               selling_userid
        ) VALUES (
            CURRENT_TIMESTAMP, :licenseid, :userid, 'Roon1'::license_type, 'Trial'::licensestatus_type,
            :log, true, NOW() + interval '${expirationdays} days',
            :billing, :utm_source, :utm_medium, :utm_campaign, :utm_term, :utm_content, :selling_userid
        )`;

        const result = await db.raw(query, {
            log,
            billing,
            licenseid:      uuidv4(),
            userid:         ui.userid,
            utm_source:     utm_source   || null,
            utm_medium:     utm_medium   || null,
            utm_campaign:   utm_campaign || null,
            utm_term:       utm_term     || null,
            utm_content:    utm_content  || null,
            selling_userid: selling_userid || null
        });

        // Everflow Create Trial
        (async function() {
            try {
                await axios(`https://www.rofjdjk3ns.com/?nid=2162&oid=1&event_id=2&email=${ui.userid}`);
            } catch (e) {
                console.log('everflow error', e)
            }
        })();

        return true;
    } catch (e) {
        console.log(e);
        res.send({ status: 'UnexpectedError' })
        return false;
    }
}


export function isCardExpired(paymentMethod) {
    // Extract the card's expiration month and year
    const { exp_month, exp_year } = paymentMethod.card;

    // Get the current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Month is zero-based, so we add 1

    // Check if the card has expired
    if (exp_year < currentYear || (exp_year === currentYear && exp_month < currentMonth)) {
        return true;
    }

    return false;
}

export async function validateAndCapturePaymentIntent(req, res, ui, payment_intent_id) {
    const paymentIntent = await stripe(ui).paymentIntents.retrieve(payment_intent_id, { expand: ['payment_method'] });
    if (paymentIntent?.status != "requires_capture") {
        res.send({ status: "InvalidPaymentIntent" });
        return;
    }
    let paymentMethod = paymentIntent.payment_method;
    if (!ui.groups?.includes("stripe-test")) {
        if (paymentMethod.type == "card") {
            if (!(await fingerPrintCheck(res, ui, paymentMethod))) {
                return;
            }
        }
    }
    // Finger print check done
    await stripe(ui).paymentMethods.update(paymentMethod.id, { metadata: { notYetFingerprintChecked: null } });

    // Set Default Payment Method
    await stripe(ui).customers.update(ui.stripecustomerid, {
        invoice_settings: {
            default_payment_method: paymentMethod.id
        }
    })

    // Remove old payment methods
    removeOldPaymentMethods(ui, paymentMethod);

    // Capture Payment
    const result = await stripe(ui).paymentIntents.capture(paymentIntent.id);
    // DO NOT DO ANYTHING AFTER THIS CAPTURE THAT MIGHT THROW

    if (result.status === 'succeeded') {
        return true;
    } else {
        console.log(result.status);
        res.status(400).send({ status: 'InvalidPaymentIntent' });
        return false;
    }
}

export async function validateSetupIntent(req, res, ui, seti) {
    const setupIntent = await stripe(ui).setupIntents.retrieve(seti, { expand: ['payment_method', 'latest_attempt'] });
    if (setupIntent?.status != "succeeded") {
        res.send({ status: "IncompleteSeti" });
        return;
    }
    let paymentMethod = setupIntent.payment_method;
    if (!ui.groups?.includes("stripe-test")) {
        if (paymentMethod.type == "card") {
            if (!(await fingerPrintCheck(res, ui, paymentMethod))) {
                return;
            }
        }
    }
    if (paymentMethod.type == "card") {
        if (!(await _101Check(res, ui, paymentMethod, seti))) {
            return;
        }
    }
    await stripe(ui).setupIntents.update(seti, { metadata: { notYetFingerprintChecked: null } });
    await stripe(ui).customers.update(ui.stripecustomerid, {
        invoice_settings: {
            default_payment_method: paymentMethod.id
        }
    })
    // XXX This is not working for some reason
    removeOldPaymentMethods(ui, paymentMethod);
    return true;
}

async function removeOldPaymentMethods(ui, paymentMethod) {
    try {
        // XXX Type alipay, paypal, etc
        const customer = await stripe(ui).customers.retrieve(ui.stripecustomerid, { expand: ['default_source'] });

        // Remove old system card
        if (customer.default_source) {
            if (customer.default_source.id != paymentMethod.id) {
                await stripe(ui).customers.deleteSource(ui.stripecustomerid, customer.default_source.id);
            }
        }

        // Remove old payment methods
        const paymentMethods = await stripe(ui).paymentMethods.list({
            customer: ui.stripecustomerid,
            type: 'card',
        });
        for (const pm of paymentMethods.data) {
            if (pm.id != paymentMethod.id) {
                await stripe(ui).paymentMethods.detach(pm.id);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

// XXX closed licenses
export function validateBillingChanges(license, billing) {
    if (license.status === 'Lifetime')                        return false;
    if (!['monthly', 'yearly', 'lifetime'].includes(billing)) return false;

    if (license.closed) { return true; }
    if (license.status === 'Subscription' && !license.autorenew) { return true; } // Turning back on
    if (license.status === 'Subscription' && license.autorenew) {
        if (billing === license.billing) { return false; }
        return true;
    }
    return true;
}

export async function getReferralStats(userId) {
  const referralRows = await db('referrals')
    .select('state')
    .count('*')
    .where('referrer', userId)
    .groupBy('state');

  let used = 0;
  let pending = 0;
  let earned = 0;
  let claimed = 0;

  for (const row of referralRows) {
    switch (row.state) {
      case 'used':
        used += parseInt(row.count, 10);
        break;
      case 'canceled':
        used += parseInt(row.count, 10);
        break;
      case 'pending':
        pending += parseInt(row.count, 10);
        break;
      case 'earned':
        earned += parseInt(row.count, 10);
        break;
      case 'claimed':
        claimed += parseInt(row.count, 10);
        break;
    }
  }

  return {
    referrals_used:    used,
    referrals_pending: pending,
    referrals_earned:  earned,
    referrals_claimed: claimed,
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

async function queueEvent(d) {
  const req = {
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/120120068727/accounts-queue',
    MessageBody: JSON.stringify(d),
  };

  try {
    await sqs.send(new SendMessageCommand(req));
  } catch (e) {
    console.log({
        event: 'SQS error',
        error: e,
        req,
        d
    });
    return false;
  }
  return true;
}

const ResetPasswordResult = {
    NotFound:         'NotFound',
    NeedsToBeClaimed: 'NeedsToBeClaimed',
    InvalidPassword:  'InvalidPassword',
    UnexpectedError:  'UnexpectedError',
    Success:          'Success',
};

async function sendEmailAlert(opts) {
    try {
        await axios.post('https://commsbridge.roonlabs.net/e/trigger', opts);
    } catch (e) {
        console.log(e)
    }
}


export async function resetPassword1(email, from) {
    const code = uuidv4();
    email = email.toLowerCase();

    try {
        if (!isValidEmail(email)) return { status: ResetPasswordResult.NotFound };

        const { success, emailCleaned, emailKey } = genEmailKey(email);
        if (!success) return { status: ResetPasswordResult.NotFound };

        const [user] = (await db.raw("SELECT userid, email, claim_id, isfraud FROM users WHERE email_key = ?", [emailKey])).rows;
        if (user) {
            if (user.claim_id !== null) return { status: ResetPasswordResult.NeedsToBeClaimed };
            if (user.isfraud)           return { status: ResetPasswordResult.NotFound };
        }

        const updateResult = await db.raw("UPDATE users SET passwd_reset_code = ? WHERE email_key = ?", [code, emailKey]);
        if (updateResult.rowCount !== 1) return { status: ResetPasswordResult.NotFound };

        const reset_password_url = from === 'store'
            ? `https://store.roonlabs.com/login.php?action=change_password&code=${code}`
            : `https://account.roon.app/reset-password2?code=${code}`;

        await sendEmailAlert({
            comm_id:           '64a79a79-75bc-401a-a565-c1b8b332ee87',
            user_id:            user.userid,
            use_handlebars:     true,
            email:              user.email,
            reset_password_url,
        })

        return { status: ResetPasswordResult.Success };

    } catch (e) {
        console.error(e.toString());
        return { status: ResetPasswordResult.UnexpectedError };
    }
}

export async function resetPassword2(code, password, ip) {
    let email = null;

    const trx = await db.transaction();
    try {
        if (!isValidPassword(password)) throw ResetPasswordResult.InvalidPassword;
        const [user] = (await trx.raw("SELECT email, userid, claim_id FROM users WHERE passwd_reset_code = ?", [code])).rows;

        if (!user) throw ResetPasswordResult.NotFound;

        email = user.email.trim();
        const userId = user.userid;
        if (user.claim_id !== null) throw ResetPasswordResult.NeedsToBeClaimed;

        await trx.raw("DELETE FROM tokens WHERE userid = ?", [userId]);
        await trx.raw("DELETE FROM token_info WHERE userid = ?", [userId]);

        const salt           = await bcrypt.genSalt(11, 'a');
        const hashedPassword = await bcrypt.hash(password, salt);
        const updatedUser    = await trx.raw("UPDATE users SET passwd = ?, passwd_reset_code = null WHERE passwd_reset_code = ?", [hashedPassword, code]);

        if (updatedUser.rowCount !== 1) throw ResetPasswordResult.UnexpectedError;

        await trx.commit();

        const event = {
            type: 'account.changed',
            user_ids: [`roon:${userId.toString()}`],
            properties: { 'newpassword:BOOLEAN': true },
        };

        queueEvent(event);
        await sendEmailAlert({
            comm_id:           '5cff79ff-0eeb-45df-ac31-eb2e37f825e7',
            user_id:            user.userid,
            use_handlebars:     true,
            email:              user.email,
            device_location:    ip, // XXX Actual location? XXX Commsbridge move link detection AFTER handlebars
            reset_password_url: 'https://account.roon.app/reset-password?email=' + encodeURIComponent(user.email),
        })

        return { status: ResetPasswordResult.Success };
    } catch (e) {
        await trx.rollback();
        console.log(e);
        if (ResetPasswordResult[e]) return { status: e };
        return { status: ResetPasswordResult.UnexpectedError };
    }
}

export async function resetEmail2(email, code, ip) {
    const trx = await db.transaction();
    try {
        if (!isValidEmail(email)) throw 'InvalidEmail';

        let oldemail;
        let stripecustomerid;
        let bigcommercecustomerid;
        const groups = [];

        // Get email for return and userid to delete tokens
        const userInfo = await trx('users')
            .where('passwd_reset_code', code)
            .select(
                'email',
                'userid',
                'claim_id',
                'groups',
                'stripecustomerid',
                'bigcommercecustomerid'
            )
            .first();

        if (!userInfo) throw 'NotFound';
        oldemail = userInfo.email.trim();
        const { userid, claim_id, groups: dbGroups } = userInfo;
        if (claim_id !== null) throw 'NeedsToBeClaimed';
        if (dbGroups) groups.push(...(dbGroups || []));

        stripecustomerid      = userInfo.stripecustomerid;
        bigcommercecustomerid = userInfo.bigcommercecustomerid;

        // Kill all tokens due to email change
        await trx('tokens').where('userid', userid).del();
        await trx('token_info').where('userid', userid).del();

        const { emailCleaned: email_cleaned, emailKey: email_key } = genEmailKey(email);
        if (!email_cleaned || !email_key) throw 'InvalidEmail';

        // Reset the email
        const updatedRows = await trx('users')
            .where('passwd_reset_code', code)
            .returning('*')
            .update({
                email_key,
                email: email_cleaned,
                log: db.raw("log || '\n' || ?", [LogMessage(`edit: email reset ${oldemail} -> ${email_cleaned}`)]),
                passwd_reset_code: null,
            });

        if (updatedRows.length !== 1) throw 'UnexpectedError';

        await trx.commit();

        const userids = ['roon:' + userid.toString()];
        if (bigcommercecustomerid !== null) {
            if (groups.includes('bigcommerce-test')) {
                userids.push('bigcommerce-test:' + bigcommercecustomerid);
            } else {
                userids.push('bigcommerce:' + bigcommercecustomerid);
            }
        }
        if (stripecustomerid !== null) {
            if (groups.includes('stripe-test')) {
                userids.push('stripe-test:' + stripecustomerid);
            } else {
                userids.push('stripe:' + stripecustomerid);
            }
        }

        const event = {
            type: 'account.changed',
            user_ids: userids,
            properties: { 'email:STRING': email_cleaned },
        };

        //
        // Await delivery of this event, commsbridge listens to these to update its redis
        // where it pulls user email from.
        //
        await queueEvent(event);

        const user = updatedRows[0];

        await sendemail(
            'roon-security-alert-email-change',
            oldemail,
            user.firstname,
            user.lastname,
            {
                'EMAIL': email_cleaned,
                'DEVICE_LOCATION': ip
            }
        );

        // Should hopefully have propagated change through at this point.
        await sendEmailAlert({
            comm_id:           'ce68d134-4e97-401a-aaa8-0ead6e92d06a',
            user_id:            user.userid,
            use_handlebars:     true,
            email:              user.email,
            device_location:    ip,
        })


        return  { status: 'Success' }
    } catch (e) {
        await trx.rollback();
        if (e.code === '23505') {
            if (e.constraint === 'users_email_key' || e.constraint === 'users_email_key2') return { status: 'EmailExists' };
        }
        if (typeof e === 'string') return { status: e };
        return { status: 'UnexpectedError' };
    }
}

export async function resetEmail1(email) {
    const code = uuidv4();
    email = email.toLowerCase();
    try {
        if (!isValidEmail(email)) throw 'NotFound';

        const { emailCleaned: email_cleaned, emailKey: email_key } = genEmailKey(email);
        if (!email_cleaned || !email_key) throw 'NotFound';

        const userInfo = await db('users')
            .where('email_key', email_key)
            .select('claim_id', 'isfraud')
            .first();

        if (!userInfo) throw 'NotFound';
        const { claim_id, isfraud } = userInfo;

        if (claim_id !== null) throw 'NeedsToBeClaimed';
        if (isfraud !== null && isfraud) throw 'NotFound';

        const updatedRows = await db('users')
            .where('email_key', email_key)
            .returning('*')
            .update({ passwd_reset_code: code });

        if (updatedRows.length !== 1) throw 'NotFound';

        const user = updatedRows[0];

        await sendEmailAlert({
            comm_id:           '2dc18a95-1dc1-44ed-94b1-6d04672f3b28',
            user_id:            user.userid,
            use_handlebars:     true,
            email:              user.email,
            reset_email_url:    'https://account.roon.app/reset-email2?code=' + code,
        })

        return { status: 'Success' };
    } catch (e) {
        console.error(e);
        if (typeof e === 'string') return { status: e };
        return { status: 'UnexpectedError' };
    }
}

async function sendemail(which, email, fname, lname, data) {
    var body = {
        from_name:  "Roon Labs",
        from_email: "contact@roonlabs.com",
        to_name:    fname + " " + lname,
        to_email:   email,
        args:       {
            "FIRSTNAME": fname,
            "FNAME":     fname,
            ...data,
        }
    };
    body.template = which;
    try {
        await sqs.send(new SendMessageCommand({
            QueueUrl: "https://sqs.us-east-1.amazonaws.com/120120068727/emails-to-send",
            MessageBody: JSON.stringify(body)
        }));
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

function isValidName(name) {
    name = name?.trim();
    return name && name.length > 0 && name.length < 256;
}

export async function createUser(req, {
  recaptcha,
  firstname,
  lastname,
  email,
  password,
  source,
  phone,
  allowpushnotifications,
  birthdate,
  sendemail,
  referralcode,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content
}) {
  try {
    if (!isValidName(firstname))    return { status: "InvalidName" };
    if (!isValidName(lastname))     return { status: "InvalidName" };
    if (!isValidEmail(email))       return { status: "InvalidEmail" };
    if (!isValidPassword(password)) return { status: "InvalidPassword" };

    const { status, userid, roonLI } = await _createUser(req, {
      firstname,
      lastname,
      email,
      password,
      source,
      phone,
      uclass: "Normal",
      allowpushnotifications,
      birthdate,
      referralcode,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content
    });

    if (status !== "Success") {
      return { status };
    }

    const event = {
        type: 'account.changed',
        user_ids: [`roon:${userid.toString()}`],
        properties: { 'newpassword:BOOLEAN': true, 'email:STRING': email, 'firstname:STRING': firstname, 'lastname:STRING': lastname },
    };

    // Await to avoid race with send email
    await queueEvent(event);

    // Email with commsbridge
    setTimeout(() => {
        sendEmailAlert({comm_id: '75f38b55-da23-499c-b826-d832d99c295c', use_handlebars: true, user_id: userid });
    }, 10000)

    return { status: "Success", userid , roonLI };
  } catch (e) {
    if (e instanceof PostgresError && e.code === "23505") {
      if (e.constraint === "users_email_key" || e.constraint === "users_email_key_idx") {
        return { status: "EmailExists" };
      }
    }
    console.error(e);
    return { status: "UnexpectedError" };
  }
}

function getReferralCode() {
  let newReferralCode;
  do {
    const uuid = uuidv4();
    const base64Uuid = Buffer.from(uuid, 'hex').toString('base64');
    newReferralCode = base64Uuid.substring(0, 22);
  } while (newReferralCode.includes('+') || newReferralCode.includes('/'));
  return newReferralCode;
}

async function canRefer(db, groups, referrer) {
  if (groups.includes('staff') || groups.includes('can-refer')) {
    return true;
  }

  const count = await db('users')
    .leftJoin('companyaccounts', 'users.userid', 'companyaccounts.userid')
    .leftJoin('companies', 'companyaccounts.companyid', 'companies.companyid')
    .where({ 'users.userid': referrer.userid})
    .whereIn('companies.class', ['Dealer', 'Distributor'])
    .count('* as count')
    .first();

  if (count.count > 0) {
    return true;
  }

  const licenses = await db('licenses')
    .select('paymentid')
    .where({ userid: referrer.userid, closed: null })
    .whereNot({ status: 'Trial' })
    .whereNotNull('paymentid');

  for (const license of licenses) {
    const paymentId      = license.paymentid;
    const payment        = await stripe(referrer).charges.retrieve(paymentId);
    const amountRefunded = payment.amount_refunded;
    const amount         = payment.amount;

    if ((amountRefunded === null || amountRefunded === 0) && amount > 0) {
      return true;
    }
  }

  return false;
}


async function _createUser(req, {
  firstname,
  lastname,
  email,
  password,
  source,
  phone,
  uclass,
  allowpushnotifications,
  birthdate,
  referralcode,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content
}) {
    let outuserid = null;

    try {
        const { emailCleaned: validatedEmail, emailKey } = genEmailKey(email);
        if (!validatedEmail) {
            return { status: "InvalidEmail" };
        }

        let userid = uuidv4();
        let newreferralcode = getReferralCode();

        let fields =
            "userid, email, email_key, referralcode, passwd, firstname, lastname, allowpushnotifications, notes, log, class, utm_source, utm_medium, utm_campaign, utm_term, utm_content, joinmailinglist";
        let values =
            ":userid, :email, :email_key, :referralcode, :password, :firstname, :lastname, :allowpushnotifications, :notes, :log, :class::userclass_type, :utm_source, :utm_medium, :utm_campaign, :utm_term, :utm_content, true";

        if (phone !== null) {
            fields += ",phone";
            values += ", :phone";
        }
        if (source !== null) {
            fields += ",source";
            values += ", :source";
        }
        while (true) {
            const txn = await db.transaction();
            try {
                let referrer = null;

                if (referralcode) {
                    const result = await txn.raw("SELECT firstname, userid, groups FROM users WHERE referralcode = ?", [referralcode]);
                    if (result.rowCount === 0) {
                        await txn.commit();
                        return { status: "ReferralNotFound" };
                    }

                    const row = result.rows[0];
                    referrer = row.userid;
                    const groups = row.groups || [];

                    if (!await canRefer(txn, groups, row)) {
                        await txn.commit();
                        return { status: "ReferralNotEligible" };
                    }
                }

                /* XXX Set user currency based on ip during registration
                const country_iso   = (await axios(`http://geoip-api.roon.prd-roonlabs-1.prd.roonlabs.internal/geoip/1/lookup?ip=${user_ip}`)).data.country_iso;
                const user_currency = pricingUtils.countryToCurrency(country_iso);
                */

                const [user] = (await txn.raw(
                    `INSERT INTO users (${fields}) VALUES(${values}) RETURNING *`,
                    {
                        userid,
                        firstname,
                        lastname,
                        allowpushnotifications,

                        email:        validatedEmail,
                        email_key:    emailKey,
                        referralcode: newreferralcode,
                        password:     await bcrypt.hash(password, await bcrypt.genSalt()),
                        notes:        "",
                        class:        uclass,
                        log:          LogMessage("created"),
                        phone:        phone || '',
                        source:       source || '',
                        // currency:     user_currency, // XXX

                        utm_source:   utm_source   ?? null,
                        utm_medium:   utm_medium   ?? null,
                        utm_campaign: utm_campaign ?? null,
                        utm_term:     utm_term     ?? null,
                        utm_content:  utm_content  ?? null,
                    }
                )).rows;

                if (referrer) {
                    await txn.raw(
                        "INSERT INTO referrals (referee, referrer, state, notes) VALUES(?, ?, 'used', '')",
                        [userid, referrer]
                    );
                }

                if (birthdate) {
                    await txn.raw(
                        "INSERT INTO profiles (profileid, userid, name, birthdate) VALUES(?, ?, ?, ?)",
                        [uuidv4(), userid, firstname, birthdate]
                    );
                }
                const session_token = uuidv4(), logout_token = uuidv4(), access_token = uuidv4();
                const [token]       = (await txn.raw(`
                    INSERT INTO tokens (tokenid, userid, expiration) VALUES (:access_token, :userid, now() + interval '1000 year');
                `,{ access_token, userid: user.userid })).rows;

                const { os, browser } = authUtils.getUAInfo(req.get('User-Agent'));
                await txn.raw(`
                        INSERT INTO token_info (
                            session_token,
                            logout_token,
                            tokenid,
                            userid,
                            ip,
                            location,
                            appid,
                            appname,
                            os,
                            browser
                        ) VALUES (
                            :session_token,
                            :logout_token,
                            :access_token,
                            :userid,
                            :ip,
                            :location,
                            :appid,
                            :appname,
                            :os,
                            :browser
                        );
                    `, {
                        session_token,
                        logout_token,
                        access_token,
                        userid:    user.userid,
                        ip:       requestIp.getClientIp(req),
                        location: await authUtils.getLocation(requestIp.getClientIp(req)),
                        appid:    ACCOUNT_APP_ID,
                        appname: 'Roon Account',
                        os,
                        browser,
                    });

                const roonLI = {
                    v:            LOGIN_COOKIE_VERSION,
                    userid:       userid,
                    session:      session_token,
                    groups:       [],
                    access_token,
                    logout_token,
                };
                await txn.commit();
                return { status: "Success", userid: user.userid, roonLI };
            } catch (e) {
                await txn.rollback();

                if (e.constraint === "users_email_key" || e.constraint === "users_email_key2") {
                    return { status: "EmailExists" };
                }

                if (e.constraint === "users_pkey") {
                    userid = uuidv4();
                    continue;
                }

                if (e.constraint === "referralcode_idx") {
                    newreferralcode = getReferralCode();
                    continue;
                }

                throw e;
            }
        }
         // Never reach here
    } catch (e) {
        console.error(e);
        return { status: "UnexpectedError" };
    }
}

export async function getSpecial(userid, txn) {
    if (!txn) txn = db;

    // Cannot have expired
    // Cannot have been used
    // Cannot have been expired by another special

    return (await txn.raw(`
        SELECT * FROM user_specials
        WHERE
            userid = :userid
        AND (expiration is null OR expiration > now())
        AND usedby IS NULL
        AND expired_by_special IS NULL
    `,{userid})).rows[0];
}

export async function tryGetSpecialFromCode(req, code, return_license, opts) {
    try {
        const r = (await axios.get(`https://accounts5.roonlabs.com/accounts/5/webcouponinfo?`, {
            params: {
                recaptcha: 'SKIP',
                token: req.roonLI.access_token,
                code
            }
        }));
        const {
            special: specialValue,
            situation,
            status,
        } = r.data;

        if (status !== 'Success')      return null;
        if (situation !== 'CanRedeem') return null;

        const license      = await tryGetLicenseForSpecial(req.ui, opts);
        const special      = { }
        special.code       = code;
        special.value      = specialValue;
        special.expiration = null;
        special.data       = await validateSpecial(req, special.value, special.expiration);

        // Not allowed right now
        if (special.data?.billing === 'trial') throw 'InvalidValue';

        if (return_license) special.license = license;
        return special;
    } catch (e) {
        console.log(e);
    }
}

// Return to UI
export async function tryGetSpecial(req, return_license = true, opts) {
    try {
        const license = await tryGetLicenseForSpecial(req.ui, opts);
        const special = await getSpecial(req.ui.userid);
        if (!special) return null;
        special.data = await validateSpecial(req, special.value, special.expiration);

        // For right now, we dont allow trials to be used if the user has an active subscription
        if (special.data?.billing === 'trial') {
            if (!license?.closed && license?.status === 'Subscription') {
                return null;
            }

            // Always extend trial, no payment method required
            if (license?.status === 'Trial') {
                special.data.extend_trial = true;
            }
        }

        if (return_license) special.license = license;
        return special;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export async function validateSpecial(req, value, expiration) {
    if (typeof value !== 'string') {
        throw 'InvalidValue';
    }
    // [BILLING]-[PERCENTOFF]-[MONTHS?]
    // trial-[DAYS]

    const parts = value.split('-');

    if (parts.length < 1) throw 'InvalidValue';
    
    const parseMonths = m => {
        m = m.split('MONTHS')[0];
        m = parseInt(m);
        if (isNaN(m)) throw 'InvalidValue';
        if (m <= 0) throw 'InvalidValue';
        return m;
    }

    const parseDays = d => {
        d = d.split('DAYS')[0];
        d = parseInt(d);
        if (isNaN(d)) throw 'InvalidValue';
        if (d <= 0) throw 'InvalidValue';
        return d;
    }

    const parsePercentoff = p => {
        p = p.split('PCT')[0];
        p = parseInt(p);
        if (isNaN(p)) throw 'InvalidValue';
        if (p > 100)  throw 'InvalidValue';
        if (p < 0)    throw 'InvalidValue';
        return p;
    }

    const parseBilling = b => {
        if (['yearly','monthly','lifetime','trial'].indexOf(b) === -1) {
            throw 'InvalidValue';
        }
        return b;
    }

    const billing = parseBilling(parts[0]);
    if (billing === 'trial') {
        const days = parts[1] != undefined ? parseDays(parts[1]) : null;
        if (!days) throw 'InvalidValue';
        const pricingModel = await pricingUtils.pricing(req);
        return {
            value,
            billing,
            days,
            price: 0,
            pricing: {
                currency: pricingModel.currency,
                sign:     pricingModel.sign,
                amount: {
                    value:    0,
                    display:  pricingUtils.display(0, pricingModel.currency),
                },
                zero: {
                    value:    0,
                    display:  pricingUtils.display(0, pricingModel.currency),
                }
            }
        }
    } else {
        const percentoff    = parsePercentoff(parts[1]);
        const pctmultiplier = (1 - (percentoff / 100));
        const months        = parts[2] != undefined ? parseMonths(parts[2]) : null;

        if (months && billing == 'lifetime') throw 'InvalidValue';

        const pricingModel  = await pricingUtils.pricing(req);
        const LifetimePrice = pricingModel.lifetime.value;
        const YearlyPrice   = pricingModel.annual.value;
        const MonthlyPrice  = pricingModel.monthly.value;

        let price, discount, original;
        switch (billing) {
            case 'lifetime':
                price    = LifetimePrice * pctmultiplier;
                discount = LifetimePrice - price;
                original = LifetimePrice;
                break;
            case 'yearly':
                if (months) {
                    throw 'InvalidValue';
                } else {
                    price    = YearlyPrice * pctmultiplier;
                    discount = YearlyPrice - price;
                    original = YearlyPrice;
                }
                break;
            case 'monthly':
                if (months) {
                    price    = MonthlyPrice * months * pctmultiplier;
                    discount = MonthlyPrice * months - price;
                    original = MonthlyPrice * months;
                } else {
                    price    = MonthlyPrice * pctmultiplier;
                    discount = MonthlyPrice - price;
                    original = MonthlyPrice;
                }
                break;
        }

        // Working lowest possible unit of currency, so round to nearest unit
        price = Math.round(price);

        return {
            value,
            billing,
            percentoff,
            months,
            price,
            discount,
            original,

            // new pricing stuff for supporting multiple currencies
            pricing: {
                currency: pricingModel.currency,
                sign:     pricingModel.sign,
                amount: {
                    value:    price,
                    display:  pricingUtils.display(price, pricingModel.currency),
                },
                original: {
                    value:    original,
                    display:  pricingUtils.display(original, pricingModel.currency),
                },
                discount: {
                    value:    discount,
                    display:  pricingUtils.display(discount, pricingModel.currency),
                },
                zero: {
                    value:    0,
                    display:  pricingUtils.display(0, pricingModel.currency),
                }
            }
        }
    }
}

export async function tryGetLicenseForSpecial(ui, { needsPaymentMethod, needsRefundAmount } = {}) {
    const licenses = (await db.raw(`
    SELECT
        l.licenseid,
        l.billing,
        l.autorenew,
        l.closed,
        l.expiration,
        l.trialexpiration,
        l.status,
        l.licensetype,
        l.paymentid,
        l.created,
        ((CURRENT_TIMESTAMP - u.created) < interval '30 days') as iswithin30days,
        json_build_object(
            'userid',    u.userid,
            'email',     u.email,
            'firstname', u.firstname,
            'lastname',  u.lastname
        ) as user
    FROM licenses l
    LEFT JOIN users u using(userid)
    WHERE userid = :userid
    AND (closed IS NULL OR closed >= (NOW() - interval '90 days'))
    ORDER BY closed DESC NULLS FIRST, created DESC;
    `,{userid: ui.userid})).rows;

    let open   = 0;
    let closed = 0;
    for (let lic of licenses) {
        if (lic.closed && lic.closereason !== 'PastDue') {
            closed++;
        } else {
            open++;
        }
    }

    let lics = licenses;
    if (closed === 0)    lics = lics;
    else if (open === 0) lics = lics.slice(0, 1);
    else                 lics = lics.filter(lic => !lic.closed);

    // Not eligible for specials with multiple open licenses
    if (lics.length > 1)   throw 'MultipleOpenLicenses';

    // Null is OK, just means no licenses
    if (lics.length === 0) return null;

    const lic = lics[0];

    // Not eligible for specials with lifetime licenses
    if (lic.status === 'Lifetime') throw 'LifetimeLicense';

    if (ui.stripecustomerid) {
        if (needsRefundAmount)
            lic.willrefundonlifetime  = await willRefundOnLifetime(stripe(ui), lic)
        if (needsPaymentMethod)
            lic.existingPaymentMethod = await getLatestPaymentMethod(ui);
    }
    delete lic.paymentid;
    return lic;
}






