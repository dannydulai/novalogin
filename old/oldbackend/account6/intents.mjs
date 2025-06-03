
import { v4 as uuidv4 } from 'uuid';
import * as Taxes from './taxes.mjs';
import * as pricingUtils from './pricing.mjs';
import axios     from 'axios';
import requestIp from 'request-ip';
import {
    stripe,
    stripePk,
    getOrCreateStripeCustomer,
    tryGetSpecial,
    tryGetSpecialFromCode,
    createPaymentIntent,
    canTrial,
    getLicenseForChangeBilling,
    validateBillingChanges,
} from './utils.mjs';

/*
 *
 * info : {
 *    action:          string,
 *    currency:        string,
 *    billingAddress:  object,
 *    shippingAddress: object,
 *    paymentMethod:   string,
 *    metadata:        object
 * }
 *
 * Returns:
 * {
 *     status: 'Success' | string,
 *     secret?: string
 * }
 *
 */

const validPaymentMethods = new Set([
    'card',
    'klarna',
]);

export async function createIntent(req, info) {

    if (info.paymentMethod) {
        if (!validPaymentMethods.has(info.paymentMethod)) {
            return {status: 'InvalidOperation'};
        }
    }

    if (info.action === 'change_billing') {
        return await createChangeBillingIntent(req, info);
    } else if (info.action === 'start_trial') {
        return await createStartTrialIntent(req, info);
    } else if (info.action === 'claim_special') {
        if (info.metadata?.special_id) {
            return await createClaimSpecialIntent(req, info);
        } else if (info.metadata?.code) {
            return await createClaimSpecialCodeIntent(req, info);
        } else {
            throw 'InvalidOperation';
        }
    } else if (info.action === 'update_payment_method') {
        return await createUpdatePaymentMethodIntent(req, info);
    } else if (info.action === 'store_checkout') {
        return await createStoreCheckoutIntent(req, info);
    } else if (info.action === 'black_friday_2024') {
        return await createBlackFriday2024Intent(req, info);
    } else if (info.action === 'cyber_monday_2024') {
        return await createCyberMonday2024Intent(req, info);
    } else {
        throw 'InvalidOperation';
    }
}

async function createCyberMonday2024Intent(req, info) {
    try {
        const { ui } = req;

        if (!await canTrial(ui.userid)) {
            return { status: "NotEligibleForTrial" };
        }

        const {
            paymentMethod,
        } = info;

        const utm_source   = info.metadata.utm_source;
        const utm_medium   = info.metadata.utm_medium;
        const utm_campaign = info.metadata.utm_campaign;
        const utm_term     = info.metadata.utm_term;
        const utm_content  = info.metadata.utm_content;
        const referralcode = info.metadata.r; // referralcode

        if (paymentMethod === 'klarna') {
            const ip     = requestIp.getClientIp(req);
            const geoip  = (await axios.get(`https://geoip.roonlabs.net/geoip/1/lookup`, { params: { ip } })).data;
            if (!geoip.country_iso) {
                console.log('Unable to determine country for IP', ip);
                return { status: 'UnexpectedError' };
            }
            const pmt = await stripe(ui).paymentIntents.create({
                amount:   1499,
                customer: ui.stripecustomerid,
                currency: 'usd',
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
                    userid: ui.userid,
                    src:     'accountpage:2024_cyber_monday_deal',
                    purpose: '2024_cyber_monday_deal',
                    SKU:     'ROONSUB-MONTHLY-3M',
                    receiptline: 'Roon Cyber Monday Deal',
                    paymentMethodType: 'klarna',
                    subscriptionStartInfo: JSON.stringify({
                        billing: 'yearly',
                        utm_source,
                        utm_medium,
                        utm_campaign,
                        utm_term,
                        utm_content,
                        referralcode,
                    })
                }
            })

            return {status: 'Success', secret: pmt.client_secret};

        } else {
            const pmt = await stripe(ui).paymentIntents.create({
                amount:   1499,
                customer: ui.stripecustomerid,
                confirm:  false,
                currency: 'usd',
                capture_method: 'manual',
                setup_future_usage: 'off_session',
                metadata: {
                    userid: ui.userid,
                    src:     'accountpage:2024_cyber_monday_deal',
                    purpose: '2024_cyber_monday_deal',
                    SKU:     'ROONSUB-MONTHLY-3M',
                    receiptline: 'Roon Cyber Monday Deal',
                    subscriptionStartInfo: JSON.stringify({
                        billing: 'yearly',
                        utm_source,
                        utm_medium,
                        utm_campaign,
                        utm_term,
                        utm_content,
                        referralcode,
                    })
                }
            })

            return {status: 'Success', secret: pmt.client_secret};
        }

    } catch (e) {
        console.log(e);
        return {status: 'UnexpectedError'};
    }
}

