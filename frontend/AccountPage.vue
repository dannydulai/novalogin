<widget>
{
    name: "AccountPage",
    tags: [ 'web', 'custom' ],
    description: "Users account page",
    properties: [
    ],
    strings: {
        reset_email_and_pwd: {
            value: 'Use the <a target="_blank" class="link" href="/reset-email?email=%EMAIL%">email reset</a> or <a target="_blank" class="link" href="/reset-password?email=%EMAIL%">password reset page</a> to continue.'
        },
        no_email_access: {
            value: 'If you do not have access to the email above, please <a class="link">contact us</a> to verify your identity and update your account.'
        },
        contact_us: { value: "Please <a>contact us</a>" },
        roon_account: { value: "%FIRSTNAME%'s Roon account" },
        no_roon_subscription: { value: "You don't have a Roon subscription" },
        start_a_free_trial: { value: "You can start a free trial to start enjoying Roon!" },
        start_free_trial: { value: "Start free trial" },
        roon_subscription_end: { value: "Your Roon %SUB% has ended" },
        roon_sub_ended_pastdue: { value: "Your %SUB% ended because we <b>couldn't process your payment</b>." },
        roon_trial_or_sub_ended: { value: "Your %SUB% ended." },
        license_disputed: { value: "There is a billing error with your account. You need to <a class='link' href='/contact'>contact us</a> to correct this error." },
        subscribe_again_to_enjoy: { value: "Please subscribe again to start enjoying Roon again!" },
        subscribe: { value: "Subscribe" },
        resubscribe: { value: "Resubscribe" },
        roon_subscription: { value: "Roon subscription" },
        lifetime_description: { value: "You have a lifetime subscription to Roon. Thanks and enjoy the music!" },
        free_roon_trial: { value: "Free Roon trial" },
        black_friday_2024_trial: { value: "Black Friday Roon Trial" },
        cyber_monday_2024_trial: { value: "Cyber Monday Roon Trial" },
        subscription_will_begin_on: { value: "On %DATE%, your Roon subscription will begin." },
        you_will_be_charged: { value: "You will be automatically charged %RATE% using the payment method on file" },
        your_cyber_monday_2024_trial_will_end_day: { value: "Your Cyber Monday trial will end in 1 day" },
        your_cyber_monday_2024_trial_will_end_days: { value: "Your Cyber Monday trial will end in %DAYS% days." },
        your_black_friday_2024_trial_will_end_day: { value: "Your Black Friday trial will end in 1 day" },
        your_black_friday_2024_trial_will_end_days: { value: "Your Black Friday trial will end in %DAYS% days." },
        your_free_trial_will_end_day: { value: "Your free trial will end in 1 day" },
        your_free_trial_will_end_days: { value: "Your free trial will end in %DAYS% days." },
        add_valid_payment_method_before: { value: "Please add a valid payment method before %DATE% to keep the music going." },
        add_billing_plan_before: { value: "Please add a billing plan before %DATE% to keep the music going." },
        manage_billing_plan: { value: "Manage billing plan" },
        select_billing_plan: { value: "Select billing plan" },
        add_payment_method: { value: "Add payment method" },
        complimentary_roon_subscription: { value: "Complimentary Roon subscription" },
        complimentary_description: { value: "Your complimentary subscription will autorenew on %DATE% if your account is in good standing." },
        subscription_will_renew_on: { value: "On %DATE%, your Roon subscription will renew." },
        subscription_will_end_on: { value: "On %DATE%, your Roon subscription will end and you will lose access to Roon." },
        need_other_sub_or_code: { value: "Do you need another subscription or want to buy a gift code?" },
        codes: { value: "Codes" },
        view_more: { value: "View more" },
        view_less: { value: "View less" },
        account_information: { value: "Account information" },
        multi_factor_auth: { value: "Multi-factor authentication" },
        enabled: { value: "Enabled" },
        disabled: { value: "Disabled" },
        change: { value: "change" },
        email_address: { value: "Email address" },
        first_name: { value: "First name" },
        last_name: { value: "Last name" },
        phone_number: { value: "Phone number" },
        change_email_and_pwd: { value: "Change email and password" },
        change_email_and_pwd_desc: { value: "In order to change the email address or password on your account, you must have access to the email address listed above." },
        edit_account_info: { value: "Change my account information" },
        payment_method: { value: "Payment method" },
        no_payment_method_on_file: { value: "No payment method on file" },
        card_ending_in: { value: "Card ending in %LAST4%, Exp %DATE%" },
        update_payment_method: { value: "Update payment method" },
        billing_history: { value: "Billing history" },
        store_billing_history: { value: "Store billing history" },
        add_payment_method: { value: "Add payment method" },
        connected_accounts: { value: "Connected accounts" },
        no_connected_accounts: { value: "No connected accounts" },
        connect_third_party: { value: "Connect third-party accounts" },
        roon_referral_program: { value: "Roon referral program" },
        share_your_love_of_music: { value: "Share your love of music by telling your friends about Roon, and giving them 30 free days of Roon!" },
        when_someone_signs_up: { value: "When someone signs up for Roon using your referral link, you <b>both</b> get 30 extra days added to your Roon subscriptions." },
        your_referral_link: { value: "YOUR REFERRAL LINK" },
        copy: { value: "Copy" },
        email: { value: "Email" },
        referral_link_has_been_copied: { value: "Referal link has been copied to clipboard!" },
        your_referrals: { value: "YOUR REFERRALS" },
        used: { value: "Used" },
        pending: { value: "Pending" },
        earned: { value: "Earned" },
        redeemed: { value: "Redeemed" },
        redeem_earned: { value: "REDEEM EARNED REFERRALS" },
        transfer_earned: { value: "TRANSFER EARNED REFERRALS TO DISTRIBUTOR" },
        referral_terms: { value: "Referral terms and conditions" },
        login_sessions: { value: "Login Sessions" },
        session: { value: "session" },
        sessions: { value: "sessions" },
        near: { value: "Near %LOCATION%" },
        your_current_session: { value: "Your current session" },
        sign_out: { value: "Sign out" },
    }
}
</widget>
<template>
    <div class="mainbody" :style="[ userid ? 'background-color: #ebffde;' : '']">
        <div style="text-align: center;" v-if="loading">
            <div class="box no-border" style="margin-top: 0; margin-bottom: 4rem; margin-left: 0; margin-right: 0; display: flex; flex-direction: column;">
                <h1 class="skeleton" style="width: 200px;"></h1>
                <p class="skeleton" style="width: 300px;"></p>
            </div>
            <div class="box" style="text-align: left;">
                <h2 class="skeleton" style="width: 50%;"></h2>
                <p class="skeleton"></p>
            </div>
            <div class="box" style="text-align: left;">
                <h2 class="skeleton" style="width: 50%;"></h2>
                <p class="skeleton"></p>
            </div>
            <div class="box" style="text-align: left;">
                <h2 class="skeleton" style="width: 50%;"></h2>
                <p class="skeleton"></p>
            </div>
        </div>
        <div class="" v-else-if="user">
            <div style="margin-bottom: 4rem; margin-top: 2rem; margin-left: 1rem; margin-right: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 class="" style="margin: 0; padding-bottom: 0; text-transform: none;" >
                        {{tstring('roon_account', { FIRSTNAME: user.firstname })}}
                    </h1>
                    <p class="email-label" style="margin-top: 0; color: rgb(var(--color-2-fg2));">{{user.email}}</p>

                </div>
            </div>
            <div v-if="user && user.special && user.special.data" class="box special">
                <div style="flex-wrap: wrap-reverse; display: flex; justify-content: space-between; align-items: center;">
                    <div class="user-special-header" style="text-transform: uppercase; font-size: 1.25rem;">
                        <span v-if="user.special.data.billing === 'trial'">
                            {{user.special.data.days}}-day free trial
                        </span>
                        <span v-else-if="user.special.data.billing === 'lifetime'">
                            {{user.special.data.percentoff}}% Off Lifetime subscription
                        </span>
                        <span v-else-if="user.special.data.billing === 'yearly'">
                            <span v-if="!user.special.data.months">
                                {{user.special.data.percentoff}}% Off One Year of Roon
                            </span>
                            <span v-else>
                                {{user.special.data.percentoff}}% Off {{user.special.data.months}} Months of Roon
                            </span>
                        </span>
                        <span v-else-if="user.special.data.billing === 'monthly'">
                            <span v-if="!user.special.data.months">
                                {{user.special.data.percentoff}}% Off One Month of Roon
                            </span>
                            <span v-else>
                                {{user.special.data.percentoff}}% Off {{user.special.data.months}} Months of Roon
                            </span>
                        </span>
                    </div>
                    <div style="
                        font-size: 0.875rem;
                        border-radius: 0.375rem;
                        padding-top: 0.25rem;
                        padding-bottom: 0.25rem; padding-left: 0.5rem; padding-right: 0.5rem; background-color: #DCFCE7;
                        color: #15803D; display: flex; justify-content: center; align-items: center; gap: 0.375rem; text-transform: uppercase;">
                        <span style="height: 0.375rem; width: 0.375rem; border-radius: 50%; background-color: #22c55e;"></span>
                        Special Offer
                    </div>
                </div>
                <div style="margin-top: 2rem; color: rgb(75 85 99);">
                    You have a special offer available for
                    <span v-if="user.special.data.billing === 'trial'">
                        a {{user.special.data.days}}-day trial of Roon!
                    </span>
                    <span v-else-if="user.special.data.billing === 'lifetime'">
                        {{user.special.data.percentoff}}% off  a lifetime subscription to Roon!
                    </span>
                    <span v-else-if="user.special.data.billing === 'yearly'">
                        <span v-if="!user.special.data.months">
                            {{user.special.data.percentoff}}% off a year of Roon!
                        </span>
                        <span v-else>
                            {{user.special.data.percentoff}}% off {{user.special.data.months}} months of Roon!
                        </span>
                    </span>
                    <span v-else-if="user.special.data.billing === 'monthly'">
                        <span v-if="!user.special.data.months">
                            {{user.special.data.percentoff}}% off a month of Roon!
                        </span>
                        <span v-else>
                            {{user.special.data.percentoff}}% off {{user.special.data.months}} months of Roon!
                        </span>
                    </span>
                </div>
                <div style="margin-top: 1.5rem; color: rgb(75 85 99);">
                    <span v-if="user.special.data.billing === 'trial'">
                        Claim this offer to start your free trial.
                    </span>
                    <span v-else-if="user.special.data.billing === 'lifetime'">
                        Pay <span style="text-decoration: line-through; color: #fa675d">{{specialPricing.original.display}}</span> {{specialPricing.amount.display}} today for lifetime access.
                    </span>
                    <span v-else-if="user.special.data.billing === 'yearly'">
                        <span v-if="!user.special.data.months">
                            Pay <span style="text-decoration: line-through; color: #fa675d">{{specialPricing.original.display}}</span> {{specialPricing.amount.display}} today for a year of access.
                        </span>
                        <span v-else>
                            Error: invalid code
                        </span>
                    </span>
                    <span v-else-if="user.special.data.billing === 'monthly'">
                        <span v-if="!user.special.data.months">
                            Pay <span style="text-decoration: line-through; color: #fa675d">{{specialPricing.original.display}}</span> {{specialPricing.amount.display}} today for a month of access.
                        </span>
                        <span v-else>
                            Pay <span style="text-decoration: line-through; color: #fa675d">{{specialPricing.original.display}}</span> {{specialPricing.amount.display}} today for {{user.special.data.months}} months of access.
                        </span>
                    </span>
                </div>
                <div v-if="user.special.expiration" style="margin-top: 1.5rem; font-style: italic; font-size: 0.75rem;">
                    <span v-if="daysuntil(user.special.expiration) > 7">
                    Offer expires {{datename(user.special.expiration)}}
                    </span>
                    <span v-else>
                    Offer expires {{expiressoon(user.special.expiration, currenttime)}}
                    </span>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button
                        @click="claimSpecialOffer(user.special)"
                        style="width: auto; font-weight: 600; border-radius: 0.375rem; background-color: rgb(var(--color-3-bg)); display: flex; justify-content: center; align-items: center;">
                        Claim Offer
                    </button>
                </div>
            </div>
            <div class="box" v-if="licenses.length === 0">
                <div class="license">
                    <div class="h1">
                        <pr-text path="t.no_roon_subscription"></pr-text>
                    </div>
                    <br />
                    <h5 class="event_description">
                        <pr-text path="t.start_a_free_trial"></pr-text>
                    </h5>
                    <div style="padding-top: 10px">
                        <!-- XXX Start Trial Widget -->
                        <a class="action" :href="href('/account/start-trial')">
                            <pr-text path="t.start_free_trial"></pr-text>
                        </a>
                    </div>
                </div>
            </div>
            <div class="box" v-for="lic in licenses">
                <div class="license">
                    <div v-if="lic.closed_date || lic.closed">
                        <div>
                            <div class="h1">
                                {{tstring('roon_subscription_end', { SUB: lic.trial_or_sub })}}
                            </div>
                            <br />
                        </div>
                        <div>
                            <h5>
                                <div v-if='lic.closereason == "PastDue"'
                                    v-html="tstring('roon_sub_ended_pastdue', { SUB: lic.trial_or_sub })"
                                    class="event_description">
                                </div>
                                <div v-else class="event_description">
                                    {{tstring('roon_trial_or_sub_ended', { SUB: lic.trial_or_sub })}}
                                </div>
                            </h5>
                        </div>
                        <div>
                            <div v-if="lic.closereason == 'Disputed'"
                                v-html="tstring('license_disputed')"
                                class="event_description">
                            </div>
                            <div v-else class="event_description">
                                <pr-text path="t.subscribe_again_to_enjoy"></pr-text>
                            </div>
                        </div>
                        <div v-if="lic.closereason !== 'Disputed'" style="padding-top: 10px">
                            <a class="action" v-if="lic.status == 'Trial'" :href="href(`/account/manage-billing?licenseid=${lic.licenseid}`)"><pr-text path="t.subscribe"></pr-text></a>
                            <a class="action" v-else :href="href(`/account/manage-billing?licenseid=${lic.licenseid}`)"><pr-text path="t.resubscribe"></pr-text></a>
                        </div>
                    </div>
                    <div v-else-if='lic.status == "Lifetime"'>
                        <div>
                            <div class="h1">
                                <pr-text path="t.roon_subscription"></pr-text>
                            </div>
                            <br>
                            <h5 class="event_description">
                                <pr-text path="t.lifetime_description"></pr-text>
                            </h5>
                        </div>
                    </div>
                    <div v-else-if='lic.status == "Trial"'>
                        <div>
                            <div class="h1">
                                <pr-text path="t.free_roon_trial"></pr-text>
                            </div>
                            <br />
                        </div>
                        <div v-if="lic.autorenew">
                            <h5>
                                <div v-if="user && user.pmt" class="event_description">
                                    {{tstring('subscription_will_begin_on', { DATE: date(lic.expiration_date) })}}
                                    <br>
                                    <br>
                                    {{tstring('you_will_be_charged', { RATE: getTrialRate(lic) })}}
                                </div>
                                <div v-else class="event_description">
                                    <span v-if="Math.round((lic.expiration_date - new Date())/86400000) == 1">
                                        <pr-text path="t.your_free_trial_will_end_day"></pr-text>
                                    </span>
                                    <span v-else>
                                        {{tstring('your_free_trial_will_end_days', {
                                            DAYS: Math.round((lic.expiration_date - new Date())/86400000),
                                        })}}
                                    </span>
                                    <br>
                                    <br>
                                    {{tstring('add_valid_payment_method_before', {
                                        DATE: date(lic.expiration_date),
                                    })}}
                                </div>
                            </h5>
                        </div>
                        <div v-if="!lic.autorenew">
                            <h5 class="event_description">
                                <span v-if="Math.round((lic.expiration_date - new Date())/86400000) == 1">
                                    <pr-text path="t.your_free_trial_will_end_day"></pr-text>
                                </span>
                                <span v-else>
                                    <span>
                                        {{tstring('your_free_trial_will_end_days', {
                                            DAYS: Math.round((lic.expiration_date - new Date())/86400000),
                                        })}}
                                    </span>
                                </span>
                                <br>
                                <br>
                                {{tstring('add_billing_plan_before', {
                                    DATE: date(lic.expiration_date),
                                })}}
                            </h5>
                        </div>
                        <div>
                            <div style="padding-top: 20px;">
                                <span  style="cursor: pointer; min-width: 200px; margin-bottom: 10px;">
                                    <a class="action"
                                        :href="href(`/account/manage-billing?licenseid=${lic.licenseid}`)">
                                        <pr-text path="t.manage_billing_plan" v-if="lic && lic.autorenew">
                                        </pr-text>
                                        <pr-text path="t.select_billing_plan" v-else>
                                        </pr-text>
                                    </a>
                                    <template v-if="lic.autorenew && !(user && user.pmt)">
                                        &nbsp;
                                        <a class="action" :href="href(`/account/update-payment-info`)">
                                            <pr-text path="t.add_payment_method"></pr-text>
                                        </a>
                                    </template>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div v-else-if='lic.licensetype == "Dealer"'>
                        <div>
                            <div class="h1">
                                <pr-text path="t.complimentary_roon_subscription"></pr-text>
                            </div>
                            <br />
                        </div>
                        <div class="col-sm-12">
                            <h5 class="event_description">
                                {{tstring('complimentary_description', {
                                    DATE: date(lic.expiration_date),
                                })}}
                            </h5>
                        </div>
                    </div>
                    <div v-else-if='lic.status == "Subscription"' style="display: flex; flex-direction: column;">
                        <div style="width: 100%;">
                            <div class="h1" style="padding-bottom: 0;">
                                <pr-text path="t.roon_subscription"></pr-text>
                            </div>
                            <br>
                        </div>
                        <div style="display: flex; flex-direction: row; flex-wrap: wrap-reverse; align-items: start;">
                            <div style="text-align: left;">
                                <h5 v-if="lic.autorenew">
                                    <div v-if="user && user.pmt" class="event_description">
                                        {{tstring('subscription_will_renew_on', {
                                            DATE: date(lic.expiration_date),
                                        })}}
                                        <br><br>
                                        {{tstring('you_will_be_charged', {
                                            RATE: getRate(lic.billing),
                                        })}}
                                    </div>
                                    <div v-else class="event_description">
                                        {{tstring('subscription_will_end_on', {
                                            DATE: date(lic.expiration_date),
                                        })}}
                                        <br><br>
                                        {{tstring('add_valid_payment_method_before', {
                                            DATE: date(lic.expiration_date),
                                        })}}
                                    </div>
                                </h5>
                                <h5 v-else>
                                    <div class="event_description">
                                        {{tstring('subscription_will_end_on', {
                                            DATE: date(lic.expiration_date),
                                        })}}
                                    </div>
                                </h5>
                            </div>
                        </div>
                        <div v-if="lic.status != 'Lifetime' && lic.licensetype != 'Dealer'" style="padding-top: 20px;">
                            <!-- @click.prevent="change_billing(lic)"-->
                            <span  style="cursor: pointer; min-width: 200px; margin-bottom: 10px;"
                            >
                                <a class="action" :href="href(`/account/manage-billing?licenseid=${lic.licenseid}`)">
                                    <pr-text path="t.manage_billing_plan"></pr-text>
                                </a>
                            </span>
                            <template v-if="lic.autorenew && !(user && user.pmt)">
                                &nbsp;
                                <a class="action" :href="href(`/account/update-payment-info`)">
                                    <pr-text path="t.add_payment_method"></pr-text>
                                </a>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="licenses.length && licenses.every(l => l.status == 'Lifetime')" class="box no-border primary" style="text-align: center;">
                <pr-text path="t.need_other_sub_or_code"></pr-text>
                <br>
                <span
                    class="contact-us"
                    @click.prevent="contactus('Account')"
                    v-html="tstring('contact_us')">
                </span>
            </div>
            <div class="box" v-if="codes.length">
                    <div style="display: flex; flex-direction: column; justify-content: center;">
                        <div style="flex: 2;">
                            <div class="h1">
                                <pr-text path="t.codes"></pr-text>
                            </div>
                        </div>
                        <br>
                        <br>
                        <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                            <div v-for="code in codes.slice(0, limitCodes ? 5 : codes.length)" style="position: relative; padding: 1rem; border: 1px solid #ddd; border-radius: 12px; flex-direction: column; display: flex; justify-content: center; align-items: center;">
                                <div style="display: inline-block; position: absolute; top: -.6em; left: 1em; background: white; padding: 0 0.5em; font-size: 0.8rem;">
                                    {{code.description}}
                                </div>
                                <div style="font-family: 'Roboto Mono', monospace; font-size: 0.9rem; padding: 0 2em; font-weight: bold;">{{code.code}}</div>
                            </div>
                        </div>
                        <div v-if="codes.length > 5 && limitCodes" style="padding-top: 1rem;">
                            <a class="action" @click="limitCodes = false">
                                <pr-text path="t.view_more"></pr-text>
                            </a>
                        </div>
                        <div v-else-if="codes.length > 5" style="padding-top: 1rem;">
                            <a class="action" @click="limitCodes = true">
                                <pr-text path="t.view_less"></pr-text>
                            </a>
                        </div>
                    </div>
                <div>
                </div>
            </div>
            <div class="box">
                <div class="h1">
                    <pr-text path="t.account_information"></pr-text>
                </div>
                <br>
                <div style="padding-top: 1rem; padding-bottom: 1rem;">
                    <div class="user_info_field">
                        <label>
                            <pr-text path="t.multi_factor_auth"></pr-text>
                        </label>
                        <div style="display: flex; align-items: center; gap: 0.8rem;" v-if="user && user.tfa && user.tfa.enabled">
                            <p>
                                <pr-text path="t.enabled"></pr-text>
                            </p>
                            <a style="text-decoration: underline;" :href='href("/account/edit-tfa?a=remove")'>
                                <pr-text path="t.change"></pr-text>
                            </a>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.8rem;" v-else>
                            <p>
                                <pr-text path="t.disabled"></pr-text>
                            </p>
                            <a style="text-decoration: underline;" :href='href("/account/edit-tfa")'>
                                <pr-text path="t.change"></pr-text>
                            </a>
                        </div>
                    </div>
                    <div class="user_info_field">
                        <label>
                            <pr-text path="t.email_address"></pr-text>
                        </label>
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <p>{{user.email}}</p>
                            <a style="text-decoration: underline;" :href='resetEmailLink(user.email)'>
                                <pr-text path="t.change"></pr-text>
                            </a>
                        </div>
                    </div>
                    <div class="user_info_field">
                        <label>
                            <pr-text path="t.first_name"></pr-text>
                        </label>
                        <p>{{user.firstname}}</p>
                    </div>
                    <div class="user_info_field">
                        <label>
                            <pr-text path="t.last_name"></pr-text>
                        </label>
                        <p>{{user.lastname}}</p>
                    </div>
                    <div class="user_info_field">
                        <label>
                            <pr-text path="t.phone_number"></pr-text>
                        </label>
                        <p>{{user.phone || 'N/A'}}</p>
                    </div>
                </div>
                <div>
                    <label style="font-weight: bold;">
                        <pr-text path="t.change_email_and_pwd"></pr-text>
                    </label>
                    <div style="font-size: 14px;">
                        <p>
                            <pr-text path="t.change_email_and_pwd_desc"></pr-text>
                        </p>
                        <p>
                            <span v-html="tstring('reset_email_and_pwd', { EMAIL: user.email, })"></span>
                            <span
                                v-html="tstring('no_email_access')"
                                style="cursor: pointer;"
                                @click.prevent="contactus('No access to account email')">
                            </span>
                        </p>
                    </div>
                </div>
                <a class="action" :href="href('/account/edit-account-info')">
                    <pr-text path="t.edit_account_info"></pr-text>
                </a>
            </div>
            <div class="box">
                <div class="h1">
                    <pr-text path="t.payment_method"></pr-text>
                </div>
                <br>
                <br>
                <div style="font-size: 14px; padding-bottom: 1.6rem;" v-if="!user.pmt">
                    <pr-text path="t.no_payment_method_on_file"></pr-text>
                </div>
                <div v-else-if="user && user.pmt && user.pmt.card" style="font-size: 14px; padding-bottom: 1.6rem; display: flex; justify-content: start; align-items: center; gap: 4px;">
                    <img style="height: 16px;" :src="creditCardBrand(user.pmt.card.brand)"/>
                    {{tstring('card_ending_in', {
                        LAST4: user.pmt.card.last4,
                        DATE: `${user.pmt.card.exp_month}/${user.pmt.card.exp_year}`
                    })}}
                </div>
                <div v-else-if="user && user.pmt && user.pmt.alipay" style="font-size: 14px; padding-bottom: 1.6rem; display: flex; justify-content: start; align-items: center; gap: 4px;">
                    <img src="https://static-pr.roonlabs.net/400w-gdrive-1WsjqBpc523G8DxEPnY5uUL1llwFaO9hH.png" style="height: 16px;">
                    Alipay
                </div>
                <div v-if="user.pmt" style="display: flex; gap: 16px;">
                    <a class="action" :href="href('/account/update-payment-info')"><u>
                        <pr-text path="t.update_payment_method"></pr-text>
                    </u></a>
                    <!--
                    <a :href="href('/account/delete-payment-info')"><u>Remove payment method</u></a>
                    -->
                    <a class="action" :href="href('/account/billing-history')"><u>
                        <pr-text path="t.billing_history"></pr-text>
                    </u></a>
                    <a v-if="false && isadmin" class="action" :href="href('/account/store-billing-history')"><u>
                        <pr-text path="t.store_billing_history"></pr-text>
                    </u></a>
                </div>
                <div v-else style="display: flex; gap: 16px;">
                    <a class="action" :href="href('/account/update-payment-info')"><u>
                        <pr-text path="t.add_payment_method"></pr-text>
                    </u></a>
                    <a class="action" :href="href('/account/billing-history')"><u>
                        <pr-text path="t.billing_history"></pr-text>
                    </u></a>
                    <a v-if="false && isadmin" class="action" :href="href('/account/store-billing-history')"><u>
                        <pr-text path="t.store_billing_history"></pr-text>
                    </u></a>
                </div>
            </div>
            <div class="box">
                <div class="h1">
                    <pr-text path="t.connected_accounts"></pr-text>
                </div>
                <br>
                <br>
                <div v-if="!(user.associatedAccounts && user.associatedAccounts.length)" style="padding-bottom: 1.6rem;">
                    <pr-text path="t.no_connected_accounts"></pr-text>
                </div>
                <div v-for="account in (user.associatedAccounts || []).sort((a,b) => a.association_type.localeCompare(b.association_type))" style="padding-bottom: 1.6rem;">
                    <div v-if="account.association_type == 'google'" style="display: flex; flex-wrap: wrap; align-items: center;">
                        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; padding-right: 2rem;">
                            <svg style="fill: white !important; height: 1.25em;" viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr"><g><path d="M18.977 4.322L16 7.3c-1.023-.838-2.326-1.35-3.768-1.35-2.69 0-4.95 1.73-5.74 4.152l-3.44-2.635c1.656-3.387 5.134-5.705 9.18-5.705 2.605 0 4.93.977 6.745 2.56z" fill="#EA4335"></path><path d="M6.186 12c0 .66.102 1.293.307 1.89L3.05 16.533C2.38 15.17 2 13.63 2 12s.38-3.173 1.05-4.533l3.443 2.635c-.204.595-.307 1.238-.307 1.898z" fill="#FBBC05"></path><path d="M18.893 19.688c-1.786 1.667-4.168 2.55-6.66 2.55-4.048 0-7.526-2.317-9.18-5.705l3.44-2.635c.79 2.42 3.05 4.152 5.74 4.152 1.32 0 2.474-.308 3.395-.895l3.265 2.533z" fill="#34A853"></path><path d="M22 12c0 3.34-1.22 5.948-3.107 7.688l-3.265-2.53c1.07-.67 1.814-1.713 2.093-3.063h-5.488V10.14h9.535c.14.603.233 1.255.233 1.86z" fill="#4285F4"></path></g></svg>
                            <span>Google</span>
                        </div>
                        <span style="flex: 1; display: flex; justify-content: flex-end; gap: 8px; align-items: center;">
                            {{(account.data || {}).email}}
                            <form @submit.prevent="unassociate(account)" style='display: flex; margin: 0;'>
                                <div style='align-items: center;'
                                    class="flex items-center pr-1"
                                >
                                    <button type='submit' style='padding: 1rem; border: 0; background-color: unset;' title="Click to disconnect this account from your Roon account"  class='cursor-pointer'>
                                        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                                            <path fill="black" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </span>
                    </div>
                    <div v-if="account.association_type == 'apple'" style="display: flex; flex-wrap: wrap; align-items: center;">
                        <div style="display: flex; justify-content: center; gap: 8px; align-items: center; padding-right: 2rem;">
                            <img
                                src="https://static-pr.roonlabs.net/200w-gdrive-1VEKofSUpMgZTkpKqk0HEpVGOST-TbMFi.png"
                                style="filter: invert(1); height: 24px;">
                            <span>Apple</span>
                        </div>
                        <div style="display: flex; justify-content: flex-end; align-items: center; flex: 1;">
                            <span style="display: flex; justify-content: flex-end; gap: 8px; align-items: center;">
                                {{account.data.email}}
                                <form @submit.prevent="unassociate(account)" style='display: flex; margin: 0;'>
                                    <div style='align-items: center;'
                                        class="flex items-center pr-1"
                                    >
                                        <button type='submit' style='padding: 1rem; border: 0; background-color: unset;' title="Click to disconnect this account from your Roon account"  class='cursor-pointer'>
                                            <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                                                <path fill="black" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </span>
                        </div>
                    </div>
                </div>
                <a class="action" :href='href("/account/connect")'>
                    <pr-text path="t.connect_third_party"></pr-text>
                </a>
            </div>
            <div class="box" v-if="referral_url">
                <div class="h1">
                    <pr-text path="t.roon_referral_program"></pr-text>
                </div>
                <div>
                    <p>
                        <pr-text path="t.share_your_love_of_music"></pr-text>
                    </p>
                    <p>
                        <span v-html="tstring('when_someone_signs_up')"
                        ></span>
                    </p>
                    <div style="color: rgb(136, 136, 136); margin-top: 40px; margin-bottom: 4px;">
                        <pr-text path="t.your_referral_link"></pr-text>
                    </div>
                    <div class="referrallink">{{referral_url}}</div>
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <button @click.prevent="copyreferral()" style="font-size: 0.8rem; display: flex; justify-content: center; align-items: center; gap: 4px;">
                            <svg class="customsvg" viewBox="0 0 24 24" role="img" width="20px" height="20px" fill="white" data-v-7c8b250c=""><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" data-v-7c8b250c=""></path></svg>
                       
                            <pr-text path="t.copy"></pr-text>
                        </button>&nbsp;
                        <button @click.prevent="emailreferral()" style="font-size: 0.8rem; display: flex; justify-content: center; align-items: center; gap: 4px;">
                            <svg class="customsvg" viewBox="0 0 24 24" role="img" width="20px" height="20px" fill="white" data-v-7c8b250c=""><path d="M19.07 13.88L13 19.94V22H15.06L21.12 15.93M22.7 13.58L21.42 12.3C21.32 12.19 21.18 12.13 21.04 12.13C20.89 12.14 20.75 12.19 20.65 12.3L19.65 13.3L21.7 15.3L22.7 14.3C22.89 14.1 22.89 13.78 22.7 13.58M11 18H4V8L12 13L20 8V10H22V6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H11V18M20 6L12 11L4 6H20Z" data-v-7c8b250c=""></path></svg>
                        
                            <pr-text path="t.email"></pr-text>
                        </button>
                    </div>
                    <br>
                </div>
                <h5 v-if="copy_success" role="alert" class="alert alert-success copy-alert">
                    <pr-text path="t.referral_link_has_been_copied"></pr-text>
                </h5>
                <div style="text-align: center; border-bottom: 1px solid rgb(170, 170, 170); font-size: 0.7em; padding-bottom: 5px; font-weight: bold; margin-top: 40px;">
                    <pr-text path="t.your_referrals"></pr-text>
                </div>
                <div class="your-referrals"><div class="referral_box"><h5 class="referral_box_inner"> {{(user || {}).referrals_used || 0}} <div>
                                <pr-text path="t.used"></pr-text>
                    </div></h5></div>
                    <div class="referral_box"><h5 class="referral_box_inner"> {{(user || {}).referrals_pending || 0}} <div>
                                <pr-text path="t.pending"></pr-text>
                    </div></h5></div>
                    <div class="referral_box"><h5 class="referral_box_inner"> {{(user || {}).referrals_earned || 0}} <div>
                                <pr-text path="t.earned"></pr-text>
                    </div></h5></div>
                    <div class="referral_box"><h5 class="referral_box_inner"> {{(user || {}).referrals_claimed || 0}} <div>
                                <pr-text path="t.redeemed"></pr-text>
                    </div></h5></div>
                </div>
                <div
                    style="text-center; padding-top: 30px; display: flex; justify-content: center;"
                    v-if="user.referrals_earned > 0 && user.canclaimreferrals"
                >
                    <button
                        style="min-width: 260px"
                        @click.prevent="claim_referral()"
                        class="btn btn-primary btn-sm"
                        v-if='!user["class"] || user["class"] == "Normal"'
                    >
                        <pr-text path="t.redeem_earned"></pr-text>
                    </button>
                    <button
                        style="min-width: 260px"
                        @click.prevent="claim_referral_us_dealer()"
                        class="btn btn-primary btn-sm"
                        v-if='user["class"] == "Dealer" && user["is_us"]'
                    >
                        <pr-text path="t.redeem_earned"></pr-text>
                    </button>
                    <button
                        style="min-width: 260px"
                        @click.prevent="claim_referral_row_dealer()"
                        class="btn btn-primary btn-sm"
                        v-if='user["class"] == "Dealer" && !user["is_us"]'
                    >
                        <pr-text path="t.transfer_earned"></pr-text>
                    </button>
                    <button
                        style="min-width: 260px"
                        @click.prevent="claim_referral_distributor()"
                        v-if='user["class"] == "Distributor"'
                    >
                        <pr-text path="t.redeem_earned"></pr-text>
                    </button>
                </div>

                <a class="action" href="https://roon.app/referralterms" target="_blank">
                    <pr-text path="t.referral_terms"></pr-text>
                </a>
            </div>
            <div class="box" v-if="Object.keys(oses).length">
                <div class="h1">
                    <pr-text path="t.login_sessions"></pr-text>
                </div>
                <br>
                <br>
                <section v-for="(value, os, index) in oses" class="session-container">
                    <div class="flex">
                        <!-- Icon -->
                        <div v-html="getOSIcon(os)" class="session-icon">
                        </div>
                        <!-- Session OS type and number of OSes -->
                        <div class="flex flex-col" style='padding-bottom: 1rem; padding-top: 1rem;'>
                            <span style="font-weight: 700; font-size: larger;"> {{ os }}  </span>
                            <span> {{Object.keys(value).length > 1 ? Object.keys(value).length + ' ' + tstring('sessions') : Object.keys(value).length + ' ' + tstring('session')}} </span>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="session-body">
                        <!-- Sessions List -->
                        <div v-for="(session_items, session_id) in value" class="flex flex-col">
                            <div class="flex session-item">
                                <div class="flex flex-col grow break-word">
                                    <div style="font-weight: 550;"> {{ os }} </div>
                                    <div v-if="session_items[0].location != 'Unknown'" style='font-size: 0.9em;'>
                                        {{tstring('near', {
                                            LOCATION: session_items[0].location
                                        })}}</div>
                                    <div style='font-size: 0.9em;'>{{ reldate(session_items[0].created + "Z")}} </div>

                                    <div style='font-size: 0.8em; margin-top: 0.5em;'>
                                        <div class="appname" v-for="app in session_items.filter(r => r.appname == 'Roon Unified Login')">
                                            {{app.browser}}
                                        </div>
                                        <div class="appname" v-for="app in session_items.filter(r => r.appname != 'Roon Unified Login')">
                                            {{app.appname}}
                                        </div>
                                    </div>

                                    <div v-if="session_items[0].session === currentSession" style='font-size: 0.9em; margin-top: 1em; display: flex; align-items: center; gap: 0.5em;'>
                                        <svg style="width:18px;height:18px" viewBox="0 0 24 24">
                                            <path fill="#4285f4" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                                        </svg>
                                        <pr-text path="t.your_current_session"></pr-text>
                                    </div>
                                </div>
                                <form v-if="session_items[0].session != currentSession" @submit.prevent="logoutSession(session_items[0].session)" style='display: flex; margin: 0;'>
                                    <div style='align-items: center;'
                                        class="flex items-center pr-1"
                                    >
                                        <button type='submit' style='padding: 1rem; border: 0; background-color: unset;' title="Click to log out this session"  class='cursor-pointer'>
                                            <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                                                <path fill="black" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            <div class="session-divider"> </div>
                        </div>
                    </div>
                </section>
            </div>
            <div class="box no-border" style="padding-left: 0; padding-right: 0;">
                <button @click.prevent="logout" style="background: red; font-size: 1.3em;">
                    <pr-text path="t.sign_out"></pr-text>
                </button>
            </div>
        </div>
    </div>
