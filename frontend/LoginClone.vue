<widget>
{
    name: "LoginClone",
    tags: [ 'web', 'custom' ],
    description: "Login widget for testing postgres 16 integration",
    properties: [
    ],
    strings: {
        welcome_back: { value: "Welcome back!" },
        welcome: { value: "Welcome!" },
        choose_an_account: { value: "Choose an account" },
        sign_out_and_use_another_account: { value: "Sign out and use another account" },
        multi_factor_protection: { value: "Multi-factor protection" },
        token_from_authenticator_app: { value: "Token from authenticator app" },
        please_enter_the_token_from_your_authenticator_app: { value: "Please enter the token from your authenticator app." },
        please_verify_yourself: { value: "Please verify yourself by entering the token from your authenticator app." },
        please_sign_in: { value: "Please sign in to your Roon account." },
        or: { value: "or" },
        forgot_password: { value: "Forgot password?" },
        dont_have_an_account: { value: "Don't have an account?" },
        sign_up: { value: "Sign up" },
        redirecting: { value: "Redirecting, please wait..." },
        submit: { value: "Submit" },
        cancel: { value: "Cancel" },
        there_was_an_error_logging_out: { value: "There was an error logging out, please try again." },
        unexpected_error_please_try_again: { value: "Unexpected error, please try again." },
        logout: { value: "Logout" },
        logout_from_all_devices: { value: "Logout from all devices" },
        logout_from_all_devices_description: { value: "This will log you out from all devices. You will need to log in again on each device." },
        logout_from_all_devices_button: { value: "Logout from all devices" },
        logout_from_all_devices_error: { value: "There was an error logging out from all devices, please try again." },
        email: { value: "Email" },
        password: { value: "Password" },
        sign_in: { value: "Sign in" },
        error_invalid_password: { value: "Invalid Password. Please check your password and try again." },
        error_unexpected_state: { value: "Unexpected state when signing in. Please try again." },
        error_there_is_no_account_with_this_email: { value: "There is no account with this email address." },
        error_check_the_email_address_and_try_again: { value: "Check the email address and try again." },
        error_no_roon_acccount_associated_with_this_apple_id: { value: "No Roon account associated with this Apple ID." },
        error_please_use_a_different_apple_id: { value: "Please use a different Apple ID or log in with your email and password." },
        error_no_roon_acccount_associated_with_this_google_account: { value: "No Roon account associated with this Google account." },
        error_please_use_a_different_google_account: { value: "Please use a different Google account or log in with your email and password." },
        error_generic: { value: "There was an error logging in: %ERROR%" },
        back_to_login: { value: "Back to login" },
        please_select_your_profile: { value: "Please select your profile." },
        do_not_sign_in_unless_downloaded: { value: "Do not sign into <span class='appname'>%APPNAME%</span> unless you downloaded it from Roon." },
        if_you_did_download: { value: "If you did download <span class='appname'>%APPNAME%</span> from Roon, it is asking you to sign in again now because your previous session expired or there has been an important update." },
        if_you_cannot_confirm_you_downloaded: { value: "If you cannot confirm that you downloaded <span class='appname'>%APPNAME%</span> from Roon, delete it now." },
        if_this_doesnt_continue_after_a_few_seconds: { value: "If this doesn't continue after a few seconds,<br>click here to continue." },
        make_sure_you_downloaded: { value: "Make sure you downloaded <br>this app from Roon" },
    },
}
</widget>
<template>
<div class="guttered" style="display: flex; align-items: center; justify-content: center;">
    <div v-if="auth_state === 'checking'" class="box">
        <div style="padding: 0.75rem 0; font-size: 160%;">
            <div class="loading-spinner"></div>
        </div>
    </div>
    <div v-if="auth_state === 'loggedin'" style="min-width: 400px;">
        <div style="text-align: center; font-size: 3rem; font-family: var(--font-2); padding-bottom: 1rem;">
            <pr-text path='t.welcome_back'/>
        </div>
        <div style="font-size: 1.4rem; text-align: center; padding: 2rem;">
            <pr-text path='t.choose_an_account'/>
        </div>
        <div>
            <div @click="() => { auth_state = 'checking'; getLoginStatus() }" class="account-picker" style="display: flex; justify-content: flex-start; gap: 16px; align-items: center;">
                <div style="background-color: rgb(var(--color-3-bg)); color: rgb(var(--color-3-fg1)); height: 40px; width: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center;">
                    <b>{{(name || '').slice(0,1).toUpperCase()}}</b>
                </div>
                <div>
                    <div>{{name}}</div>
                    <div style="font-size: 0.8rem;">{{email}}</div>
                </div>
            </div>
            <hr style="margin: 0.75rem 0; flex: 1; height: 1px; border: 0; background: lightgray;"/>
            <div class="account-picker" @click="clearSelectAccount()" style="display: flex; justify-content: flex-start; align-items: center; gap: 16px;">
                <span style="display: flex; justify-content: center; align-items: center; height: 40px; width: 40px;">
                    <svg viewBox="0 0 24 24" role="img" width="25px" height="25px" fill="#000000"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7.07,18.28C7.5,17.38 10.12,16.5 12,16.5C13.88,16.5 16.5,17.38 16.93,18.28C15.57,19.36 13.86,20 12,20C10.14,20 8.43,19.36 7.07,18.28M18.36,16.83C16.93,15.09 13.46,14.5 12,14.5C10.54,14.5 7.07,15.09 5.64,16.83C4.62,15.5 4,13.82 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,13.82 19.38,15.5 18.36,16.83M12,6C10.06,6 8.5,7.56 8.5,9.5C8.5,11.44 10.06,13 12,13C13.94,13 15.5,11.44 15.5,9.5C15.5,7.56 13.94,6 12,6M12,11A1.5,1.5 0 0,1 10.5,9.5A1.5,1.5 0 0,1 12,8A1.5,1.5 0 0,1 13.5,9.5A1.5,1.5 0 0,1 12,11Z"></path></svg>
                </span>
                <pr-text path='t.sign_out_and_use_another_account'/>
            </div>
        </div>
        <section :style="[error ? 'bottom: 0;' : '']" class="error-message" @click="error = ''">
            <span style="position: absolute; top: 10px; right: 10px;">
                &#10005;
            </span>
            <span v-if="error === 'LogoutError'"><pr-text path='t.there_was_an_error_logging_out'/></span>
            <span v-else><pr-text path='t.unexpected_error_please_try_again'/></span>
        </section>
    </div>
    <div v-if="auth_state === 'tfa'" id="app" class='box'>
        <div style="text-align: center; font-size: 3rem; font-family: var(--font-2); padding-bottom: 1rem;">
            <pr-text path='t.welcome_back'/>
        </div>
        <div style="text-align: center; padding: 0.75rem 0; font-size: 160%;">
            <pr-text path='t.multi_factor_protection'/>
        </div>
        <p style="text-align: center; color: #666;"><pr-text path='t.please_verify_yourself'/></p>

        <form id="form">
            <div style="margin-bottom: 12px;">
                <label><pr-text path='t.token_from_authenticator_app'/></label>
                <input type='text' id='token' name='tfa' required v-model="tfatoken">
            </div>
            <button @click.prevent="enterTfa" style="display: flex; justify-content: center; align-items: center; margin-bottom: 12px;" type="submit">
                <span v-if="loading.action !== 'enter-tfa'"><pr-text path='t.submit'/></span>
                <div v-else class="loading-spinner-white"></div>
            </button>
            <a style='display: block; text-align: center;' @click.prevent="cancelTfa"><pr-text path='t.cancel'/></a>
        </form>

        <!-- Error Message -->
        <section :style="[error ? 'bottom: 0;' : '']" class="error-message" @click="error = ''">
            <span style="position: absolute; top: 10px; right: 10px;">
                &#10005;
            </span>
            <pr-text path='t.please_enter_the_token_from_your_authenticator_app'/>
        </section>
    </div>

    <div v-if="auth_state === 'confirmapp'" class="box">
        <div style="text-align: center; font-size: 3rem; font-family: var(--font-2); padding-bottom: 1rem;">
            <pr-text path='t.welcome_back'/>
        </div>
        <form id="form">
            <div style="margin-bottom: 12px;">
                <h2 style="text-align: center; margin-bottom: 0;"><pr-text path='t.make_sure_you_downloaded'/></h2>
                <p>
                    <span v-html='tstrings[id].do_not_sign_in_unless_downloaded.value.replace("%APPNAME%", appname)'></span>
                    <br><br>
                    <span v-html='tstrings[id].if_you_did_download.value.replace("%APPNAME%", this.appname)'></span>
                    <br><br>
                    <span v-html='tstrings[id].if_you_cannot_confirm_you_downloaded.value.replace("%APPNAME%", appname)'></span>
                </p>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 4px;">
                <button
                    @click.prevent="confirmApp('canceled')" style="display: flex; justify-content: center; align-items: center; margin-top: 12px; margin-bottom: 12px;" type="submit">
                    <span v-if="loading.action !== 'cancel-confirm-app'">Cancel</span>
                    <div v-else class="loading-spinner-white"></div>
                </button>
                <button
                    @click.prevent="confirmApp('confirmed')" style="display: flex; justify-content: center; align-items: center; margin-top: 12px; margin-bottom: 12px;" type="submit">
                    <span v-if="loading.action !== 'confirm-app'">Sign in</span>
                    <div v-else class="loading-spinner-white"></div>
                </button>
            </div>
        </form>
    </div>
    <div v-else-if="auth_state === 'redirecting'" id="app" class='box'>
        <div style="font-size: 160%;">
            <span class="icon-roon_logo"></span>
        </div>
        <div style="padding: 0.75rem 0; font-size: 160%; text-align: center;">
            <pr-text path='t.redirecting'/>
        </div>
        <p style="text-align: center; color: #666;">
            <a class='link' :href='redirect_url'>
                <pr-text path='t.if_this_doesnt_continue_after_a_few_seconds'/></a>
        </p>
    </div>
    <div v-else-if="auth_state === 'profile'" class="box">
        <div style="text-align: center; font-size: 3rem; font-family: var(--font-2); padding-bottom: 1rem;">
            <pr-text path='t.welcome_back'/>
        </div>
        <div class="box">
            <div style="padding: 0.75rem 0; font-size: 160%;">
                <span class="icon-roon_logo"></span>
            </div>
            <p style="padding-bottom: 3rem; font-size: 90%; color: #666;"><pr-text path='t.please_select_your_profile'/></p>
            <form id="profile">
                <div class='rows'>
                    <div @click="pickProfile(profile)" v-for="profile in profiles" class='row'>
                        <img v-if="profile.photo" :src='profile.photo'/>
                        <div v-else style='background-color: #6059ef; border-radius: 60px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.7em;'>
                            {{profile.name[0]}}
                        </div>
                        <div>{{profile.name}}</div>
                    </div>
                    <div @click="backToLogin" class='row exit'>
                        <div style='background-color: #eee; margin: 10px; border-radius: 40px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.7em;'>
                            <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                                <path fill="#000;" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                            </svg>
                        </div>
                        <div><pr-text path='t.back_to_login'/></div>
                    </div>
                </div>
            </form>
        </div>
    </div>
    <div v-else-if="auth_state === 'login'" class="box">
        <div style="text-align: center; font-size: 3rem; font-family: var(--font-2); padding-bottom: 1rem;">
            <pr-text path='t.welcome'/>
        </div>
        <p style="display: none; padding-bottom: 3rem; font-size: 90%; color: #666;"><pr-text path='t.please_sign_in'/></p>
        <form id="form">
            <div style="margin-bottom: 12px;">
                <label><pr-text path='t.email'/></label>
                <input @input="error = ''" type='email' id='email' name='email' v-model='email' required autocomplete='email'>
            </div>
            <div style="margin-bottom: 12px;">
                <label><pr-text path='t.password'/></label>
                <input @input="error = ''" type='password' id='password' name='password' required v-model="password" autocomplete='current-password'>
            </div>
            <button
                ref="enterCredentialsBtn"
                :disabled="!email || !password"
                @click.prevent="enterCredentials"
                type="submit">
                <span v-if="loading.action !== 'enter-credentials'"><pr-text path='t.sign_in'/></span>
                <div v-else class="loading-spinner-white"></div>
            </button>
            <div style="text-align: center; margin-top: 4px;">
                <a target='_blank' :href="'/reset?email=' + encodeURIComponent(email)" style="font-size: 0.9rem; color: #777;"><pr-text path='t.forgot_password'/></a>
            </div>
        </form>
        <div style="margin: 2rem 0; display: flex; justify-content: center; align-items: center; gap: 8px;">
            <hr  style="flex: 1; height: 1px; border: 0; background: lightgray;"/>
            <span style="color: #777; font-size: 0.8rem; text-transform: uppercase;"><b><pr-text path='t.or'/></b></span>
            <hr  style="flex: 1; height: 1px; border: 0; background: lightgray;"/>
        </div>
        <div id="google-signin">
        </div>
        <div class="unstyled" style="padding: 1rem 0;">
            <div
                @click="appleSignInClicked"
                class="appleid-signin"
                id="appleid-signin" 
                data-logo-size="small"
                data-height="40"
                data-width="100%"
                data-color="black" 
                data-border="false" 
                data-type="continue"></div>
        </div>
        <div style="text-align: center; padding: 0.5rem 0; font-size: 0.9rem;">
            <pr-text path='t.dont_have_an_account'/> <a :href="createUrl" style="color: rgb(32, 57, 243);"><b><pr-text path='t.sign_up'/></b></a>
        </div>
        <section @click="error = ''" :style="[error ? 'bottom: 0;' : '']" class="error-message">
            <span style="position: absolute; top: 10px; right: 10px;">
                &#10005;
            </span>
            <span v-if="error === 'Unauthorized'">
                <pr-text path='t.error_invalid_password'/>
            </span>
            <span v-else-if="error === 'NotFound'">
                <div><pr-text path='t.error_there_is_no_account_with_this_email'/></div>
                <div><b>{{email}}</b></div>
                <div><pr-text path='t.error_check_the_email_address_and_try_again'/></div>
            </span>
            <span v-else-if="error === 'TryAgain'">
                <pr-text path='t.error_unexpected_state'/>
            </span>
            <span v-else-if="error === 'NeedsAssociation'">
                <div><pr-text path='t.error_no_roon_acccount_associated_with_this_apple_id'/></div>
                <div><pr-text path='t.error_please_use_a_different_apple_id'/></div>
            </span>
            <span v-else-if="error === 'Google-NotFound'">
                <div><pr-text path='t.error_no_roon_acccount_associated_with_this_google_account'/></div>
                <div><pr-text path='t.error_please_use_a_different_google_account'/></div>
            </span>
            <span v-else v-html='tstrings[id].error_generic.value.replace("%ERROR%", error)'>
            </span>
        </section>
    </div>