async function createBlackFriday2024Intent(req, info) {
    try {
        const { ui } = req;

        if (!await canTrial(ui.userid)) {
            return { status: "NotEligibleForTrial" };
        }

        const {
            paymentMethod,
        } = info;

        const utm_source   = info.metadata.utm_source;
        const utm_medium   = info.metadata.utm_medium;
        const utm_campaign = info.metadata.utm_campaign;
        const utm_term     = info.metadata.utm_term;
        const utm_content  = info.metadata.utm_content;
        const referralcode = info.metadata.r; // referralcode

        if (paymentMethod === 'klarna') {
            const ip     = requestIp.getClientIp(req);
            const geoip  = (await axios.get(`https://geoip.roonlabs.net/geoip/1/lookup`, { params: { ip } })).data;
            if (!geoip.country_iso) {
                console.log('Unable to determine country for IP', ip);
                return { status: 'UnexpectedError' };
            }
            const pmt = await stripe(ui).paymentIntents.create({
                amount:   1499,
                customer: ui.stripecustomerid,
                currency: 'usd',
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
                    userid: ui.userid,
                    src:     'accountpage:2024_black_friday_deal',
                    purpose: '2024_black_friday_deal',
                    SKU:     'ROONSUB-MONTHLY-3M',
                    receiptline: 'Roon Black Friday Deal',
                    paymentMethodType: 'klarna',
                    subscriptionStartInfo: JSON.stringify({
                        billing: 'yearly',
                        utm_source,
                        utm_medium,
                        utm_campaign,
                        utm_term,
                        utm_content,
                        referralcode,
                    })
                }
            })

            return {status: 'Success', secret: pmt.client_secret};

        } else {
            const pmt = await stripe(ui).paymentIntents.create({
                amount:   1499,
                customer: ui.stripecustomerid,
                confirm:  false,
                currency: 'usd',
                capture_method: 'manual',
                setup_future_usage: 'off_session',
                metadata: {
                    userid: ui.userid,
                    src:     'accountpage:2024_black_friday_deal',
                    purpose: '2024_black_friday_deal',
                    SKU:     'ROONSUB-MONTHLY-3M',
                    receiptline: 'Roon Black Friday Deal',
                    subscriptionStartInfo: JSON.stringify({
                        billing: 'yearly',
                        utm_source,
                        utm_medium,
                        utm_campaign,
                        utm_term,
                        utm_content,
                        referralcode,
                    })
                }
            })

            return {status: 'Success', secret: pmt.client_secret};
        }

    } catch (e) {
        console.log(e);
        return {status: 'UnexpectedError'};
    }
}