</template>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@700&display=swap');
</style>
<style scoped lang="scss">

.contact-us {
    :deep(a) {
        color: rgb(var(--color-3-fg1)) !important;
        text-decoration: underline !important;
        cursor: pointer;
    }
}

.event_description {
    font-size: 1rem;
    line-height: 1.6rem;
    font-weight: 100;
}

.flex { display: flex; }
.flex-col { flex-direction: column; }
.grow { flex-grow: 1; }
</style>
<style>
:root {
    --gray: #dadce0;
    --lightgray: #f8f8f8;
}

.error-message {
    border-color: #f14668;
    color: #cc0f35;
    border-radius: 4px;
    border-style: solid;
    border-width: 0 0 0 4px;
    padding: 1.25em 1.5em;
    display: block;
    display: flex;
    align-items: flex-start;
    background-color: #feecf0;
}

.appname {
    border: var(--gray) solid 1px;
    border-radius: 20px;
    padding: 0.15rem 0.75rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    box-sizing: border-box;
    display: inline-block;
    background-color: var(--lightgray);
}

.session-container {
    display: flex;
    border-radius: 6.5px;
    width: 100%;
    padding: 1rem 0 1rem 1rem;
    box-sizing: border-box;
}

.session-icon {
    flex-shrink: 0;
    padding-top: 1rem;
    padding-right: 1rem;
}