</div>
</template>
<style lang="scss">
.appleid-signin {
        cursor: pointer;
        div {
           max-width: 100% !important; 
           svg {
               fill: #fff !important;
           }
       }
}
</style>
<script>
export default {
    name: 'LoginClone',
    inject: ['editor', 'tstrings'],
    data() {
        return {
            email: '',
            name: '',

            loading: { action: null },
            loaded_grecaptcha: false,

            auth_state: 'checking',

            error:   '',
            challenge: '',
            _id: '',
            cb: '',
            state: '',

            // Login Page
            email: '',
            password: '',

            // Profile Page
            profileid: '',
            profiles: [],

            // Redirect Page
            redirect_url: '',

            // Confirm app
            appname: '',

            // Login TFA
            tfatoken: '',

            // Latest nonce
            _nonce: null,

            qs: new URLSearchParams()
        };
    },
    mounted() {
        const grepcaptchasrc = document.createElement('script');
        grepcaptchasrc.onload = () => { this.loadedGrecaptcha = true; };
        grepcaptchasrc.setAttribute('src', 'https://www.google.com/recaptcha/api.js?render=6LfrZMEUAAAAAFuz9l0Md9_yd8ueYhees004fcCi');
        document.head.appendChild(grepcaptchasrc);

        // Pick out any params
        this.mapQSToState();
        //AppleID.auth.init({
        //    clientId :     'com.roon.website.signin',
        //    scope :        'name email',
        //    redirectURI :  window.location.origin + '/login/acb',
        //    state :        JSON.stringify({ challenge: this.challenge, id: this._id, cb: this.cb, state: this.state }),
        //    nonce :        this.nonce(),
        //    usePopup :     true 
        //});
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
                client_id: "92734372290-cq0btomrba7c886npam0do95d09uqbkq.apps.googleusercontent.com",
                callback: this.signInWithGoogle
            });
        }

        //AppleID.auth.renderButton();
        document.addEventListener('AppleIDSignInOnSuccess', async (event) => {
            // Handle successful response.
            this.loading.action = 'checking';
            await this.signInWithApple(event.detail.authorization);
        });

        // Listen for authorization failures.
        document.addEventListener('AppleIDSignInOnFailure', (event) => {
            // Handle error.
            this.loading.action = null;
            console.log(event.detail.error);
            if (event.detail.error === 'popup_closed_by_user' || event.detail.error === 'user_cancelled_authorize') return;
            this.error = event.detail.error;
        });
    },
    computed: {
        createUrl() {
            return '/create' + (this.qs.toString() ? `?${this.qs.toString()}` : '');
        },
    },
    watch: {
        auth_state(val) {
            if (this.auth_state === 'login') {
                this.$nextTick(() => {
                    // AppleID.auth.renderButton();
                    if (typeof google !== 'undefined') {
                        google.accounts.id.renderButton(
                            document.getElementById("google-signin"),
                            { theme: "outline", size: "large", width: 400 }  // customization attributes
                        );
                        google.accounts.id.prompt(n => {
                            // console.log(n);
                        });
                    }
                });
            }
        }
    },
    methods: {
        async clearSelectAccount() {
            this.auth_state = 'checking';
            try {
                const res = await fetch('/api/account/logout', {method: 'POST'});
                if (res.status != 200) throw '';
                this.loading.action = null;
                this.email = '';
                this.name  = '';
                this.auth_state = 'login';
            } catch (e) {
                this.auth_state     = 'loggedin';
                this.error          = 'LogoutError'; // XXX
                this.loading.action = null;
            }
        },
        async signInWithGoogle(creds) {
            if (!creds || !creds.credential) {
                this.error = creds.error || 'UnexpectedError';
                return;
            };
            this.loading.action = 'checking';
            this.auth_state = 'checking';
            try {
                const res  = await fetch('/api/gcb', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recaptcha: await this.recaptcha('roon_login_exchange_google_code'),
                        id_token: creds.credential,
                        id: this._id,
                    })
                });
                if (res.status === 200) {
                    this.getLoginStatus();
                } else if (res.status === 400) {
                    const data = await res.json();
                        this.error = 'Google-' + data.status;
                        this.auth_state = 'login';
                        this.loading.action = null;
                } else {
                    this.error = 'UnexpectedError';
                    this.auth_state = 'login'
                    this.loading.action = null;
                }
            } catch (e) {
                console.log(e);
                this.loading.action = null;
                this.auth_state = 'login';
            }
        },
        async signInWithApple({ code, id_token }) {
            this.loading.action = 'checking';
            this.auth_state = 'checking';
            try {
                const res  = await fetch('/api/acb', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recaptcha: await this.recaptcha('roon_login_enter_credentials_apple'),
                        code,
                        id_token,
                        nonce: this._nonce,
                    })
                });
                const data = await res.json();
                if (data.status === 'Success') {
                    this.getLoginStatus();
                } else {
                    this.error = data.status;
                    this.auth_state = 'login';
                    this.loading.action = null;
                }
            } catch (e) {
                console.log(e)
                this.auth_state = 'login';
                this.loading.action = null;
            } finally {
            }
        },
        appleSignInClicked() {
            this.error = '';
        },
        nonce() {
            const nonceBytes = new Uint8Array(16);
            crypto.getRandomValues(nonceBytes);
            const nonce = btoa(String.fromCharCode.apply(null, nonceBytes));
            this._nonce = nonce;
            return nonce;
        },
        async recaptcha(action) {
            while (!this.loadedGrecaptcha) await new Promise(r => setTimeout(r, 100));
            const p = new Promise((resolve, reject) => {
                grecaptcha.ready(() => {
                    grecaptcha.execute("6LfrZMEUAAAAAFuz9l0Md9_yd8ueYhees004fcCi", { action })
                        .then(r => {
                            resolve(r);
                        })
                        .catch(e => {
                            reject(e);
                        });
                });
            });
            return await p;
        },
        mapQSToState() {
            this.qs        = new URLSearchParams(window.location.search);
            this._id       = this.qs.get('id')        || this.qs.get('client_id'); // support oidc
            this.cb        = this.qs.get('cb')        || this.qs.get('redirect_uri');
            this.state     = this.qs.get('state');
            this.challenge = this.qs.get('challenge') || this.qs.get('code_challenge');
            if ((!this._id && !this.cb) || (!this._id && !this.challenge)) {
                if (!this.editor) window.location.href = "https://account.roon.app/account";
            } else {
                this.getLoginStatus(true);
            }
        },
        async getLoginStatus(getinfo = false) {
            try {
                const res  = await fetch('/api/login/status' + (getinfo ? '?info=1' : ''), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: this._id,
                    })
                });

                if (res.status !== 200) {
                    if (!this.editor) window.location.href = "https://account.roon.app/account";
                    return;
                }

                const data = await res.json();
                const { state, email, name } = data;

                if (getinfo && email && name) {
                    this.email      = email;
                    this.name       = name;
                    this.auth_state = 'loggedin';
                    return;
                }

                if (state === 'loggedin') {
                    // Show continue with xxx or sign into another account
                    const res = await fetch('/api/login/setup-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id:        this._id,
                            recaptcha: await this.recaptcha('roon_login_setup_token'),
                            cb:        this.cb,
                            challenge: this.challenge,
                            state:     this.state
                        })
                    });
                    const data = await res.json();
                    if (data.status === 'Success') {
                        if ((data.redirect && data.redirect.startsWith('/account'))
                            || /\/[a-z][a-z](-[a-zA-Z]+)?\/account/.test(data.redirect || '')
                            || data.redirect === '/admin') {
                            // No need to show redirecting when not leaving site!
                            window.location.href = data.redirect;
                        } else {
                            this.auth_state     = 'redirecting';
                            this.redirect_url   = data.redirect;
                            this.loading.action = null;
                            window.location.href = this.redirect_url;
                        }
                    } else {
                        this.error = data.status;
                        this.auth_state = 'login';
                        this.loading.action = null;
                    }
                } else {
                    this.auth_state = state;
                    if (state === 'confirmapp') {
                        this.appname = data.appname;
                    } else if (state === 'redirect') {
                        this.redirect_url = data.redirect;
                    } else if (state === 'profile') {
                        this.profiles  = data.profiles;
                    }
                    this.loading.action = null;
                }

            } catch (e) {
                console.log(e);
                if (e.status === 400) {
                    console.log("GOTO: /bad-login");
                    //window.location.href = '/bad-login';
                }
                this.loading.action= null;
            } finally {
            }
        },
        async enterCredentials() {
            this.$refs.enterCredentialsBtn.focus();
            this.loading.action = 'enter-credentials';
            try {
                const res = await fetch('/api/login/enter-credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id:        this._id,
                        recaptcha: await this.recaptcha('roon_login_enter_credentials'),
                        email:     this.email,
                        password:  this.password,
                    })
                });
                const data = await res.json();
                if (data.status === 'Success') {
                    this.email = '';
                    this.password = '';
                    this.getLoginStatus();
                } else {
                    this.error = data.status;
                    this.loading.action = null;
                }
            } catch (e) {
                console.log(e)
                this.loading.action = null;
            } finally {
            }
        },
        async cancelTfa() {
            this.loading.action = 'cancel-tfa';
            try {
                const res  = await fetch('/api/login/enter-tfa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id:        this._id,
                        recaptcha: await this.recaptcha('roon_login_enter_tfa'),
                        tfa:       'goback',
                    })
                });
                const data = await res.json();
                if (data.status == 'LoggedOut') {
                    this.tfatoken = '';
                    this.getLoginStatus();
                } else {
                    this.error = data.status;
                }
            } catch (e) {
                console.log(e)
            } finally {
                this.loading.action = null;
            }
        },
        async enterTfa() {
            this.loading.action = 'enter-tfa';
            try {
                const res  = await fetch('/api/login/enter-tfa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id:        this._id,
                        recaptcha: await this.recaptcha('roon_login_enter_tfa'),
                        tfa:       this.tfatoken,
                    })
                });
                console.log(res.status)
                if (res.status == 200) {
                    this.tfatoken = '';
                    this.getLoginStatus();
                } else {
                    const data = await res.json();
                    this.error = data.status;
                    this.loading.action = null;
                }
            } catch (e) {
                console.log(e)
                this.loading.action = null;
            } finally {
            }
        },
        async pickProfile(profile) {
            this.loading.action = 'pick-profile';
            try {
                const res  = await fetch('/api/login/pick-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id:        this._id,
                        recaptcha: await this.recaptcha('roon_login_pick_profile'),
                        profileid:  profile.id
                    })
                });
                if (res.status === 200) {
                    this.getLoginStatus();
                } else {
                    const data = await res.json();
                    this.error = data.status;
                }
            } catch (e) {
                console.log(e)
            } finally {
                this.loading.action = null;
            }
        },
        async backToLogin() {
            this.loading.action = 'cancel-pick-profile';
            try {
                const res  = await fetch('/api/login/pick-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id:        this._id,
                        recaptcha: await this.recaptcha('roon_login_pick_profile'),
                        profileid:  'goback'
                    })
                });
                const data = await res.json();
                if (data.status === 'LoggedOut') {
                    this.auth_state = 'login';
                    this.getLoginStatus();
                } else {
                    this.error = data.status;
                }
            } catch (e) {
                console.log(e)
            } finally {
                this.loading.action = null;
            }
        },
        async confirmApp(confirmapp_result) {
            this.loading.action = confirmapp_result == 'canceled' ? 'cancel-confirm-app' : 'confirm-app';
            try {
                const res  = await fetch('/api/login/confirm-app', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id:        this._id,
                        recaptcha: await this.recaptcha('roon_login_confirm_app'),
                        confirmapp_result
                    })
                });
                const data = await res.json();
                if (data.status === 'Success') {
                    // XXX Redirect to app
                    this.getLoginStatus();
                } else if (data.status === 'Canceled') {
                    // XXX Redirect to app
                    this.auth_state = 'redirecting'
                    this.redirect_url = data.redirect;
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 2000);
                } else {
                    this.error = data.status;
                }
            } catch (e) {
                console.log(e)
            } finally {
                this.loading.action = null;
            }
        },

    }
}
</script>
<style>
.grecaptcha-badge {
    visibility: hidden;
}
</style>
<style lang="scss" scoped>
* {
    box-sizing: border-box;
}