async function createStoreCheckoutIntent(req, info) {
    try {
        const { ui } = req;

        // Currency, shipping option, cart items validated by store-backend, since it proxies this request to here.
        const {
            cart,            // { sku, qty, price, shipping, tax }
            shippingAddress, // Needed for validating shipping options and taxes
            paymentMethod,   // card/wallet if null else (klarna, alipay, etc..)
            currency,
        } = info;

        // Users must request to change currency
        if ((ui.currency || 'usd') !== currency) {
            if (currency === 'usd') {
                // XXX Roon Store is only usd for now, so as long as currency === usd, we are good
            } else {
                return { status: 'InvalidOperation' };
            }
        }

        const metadata = {
            ...(info.metadata || {}), // Any additional metadata
            src:             'roon_store',
            userid:          ui.userid,
        }

        let salesTaxQuote = null;
        if (shippingAddress.country === 'US') {
            salesTaxQuote = await Taxes.getQuote(ui, shippingAddress, cart, currency);
        }

        let i = 1;
        let amount = 0;
        for (let item of cart) {

            let tax = 0;
            if (salesTaxQuote) {
                if (salesTaxQuote.lines[item.sku]) {
                    tax = salesTaxQuote.lines[item.sku];
                }
            }

            // SKU,QTY,PRICE,SHIPPING,TAX
            metadata[`INV-L${i}`] = `${item.sku || 'MISSING_SKU'},${item.qty || 0},${item.price || 0},${item.shipping || 0},${tax || 0}`;
            const totalPrice = (item.price * item.qty) + item.shipping + tax;
            amount += totalPrice;
            i++;
        }

        let pmt;
        const shipping = {
            name:            shippingAddress.name,
            carrier:         shippingAddress.carrier,// XXX
            phone:           shippingAddress.phone,// XXX
            tracking_number: shippingAddress.tracking_number,// XXX
            address: {
                line1:       shippingAddress.line1,
                line2:       shippingAddress.line2,
                city:        shippingAddress.city,
                state:       shippingAddress.state,
                postal_code: shippingAddress.postal_code,
                country:     shippingAddress.country,
            }
        }
        if (paymentMethod === 'alipay') {
            throw 'InvalidOperation';
            pmt = await stripe(ui).paymentIntents.create({
                amount,
                customer: ui.stripecustomerid,
                currency,
                payment_method_types: ['alipay'],
                setup_future_usage: 'off_session',
                metadata: {
                    ...metadata,
                },
                shipping,
            })
        } else if (paymentMethod === 'klarna') {
            pmt = await stripe(ui).paymentIntents.create({
                amount,
                customer: ui.stripecustomerid,
                currency,
                payment_method_types: ['klarna'],
                payment_method_data: {
                    type: 'klarna',
                    billing_details: {
                        address: {
                            country: shippingAddress.country,
                        },
                        email: ui.email,
                    }
                },
                metadata: {
                    ...metadata,
                },
                shipping,
            })
        } else {
            // Fingerprint check done in webhook
            pmt = await stripe(ui).paymentIntents.create({
                amount,
                customer: ui.stripecustomerid,
                confirm:  false,
                currency,
                capture_method: 'manual',
                setup_future_usage: 'off_session',
                metadata: {
                    ...metadata,
                },
                shipping,
            })
        }
        return { status: 'Success', secret: pmt.client_secret };

    } catch (e) {
        console.log(e);
        return {status: 'UnexpectedError'};
    }
}

async function createUpdatePaymentMethodIntent(req, info) {
    try {
        const { ui } = req;
        const setupIntent = await stripe(ui).setupIntents.create({
            customer: ui.stripecustomerid,
            payment_method_types: ['card'],
            usage: 'off_session',
            metadata: {
                intentPurpose: "updatePaymentMethod",
                userid: ui.userid,
                notYetFingerprintChecked: true,
                v: '1',
            },
        });
        return { status: 'Success', secret: setupIntent.client_secret };
    } catch (error) {
        console.log(error);
        return { status: 'UnexpectedError' };
    }
}

async function createChangeBillingIntent(req, info) {
    try {
        const {
            new_billing,
            licenseid,
        } = info.metadata;

        if (!new_billing || !licenseid) {
            return {status: 'InvalidOperation'};
        }

        // lets get the license info and payment info because we may need to show "use existing card" option
        const license = await getLicenseForChangeBilling(req.ui, licenseid, { needsRefundAmount: true, needsPaymentMethod: true });

        // Validate billing options
        if (!validateBillingChanges(license, new_billing)) {
            return {status: 'InvalidOperation'};
        }

        if (license.closed) {
            const pmt = await createPaymentIntent(req, req.ui, license, new_billing, 'accountpage:reviewplan', info.paymentMethod || null);
            return { status: 'Success', secret: pmt.client_secret };
        } else if (license.status == 'Subscription') {
            if (new_billing == 'lifetime') {
                const pmt = await createPaymentIntent(req, req.ui, license, new_billing, 'accountpage:reviewplan', info.paymentMethod || null);
                return { status: 'Success', secret: pmt.client_secret };
            } else {
                // Send a seti
                const setupIntent = await stripe(req.ui).setupIntents.create({
                    customer: req.ui.stripecustomerid,
                    payment_method_types: ['card'],
                    usage: 'off_session',
                    metadata: {
                        v: '1',
                        intentPurpose: `changeBilling`,
                        licenseid:     license.licenseid,
                        licenseStatus: 'Subscription',
                        newBilling:    new_billing,
                        userid:        req.ui.userid,
                        notYetFingerprintChecked: true
                    },
                });
                return { status: 'Success', secret: setupIntent.client_secret };
            }

        } else if (license.status == 'Trial') {
            // Send a seti
            const setupIntent = await stripe(req.ui).setupIntents.create({
                customer: req.ui.stripecustomerid,
                payment_method_types: ['card'],
                usage: 'off_session',
                metadata: {
                    v: '1',
                    intentPurpose: `changeBilling`,
                    newBilling:    new_billing,
                    licenseStatus: 'Trial',
                    licenseid:     license.licenseid,
                    userid:        req.ui.userid,
                    notYetFingerprintChecked: true
                },
            });
            return { status: 'Success', secret: setupIntent.client_secret };
        } else {
            return {status: 'InvalidOperation'};
        }

    } catch (e) {
        console.log(e);
        return {status: 'UnexpectedError'};
    }
}