.session-body {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-left: 6rem;
}

.session-item {
    padding: 1rem;
}

.session-divider:not(:last-child) {
    border-bottom: 1px solid #dadce0;
}

.session-item:hover {
    background-color: #f8f8f8;
}

/* Sm */
@media only screen and (max-width: 640px) {
    .session-container {
        display: flex;
        flex-direction: column;
    }
    .session-body {
        padding-left: 2.15rem;
    }
    .session-item {
        padding-right: 0;
    }
}

</style>

<style scoped lang="scss">
@import "./account.scss";

.user_info_field {
    font-size: 14px;
    padding: 0.5rem 0;
    label {
        font-weight: bold;
    }
    p {
        margin: 0 0 0 4px;
    }
}

.alert {
    padding: 15px;
    margin-bottom: 20px;
    border: 1px solid transparent;
    border-radius: 4px;
    &.alert-success {
        color: #3c763d;
        background-color: #dff0d8;
        border-color: #d6e9c6;
        font-size: 1.2rem;
        line-height: 3.3rem;
        font-weight: 100;
    }
}

.your-referrals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
    position: relative;
    .referral_box {
        display: inline-block;
        text-align: center;
        .referral_box_inner {
            padding: 1em;
            background-color: #fff;
            margin-top: 8px;
            margin-left: 3px;
            margin-right: 3px;
            font-size: 1.2rem;
            line-height: 2.5rem;
            font-weight: 100;
        }
    }
}
.referrallink {
    font-family: courier;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    background-color: #fff;
    border: 1px dashed #aaa;
    border-radius: 10px;
    padding: 2rem;
    margin-bottom: 1em;
    text-align: center;
    font-size: 0.7em;
}
@media screen and (min-width: 768px) {
    .referrallink {
        padding: 1rem;
        font-size: 1em;
    }
}