form :deep(.appname) {
    font-weight: bold;
    color: #6059ef;
}

.account-picker {
    padding: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    border-radius: 4px;
    &:hover {
        background-color: #ddd;
    }
}

.box {
    width: 400px;
    padding-bottom: 100px;

    display: flex;
    flex-direction: column;
    justify-content: center;
}

@media only screen and (max-width: 420px) {
    .box {
        width: 100%;
        padding-left: 10px;
        padding-right: 10px;
    }
    .error-message {
        width: 100% !important;
    }
}

label {
    color: #777;
    margin-bottom: 0.5rem;
}

input {
    box-shadow: inset 0 0.0625em 0.125em rgb(10 10 10 / 5%);
    max-width: 100%;
    width: 100%;
    background-color: #fff;
    border: 1px solid;
    border-color: #dbdbdb;
    border-radius: 4px;
    color: #363636;
    -webkit-appearance: none;
    align-items: center;
    border-radius: 4px;
    display: inline-flex;
    font-size: 1rem;
    justify-content: flex-start;
    line-height: 1.5;
    padding-bottom: calc(0.5em - 1px);
    padding-left: calc(0.75em - 1px);
    padding-right: calc(0.75em - 1px);
    padding-top: calc(0.5em - 1px);
    position: relative;
    vertical-align: top;
}