async function createStartTrialIntent(req, info) {
    try {
        const { ui } = req;

        if (!await canTrial(ui.userid)) return { status: "NotEligibleForTrial" };

        const billing      = info.metadata.billing;
        const utm_source   = info.metadata.utm_source;
        const utm_medium   = info.metadata.utm_medium;
        const utm_campaign = info.metadata.utm_campaign;
        const utm_term     = info.metadata.utm_term;
        const utm_content  = info.metadata.utm_content;
        const referralcode = info.metadata.r; // referralcode

        const setupIntent = await stripe(ui).setupIntents.create({
            customer: ui.stripecustomerid,
            payment_method_types: ['card'],
            usage: 'off_session',
            metadata: {
                intentPurpose: "trialStart",
                userid: ui.userid,
                notYetFingerprintChecked: true,
                v: '1',
                trialStartInfo: JSON.stringify({
                    billing,
                    utm_source,
                    utm_medium,
                    utm_campaign,
                    utm_term,
                    utm_content,
                    referralcode,
                })
            },
        });

        return { status: "Success", secret: setupIntent.client_secret };

    } catch (e) {
        console.log(e);

        return { status: "UnexpectedError" };
    }
}

async function createClaimSpecialCodeIntent(req, info) {
    try {
        const code    = info.metadata.code;
        const special = await tryGetSpecialFromCode(req, code, true, { needsPaymentMethod: true });
        if (!special) return {status: 'Ineligible'};

        if (special.price === 0) {
            // XXX NOT IMPLEMENTED
            return {status: 'InvalidOperation'};
        }

        // User could have no license, in this case they are still eligible for the special
        switch (special.data.billing) {
            case 'lifetime':
            case 'yearly':
            case 'monthly':
                // Update existing license
                const pmt = await createPaymentIntent(req, req.ui, special.license, special.data.billing, 'accountpage:claim_special', info.paymentMethod || null, special);
                return {status: 'Success', secret: pmt.client_secret};
                break;
            default:
                return {status: 'InvalidOperation'};
        }
    } catch (e) {
        console.log(e);
        return {status: 'UnexpectedError'};
    }
}

async function createClaimSpecialIntent(req, info) {
    try {

        const { special_id } = info.metadata;

        if (!special_id) return {status: 'InvalidOperation'};

        const special = await tryGetSpecial(req, true, { needsPaymentMethod: true });

        // Ensure special has not changed
        if (!special || special?.special_id != special_id) return {status: 'Ineligible'};

        if (special.price === 0) { return {status: 'InvalidOperation'}; }

        // User could have no license, in this case they are still eligible for the special
        switch (special.data.billing) {
            case 'lifetime':
            case 'yearly':
            case 'monthly':
                // XXX NOT IMPLEMENTED
                // license.can_pay_with_klarna = true;
                const pmt = await createPaymentIntent(req, req.ui, special.license, special.data.billing, 'accountpage:claim_special', info.paymentMethod || null, special);
                return { status: 'Success', secret: pmt.client_secret };
                break;
            case 'trial':
                if (special.license) {
                    throw 'Forbidden';
                } else {
                    const setupIntent = await stripe(req.ui).setupIntents.create({
                        customer: req.ui.stripecustomerid,
                        payment_method_types: ['card'],
                        usage: 'off_session',
                        metadata: {
                            intentPurpose: "trialStart",
                            userid: req.ui.userid,
                            notYetFingerprintChecked: true,
                            v: '1',
                            trialStartInfo: JSON.stringify({
                                billing: 'monthly',
                                expirationdays: special.data.days,
                                isSpecialOffer: 1,
                                specialId: special.special_id,
                            })
                        },
                    });
                    return { status: 'Success', secret: setupIntent.client_secret };
                }
                break;
            default:
                return {status: 'InvalidOperation'};
        }
    } catch (e) {
        console.log(e);
        return {status: 'UnexpectedError'};
    }
};