.h1 {
    font-weight: 100;
    text-transform: uppercase;
    font-size: 24px;
}

.two-fa {
    a {
        display: inline-block;
        padding: 4px;
    }
}

@media screen and (max-width: 768px) {
    .h1 {
        &.toplevel {
            font-size: 24px;
        }
        font-size: 18px;
    }

    .email-label {
        font-size: 0.8rem;
    }

    .two-fa {
        font-size: 0.8rem;
    }
}

.customsvg {
    fill: white !important;
}

</style>
<script>
import Cookies from './cookies.mjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/pl';
import 'dayjs/locale/zh';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.extend(duration);

var months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export default {
    name: "AccountPage",
    inject: ['editor', 'tstrings', 'lang'],
    data() {
        return {
            modal: {
                dialog: null,
            },
            user: null,
            isadmin: false,
            isstaff: false,
            referral_url: null,
            codes: [],
            licenses: [],
            has_lifetime: false,
            has_subscribed: false,
            loading: true,

            loadedtypeform: false,
            copy_success: false,

            limitCodes: true,

            currentSession: '',
            userid: null,

            currenttime: Date.now(),
            timeinterval: null,
        }
    },
    created() {
        if (typeof window != undefined) {
            var typeformsrc = document.createElement('script');
            typeformsrc.onload = () => {
                this.loadedtypeform = true;
            };
            typeformsrc.setAttribute('src', 'https://embed.typeform.com/next/embed.js');
            var typeformcss = document.createElement('link');
            typeformcss.setAttribute('rel', 'stylesheet');
            typeformcss.setAttribute('href', 'https://embed.typeform.com/next/css/popup.css');
            document.head.appendChild(typeformsrc);
            document.head.appendChild(typeformcss);

            this.timeinterval = setInterval(() => {
                this.currenttime = Date.now();
            }, 500);
        }
    },
    beforeDestroy() {
        clearInterval(this.timeinterval);
    },
    mounted() {
        this.qs = new URLSearchParams(window.location.search);
        if (this.qs.get('userid')) {
            this.userid = this.qs.get('userid');
        }
        this.getUserInfo();
    },
    computed: {
        specialPricing() {
            if (this.user && this.user.special && this.user.special.data && this.user.special.data.pricing) {
                return this.user.special.data.pricing;
            } else {
                return null
            }
        },
        oses() {
            const oses = {};
            if (this.user) {
                (this.user.loggedin || []).forEach(l => {
                    // Initialize the array for this os (Windows, iOS, etc.) if it doesn't exist yet
                    if (!oses[l.os]) {
                        oses[l.os] = { [l.session]: [ l ] };
                    } else if (!oses[l.os][l.session]) {
                        oses[l.os][l.session] = [ l ];
                    } else {
                        oses[l.os][l.session].push(l);
                    }
                });
            }
            return oses;
        },

        billingOptions() {
            return ['monthly', 'yearly', 'lifetime']
        },
    },
    methods: {
        resetEmailLink(email) {
            return this.href("/reset-email?email=" + encodeURIComponent(email));
        },
        async claimSpecialOffer(offer) {
            if (offer.data.extend_trial) {
                try {
                    const res = await fetch(this.href(`/api/6/specials/${offer.special_id}/extend-trial`), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    this.getUserInfo();
                } catch (e) {
                    console.log(e);
                }
            } else {
                window.location.href = this.href('/claim-special?special_id=' + offer.special_id);
            }
        },
        tstring(key, vars = {}) {
            let s = this.tstrings[this.id][key].value;
            for (let key in vars) {
                let variable = '%' + key + '%';
                s = s.replaceAll(variable, vars[key]);
            }
            return s
        },
        claim_referral() {
            window.location.href = this.href('/account/redeem');
        },
        claim_referral_us_dealer() {
            window.location.href = "https://forms.zohopublic.com/roonlabsllc/form/OrderForm1/formperma/_ABJbp0IWUzCVZP0rYCx0NRa8gscToakIgUnhCVoDoo?n=" + encodeURIComponent(this.user.company_name) + "&e=" + encodeURIComponent(this.user.email) + "&rc=" + encodeURIComponent(this.user.referrals_earned);
        },
        claim_referral_row_dealer() {
            window.location.href = "https://forms.zohopublic.com/roonlabsllc/form/PointsTransferRequest/formperma/oHxLXyVbyDHLRMQ992bAe6XyPn7dL6s4eQW4y0PPBOE?n=" + encodeURIComponent(this.user.company_name) + "&e=" + encodeURIComponent(this.user.email) + "&rc=" + encodeURIComponent(this.user.referrals_earned);
        },
        claim_referral_distributor() {
            window.location.href = "https://forms.zohopublic.com/roonlabsllc/form/InternationalDistributorRequestOrder/formperma/lp_SOPlRkL8mJs9p_1shFN-I3SsxW6h62YvpdibNlsU?n=" + encodeURIComponent(this.user.company_name) + "&e=" + encodeURIComponent(this.user.email) + "&rc=" + encodeURIComponent(this.user.referrals_earned);
        },

        href(path) {
            if (this.userid) {
                // Handle case where there are already query params
                if (path.indexOf('?') > -1) {
                    return path + '&userid=' + this.userid;
                }
                return path + '?userid=' + this.userid;
            } else {
                return path
            }
        },
        async unassociate(association) {
            try {
                const res = await fetch(this.href('/api/6/unassociate'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        association_id: association.association_id,
                        association_type: association.association_type,
                    }),
                });
                if (res.status === 200) {
                    this.getUserInfo();
                } else {
                    console.log(res);
                }
            } catch (e) {
                console.log(e);
            }
        },
        async logoutSession(session) {
            try {
                const res = await fetch(this.href('/api/account/session'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ logout_session: session }),
                });
                if (res.status === 200) {
                    this.getUserInfo();
                } else {
                    console.log(res);
                }
            } catch (e) {
                console.log(e);
            }
        },
        getDuration(billing) {
            const billingToDurationMapping = {
                monthly: 'month',
                yearly: 'year',
                lifetime: 'one time',
            };
            return billingToDurationMapping[billing];
        },

        date(d) {
            if (typeof d == "string") d = new Date(d);
            return (
                months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear()
            );
        },
        subscribe_resub(lic) {
            console.log('subscribe_resub', lic);
        },
        subscribe_trial(lic) {
            console.log('subscribe_trial', lic);
        },
        getTrialRate(license) {
            if (license.iskkboxpromo) {
                if (license.billing == 'yearly' && license.expiration_date > new Date()) {
                    return this.user.prices.kkboxpromo.display;
                } else {
                    return this.getRate(license.billing);
                }
            } else {
                return this.getRate(license.billing);
            }
        },
        getRate(billing) {
            const billingToRateMapping = {
                monthly:  this.user.prices.monthly.display,
                yearly:   this.user.prices.annual.display,
                lifetime: this.user.prices.lifetime.display,
            };
            return billingToRateMapping[billing] || billingToRateMapping.yearly;
        },
        change_trial_billing(lic, billing) {
            console.log('change_trial_billing', lic, billing);
        },
        async logout() {
            try {
                const res = await fetch(this.href('/api/account/logout'), {method: 'POST'});
                if (res.status === 200) {
                    this.auth();
                }
            } catch (e) {
                console.log(e);
            }
        },
        emailreferral() {
            var subject = "My Roon referral link -- You'll thank me later!";
            var body = `Hello!

            Press pause for a minute... there's a better way to listen to your music that you will absolutely want to try out!

            Use my referral link to sign up for Roon and you'll get an extra 30 days when you purchase. Join me and so many other music lovers who did the same:

            ${this.referral_url}

            Thanks and happy listening!

            - ${this.orig_user.firstname}
            `;
            window.open(
                "mailto:friend@example.com?subject=" +
                    encodeURIComponent(subject) +
                    "&body=" +
                    encodeURIComponent(body),
                "_blank"
            );
        },
        copyreferral() {
            var textarea = document.createElement("textarea");
            textarea.textContent = this.referral_url;
            document.body.appendChild(textarea);
            textarea.select();
            console.log("copy success", document.execCommand("copy"));
            this.copy_success = true;
            document.body.removeChild(textarea);
        },
        async getUserInfo() {
            try {
                const res  = await fetch(`/api/6/webaccountinfo?${this.userid ? "&userid=" + this.userid : ""}`,
                                         {method: 'POST'}
                                        );
                const data = await res.json();

                if (data.status === 'Unauthorized') {
                    return this.auth();
                }

                this.orig_user      = JSON.parse(JSON.stringify(data.user));
                this.orig_user.pmt  = data.pmt;
                this.user           = data.user;
                this.user.pmt       = data.pmt;
                this.user.special   = data.special || null;
                this.user.prices    = data.prices;
                this.currentSession = data.currentSession;
                this.isadmin        = this.user.groups.indexOf("admin-ro") != -1;
                this.isstaff        = this.user.groups.indexOf("staff") != -1;

                this.user.referrals_used    = data.referrals_used || 0;
                this.user.referrals_earned  = data.referrals_earned || 0;
                this.user.referrals_pending = data.referrals_pending || 0;
                this.user.referrals_claimed = data.referrals_claimed || 0;

                this.user.associatedAccounts = data.associatedAccounts;

                if (this.user.referralcode)  {
                    this.referral_url = "https://roonlabs.com/r/" + this.user.referralcode;
                }

                this.codes    = data.codes;
                this.licenses = data.licenses || [];

                this.has_lifetime   = false;
                this.has_subscribed = false;

                if (this.licenses && this.licenses.length != 0) {
                    for (let i in this.licenses) {
                        var lic = this.licenses[i];
                        lic.created_date = new Date(lic.created_date);
                        if (lic.expiration_date)
                            lic.expiration_date = new Date(lic.expiration_date);
                        if (lic.closed_date)
                            lic.closed_date = new Date(lic.closed_date);

                        if (lic.status == "Trial")
                            lic.trial_or_sub = "free trial";
                        else {
                            lic.trial_or_sub = "subscription";
                            this.has_subscribed = true;
                        }

                        if (lic.status == "Lifetime")
                            this.has_lifetime = true;
                    }
                }

                //if (!this.user.pmt?.card?.last4) {
                //    for (let i in this.licenses) {
                //        this.licenses[i].autorenew = false;
                //    }
                //}
                this.loading = false;

            } catch (e) {
                console.log(e);
                if (e.status == 401) {
                    this.auth();
                }
            }
        },
        returnUrl(args) {
            let url = new URL(window.location.href);
            return url.origin + url.pathname + '?' + new URLSearchParams({...args });
        },
        creditCardBrand(brand) {
            // XXX Do error cases now, make them into translatable strings as well
            //"https://static-pr.roonlabs.net/200w-gdrive-1WsjqBpc523G8DxEPnY5uUL1llwFaO9hH.png"/>Alipay account:

            return {
                jcb: 'https://static-pr.roonlabs.net/orig-gdrive-1bUJmlAOrOEMTzkibzfYnzXEn4QYetVmQ.png',
                visa: 'https://static-pr.roonlabs.net/orig-gdrive-1mx3goNm-doSkb2Sot_vGCZD6FedE2U28.png',
                amex: 'https://static-pr.roonlabs.net/orig-gdrive-1s5W8MnsLYI1bl17GbZjGsFZcZhC_Aexf.png',
                diners: 'https://static-pr.roonlabs.net/orig-gdrive-1r1Qvslj9f0JOLXSpF94VCmfCPG-u01lP.png',
                discover: 'https://static-pr.roonlabs.net/orig-gdrive-1O0VeYtNzQhFKFEvM7FwkuMgkEJLpND_z.png',
                mastercard: 'https://static-pr.roonlabs.net/orig-gdrive-1pivHXHtLEIjkHSibXv3xqdIuqEZZ6T4U.png',
                maestro: 'https://static-pr.roonlabs.net/orig-gdrive-1I11LcpR6G6PSkHDMUs2n4cs0bmCM4whn.png',
                unionpay: 'https://static-pr.roonlabs.net/orig-gdrive-1cpEd7tl3j941QAEDLmNkGag9HgyLosqp.png',
            }[brand] || 'https://static-pr.roonlabs.net/orig-gdrive-1NA_dZEBB7qpQMLUHYw36IJDJJXKkAGIn.png'
        },
        async go() {
            try {
                window.history.replaceState(null, null, window.location.pathname);
            } catch (e) {
            } finally {
            }
        },
        auth() {
            if (this.editor) {
                return;
            }
            window.location.href = "/login?id=9FE57595-FD11-4E28-B37F-9C5C29A9CC5B";
        },
        contactus(subject) {
            const opts = {
                size: 80,
                hidden: {
                    which: subject,
                    email: this.orig_user.email,
                    full_name: this.orig_user.firstname + " " + this.orig_user.lastname,
                }
            };
            if (subject === 'No access to account email') {
                opts.which = 'Account';
                opts.hidden['answers-account'] = 'bebd1317-adb9-4da6-b050-4f5e3193c6a1'
                opts.hidden['answers-issue'] = '1d61b70d-2ca9-450d-a640-a165228cf922'
            }
            const { open } = window.tf.createPopup('TrUJCrjN', opts);
            open()
        },
        getOSIcon(os) {
            switch(os) {
                case 'Windows':
                    return `<svg style="width:32px;height:32px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3,12V6.75L9,5.43V11.91L3,12M20,3V11.75L10,11.9V5.21L20,3M3,13L9,13.09V19.9L3,18.75V13M20,13.25V22L10,20.09V13.1L20,13.25Z" />
                </svg>`
                case 'Android':
                    return `<svg style="width:32px;height:32px" viewBox="0 0 24 24">
                <path d="M14.97535,3.01886l.95982-1.73159a.19342.19342,0,0,0-.33833-.18756l-.97045,1.75078a6.54141,6.54141,0,0,0-5.25275,0L8.40316,1.09971a.19342.19342,0,0,0-.33833.18756l.95985,1.7316A5.54614,5.54614,0,0,0,5.93152,7.89522h12.137A5.54615,5.54615,0,0,0,14.97535,3.01886ZM9.19911,5.67446a.5068.5068,0,1,1,.5068-.5068A.50737.50737,0,0,1,9.19911,5.67446Zm5.60178,0a.5068.5068,0,1,1,.5068-.5068A.50737.50737,0,0,1,14.80089,5.67446Zm-8.86946,11.497a1.46713,1.46713,0,0,0,1.46713,1.46713h.9736v3.00095a1.36046,1.36046,0,1,0,2.72091,0V18.63859h1.81386v3.00095a1.36046,1.36046,0,1,0,2.72091,0V18.63859h.97364a1.46713,1.46713,0,0,0,1.46713-1.46713V8.37532H5.93143ZM4.06415,8.14191A1.362,1.362,0,0,0,2.7037,9.50237v5.66846a1.36046,1.36046,0,1,0,2.72091,0V9.50237A1.362,1.362,0,0,0,4.06415,8.14191Zm15.8717,0a1.362,1.362,0,0,0-1.36046,1.36046v5.66846a1.36046,1.36046,0,1,0,2.72091,0V9.50237A1.362,1.362,0,0,0,19.93585,8.14191Z"/>
                </svg>`;
                case 'iOS':
                    return `<svg style="width:32px;height:32px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>`;
                case 'macOS':
                    return `<svg style="width:32px;height:32px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>`;
                case 'Mac OS':
                    return `<svg style="width:32px;height:32px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>`;
                case 'Linux':
                    return `<svg  style="width:32px;height:32px" viewBox="0 0 1000 1000">
                <path d="M896,809.4c-25.9-10.6-47.2-27.4-45.7-59.4c1.5-32-22.9-53.2-22.9-53.2s21.3-70.1,1.5-128c-19.8-58-85.3-150.8-135.5-220.9c-50.2-70.1-7.6-150.9-53.2-254.4C594.4-10,475.7-4,411.7,40.2c-64,44.1-44.2,153.8-41.2,205.6c3.1,51.7,1.4,88.6-4.5,102c-6,13.4-47.2,62.5-74.7,103.6c-27.4,41.1-47.2,126.4-67.1,161.5c-19.8,35-6.1,67-6.1,67s-13.7,4.5-24.4,27.5c-10.7,22.8-32,33.4-70.1,41c-38.1,7.6-38.1,32.1-29,59.5c9.2,27.4,0,42.7-10.6,77.6c-10.7,34.9,42.6,45.7,94.4,51.7c51.8,6.2,109.7,39.7,158.5,45.7c48.7,6.1,63.9-33.5,63.9-33.5s54.8-12.3,112.7-13.7c57.9-1.5,112.7,12.2,112.7,12.2s10.7,24.4,30.5,35c19.8,10.7,62.5,12.2,89.9-16.7c27.5-29,100.6-65.5,141.7-88.4C929.5,855,921.9,820,896,809.4z M539.6,137.7c26.1,0,47.2,25.9,47.2,57.8c0,22.7-10.6,42.2-26,51.7c-3.9-1.7-8.1-3.5-12.5-5.4c9.3-4.6,15.9-16.4,15.9-30.3c0-18-11.1-32.6-24.9-32.6c-13.6,0-24.8,14.6-24.8,32.6c0,6.7,1.6,13.1,4.3,18.3c-8.1-3.2-15.6-6.2-21.5-8.5c-3.2-7.8-5-16.6-5-25.9C492.3,163.6,513.4,137.7,539.6,137.7z M536.2,259.6c13.1,4.5,27.6,13,26.1,21.4c-1.5,8.5-8.4,8.5-26.1,19.3c-17.7,10.7-56,34.5-68.3,36c-12.3,1.5-19.2-5.4-32.3-13.8c-13.1-8.5-37.6-28.5-31.4-39.2c0,0,19.1-14.6,27.5-22.3c8.5-7.7,30-26.1,43-23.7C487.8,239.6,523.1,255,536.2,259.6z M418.4,146.8c20.6,0,37.3,24.5,37.3,54.8c0,5.6-0.5,10.7-1.6,15.7c-5,1.7-10.1,4.5-15.1,8.7c-2.5,2.1-4.7,4-6.9,5.9c3.3-6.1,4.6-14.8,3.1-24c-2.8-16.5-13.8-28.6-24.7-26.9c-10.9,1.9-17.5,16.7-14.7,33.4c2.8,16.6,13.8,28.7,24.6,26.9c0.6-0.1,1.2-0.3,1.8-0.5c-5.3,5.1-10.2,9.5-15.2,13.2c-15.1-7-26.1-27.8-26.1-52.4C381.2,171.3,397.9,146.8,418.4,146.8z M378.2,916.5c-4.9,21.8-30.4,37.7-30.4,37.7c-23.2,7.3-87.6-20.7-116.8-32.9c-29.2-12.1-103.4-15.9-113.2-26.7c-9.7-11,4.9-35.4,8.6-58.4c3.6-23.2-7.3-37.7-3.7-53.6c3.7-15.8,51.1-15.8,69.3-26.7c18.3-11,21.9-42.6,36.5-51.1c14.6-8.6,41.3,21.8,52.3,39c10.9,16.9,52.3,90,69.3,108.3C367.3,870.2,383.1,894.6,378.2,916.5z M647.6,704.2c-4.4,21.5-4.4,99.1-4.4,99.1s-47.2,65.4-120.4,76.1c-73.1,10.7-109.7,3-109.7,3L372,835.3c0,0,31.9-4.6,27.4-36.6c-4.6-32-97.5-76.2-114.2-115.8c-16.7-39.5-3-106.6,18.3-140.2c21.3-33.5,34.9-106.5,56.3-131c21.3-24.3,38-76.1,30.4-99c0,0,45.7,54.9,77.6,45.8c32-9.2,103.7-62.5,114.2-53.3c10.6,9.2,102,210.2,111.1,274.2c9.2,63.9-6.1,112.7-6.1,112.7S652.1,682.9,647.6,704.2z M881.4,847.7c-14.2,13.1-93.4,45-117.1,70c-23.6,24.7-54.4,44.9-73.3,39c-19-6-35.5-32-27.2-69.9c8.2-37.8,15.4-79.2,14.2-102.9c-1.2-23.7-6-55.7,0-60.4c5.9-4.6,15.3-2.3,15.3-2.3s-4.6,44.9,22.5,56.8c27.2,11.7,66.2-4.7,78.1-16.7c11.9-11.8,20.2-29.5,20.2-29.5s11.8,6,10.6,24.9c-1.2,18.9,8.2,46.2,26.1,55.6C868.4,821.7,895.6,834.8,881.4,847.7z"/>
                </svg>`;
                default:
                    return '';
            }
        },
        reldate(date) {
            return dayjs(date).locale(this.lang || 'en').fromNow();
        },
        daysuntil(date) {
            const duration = dayjs.duration(dayjs(date).diff(dayjs()));
            return duration.days();
        },
        expiressoon(date, time) {
            const duration = dayjs.duration(dayjs(date).diff(dayjs(new Date(time))));
            const days = duration.days();
            const hours = duration.hours();
            const minutes = duration.minutes();
            const seconds = duration.seconds();

            const daystring = days > 0 ? `${days} days` : '';
            const hourstring = hours > 0 ? `${hours} hours` : '';
            const minutestring = (hours > 0 || minutes > 0) ? `${minutes} minutes` : '';
            const secondstring = (minutes > 0 || seconds > 0) ? `${seconds} seconds` : '';

            if (daystring === '' && hourstring === '' && minutestring === '' && secondstring === '') {
                return 'now';
            }

            return `in ${daystring} ${hourstring} ${minutestring} ${secondstring}`;
        },
        datename(date) {
            return dayjs(date).locale(this.lang || 'en').format('MMMM D, YYYY');
        },
    }
}
</script>