button:hover, input:hover {
    border-color: #b5b5b5;
}

button {
    width: 100%;
    color: white;
    border-color: #dbdbdb;
    border-width: 1px;
    border: 1px solid transparent;
    cursor: pointer;
    justify-content: center;
    padding-bottom: calc(0.5em - 1px);
    padding-left: 1em;
    padding-right: 1em;
    padding-top: calc(0.5em - 1px);
    text-align: center;
    white-space: nowrap;
    height: 2.5em;
    line-height: 1.5;
    border-radius: 4px;
    font-size: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;

    &:disabled {
        opacity: 1 !important;
    }

    &:focus {
        outline: 2px solid rgba(var(--color-3-bg), 0.5);
    }
}

.googlebutton {
    border-color:     lightgray !important;
    color:            black !important;
    background-color: white !important;
    border-width:     1.5px    !important;
    gap:              15px;
    display:          flex;
    align-items:      center;
}
.googlebutton:hover {
    background-color: #fafaff !important;
}

.error-message {
    left: 0;
    right: 0;
    text-align: center;
    cursor: pointer;
    width: 100vw;
    border-color: #f14668;
    color: #fff;
    border-style: solid;
    border-width: 0;
    padding: 2em;
    display: block;
    background-color: #ff0000;
    position: fixed;
    bottom: -500px;
    transition: bottom .5s ease;
    font-weight: bold;
}

form {
    margin: 0;
    padding: 0;
}
.rows {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: -10px;
}
.row {
    display: flex;
    gap: 20px;
    align-items: center;
    cursor: pointer;
    padding: 10px;
    border-radius: 10px;
}

.row:hover {
    background-color: #f0f0f0;
}
.row img {
    width: 60px;
    height: 60px;
    border-radius: 60px;
}

.loading-spinner {
    border: 4px solid transparent;
    border-top: 4px solid rgb(32, 57, 243);
    border-radius: 50%;
    width: 18px;
    height: 18px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

.loading-spinner-white {
    border: 4px solid transparent;
    border-top: 4px solid #fff;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>

