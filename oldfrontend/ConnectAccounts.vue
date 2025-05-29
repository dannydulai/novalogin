<widget>
{
    name: "ConnectAccounts",
    tags: [ 'web', 'custom' ],
    description: "Connect Roon account to third-party accounts",
    properties: [
    ],
    strings: {
        title: { value: "Connect to third-party accounts" },
        subtitle: { value: "Select from the providers below to connect a third-party account to your Roon Account:" },
        back_to_account: { value: "Back to account" },
        google_description: { value: "Link your Roon account to Google for seamless sign-in using your Google credentials." },
        apple_description: { value: "Link your Roon account with Apple for effortless sign-in utilizing your Apple ID." },
        error: { value: "An error occurred. Please try again later." },
        loading: { value: "Loading..." },
    },
}
</widget>
<style>
.grecaptcha-badge {
    visibility: hidden;
}
</style>
<style lang="scss" scoped>
@import './account.scss';
.row {
    cursor: pointer; 
    display: flex; 
    gap: 8px;
    align-items: center; 
    font-size: 1.2rem;

    box-shadow: 0px 0px 3px 0px #dadce0;
    border-radius: 4px;

    padding: 1rem;

    &:hover {
        background-color: #f0f0f0;
    }
}
.rows {
    gap: 2rem; 
    display: flex; 
    justify-content: center;

    @media screen and (max-width: 768px) {
        flex-direction: column;
    }
}
</style>
<template>
    <div class="mainbody" :style="[ userid ? 'background-color: #ebffde;' : '']">
        <div v-if="!loading">
            <div style="width: 100%; text-align: left;">
                <a class="text" :href="href('/account')"><span>&larr;&nbsp;</span><pr-text path="t.back_to_account"></pr-text></a>
            </div>
            <h1 style="margin-bottom: 3rem;"><pr-text path="t.title"></pr-text></h1>
            <p><pr-text path="t.subtitle"></pr-text></p>
            <br>
            <div class="rows" >
                <div 
                    @click="connectGoogle"
                    class="row">
                    <div style="display: flex; justify-content: center; align-items: center; margin-right: 0.5rem;">
                        <svg style="fill: white !important; height: 60px;" viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr"><g><path d="M18.977 4.322L16 7.3c-1.023-.838-2.326-1.35-3.768-1.35-2.69 0-4.95 1.73-5.74 4.152l-3.44-2.635c1.656-3.387 5.134-5.705 9.18-5.705 2.605 0 4.93.977 6.745 2.56z" fill="#EA4335"></path><path d="M6.186 12c0 .66.102 1.293.307 1.89L3.05 16.533C2.38 15.17 2 13.63 2 12s.38-3.173 1.05-4.533l3.443 2.635c-.204.595-.307 1.238-.307 1.898z" fill="#FBBC05"></path><path d="M18.893 19.688c-1.786 1.667-4.168 2.55-6.66 2.55-4.048 0-7.526-2.317-9.18-5.705l3.44-2.635c.79 2.42 3.05 4.152 5.74 4.152 1.32 0 2.474-.308 3.395-.895l3.265 2.533z" fill="#34A853"></path><path d="M22 12c0 3.34-1.22 5.948-3.107 7.688l-3.265-2.53c1.07-.67 1.814-1.713 2.093-3.063h-5.488V10.14h9.535c.14.603.233 1.255.233 1.86z" fill="#4285F4"></path></g></svg>
                    </div>
                    <div>
                        <div>
                            Google
                        </div>
                        <div style="font-size: 1rem; color: #aaa;">
                            <pr-text path="t.google_description"></pr-text>
                        </div>
                    </div>
                </div>
                <div 
                    @click="connectApple"
                    class="row">
                    <div style="cursor: pointer; display: flex; justify-content: center; align-items: center; margin-right: 0.5rem; border-radius: 4px;">
                        <img 
                            src="https://static-pr.roonlabs.net/200w-gdrive-1VEKofSUpMgZTkpKqk0HEpVGOST-TbMFi.png" 
                            style="filter: invert(1); height: 60px; margin-top: 2px;">
                    </div>
                    <div>
                        <div>
                            Apple
                        </div>
                        <div style="font-size: 1rem; color: #aaa;">
                            <pr-text path="t.apple_description"></pr-text>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p><pr-text path="t.loading"></pr-text></p>
        </div>
        <div v-if="error" class="error-message">
            <p><pr-text path="t.error"></pr-text></p>
        </div>
    </div>
</template>
<script>
export default {
    name: 'ConnectAccounts',
    inject: ['tstrings', 'lang'],
    data() {
        return {
            loading: true,
            error: false,
            userid: null,
            code: null,
            _nonce: null,
        };
    },
    created() {
        if (typeof window !== 'undefined') {
            const qs = new URLSearchParams(window.location.search);
            this.userid = qs.get('userid');
            this.code = qs.get('code');

            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },
    async mounted() {
        document.addEventListener('AppleIDSignInOnSuccess', async (event) => {
            // Handle successful response.
            this.loading = true;
            await this.signInWithApple(event.detail.authorization);
        });

        // Listen for authorization failures.
        document.addEventListener('AppleIDSignInOnFailure', (event) => {
            // Handle error.
            this.loading = false;
            console.log(event.detail.error);
            if (event.detail.error === 'popup_closed_by_user') return;
            this.error = event.detail.error;
        });
        if (this.code) {
            await this.connectGoogle2();
        } else {
            this.loading = false;
        }
    },
    methods: {
        nonce() {
            const nonceBytes = new Uint8Array(16);
            crypto.getRandomValues(nonceBytes);
            const nonce = btoa(String.fromCharCode.apply(null, nonceBytes));
            this._nonce = nonce;
            return nonce;
        },
        async connectGoogle2() {
            this.loading = true;
            try {
                const res  = await fetch('/api/6/connect-google-2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: this.code
                    })
                });
                
                if (res.status === 401) {
                    window.location = this.href('/account');
                    return;
                }

                const data = await res.json();
                if (data.status === 'Success') {
                    window.location = this.href('/account');
                    return;
                } else {
                    this.error = data.status;
                    this.loading = false;
                }
            } catch (e) {
                console.log(e)
                this.loading = false;
            } finally {
            }
        },
        async connectGoogle() {
            this.loading = true;
            try {
                const res  = await fetch('/api/6/connect-google-1', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (res.status === 401) {
                    window.location = this.href('/account');
                    return;
                }
                const data = await res.json();
                if (data.status === 'Success') {
                    // Off to google!
                    window.location.href = data.redirect;
                    return;
                } else {
                    this.error = data.status;
                    this.loading = false;
                }
            } catch (e) {
                console.log(e)
                this.loading = false;
            } finally {
            }
        },
        async signInWithApple({ code, id_token }) {
            this.loading = true;
            try {
                const res  = await fetch('/api/6/connect-apple', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code,
                        id_token,
                        nonce: this._nonce
                    })
                });
                if (res.status === 401) {
                    window.location.href = this.href('/account');
                    return;
                }
                if (res.status === 200) {
                    window.location.href = this.href('/account');
                    return;
                } else {
                    console.log(res.status);
                    this.error = true;
                }
            } catch (e) {
                console.log(e)
            } finally {
                this.loading = false;
            }
        },
        connectApple() {
            AppleID.auth.init({
                clientId :     'com.roon.website.signin',
                scope :        'name email',
                redirectURI :  window.location.origin + '/login/acb',
                state :        null,
                nonce :        this.nonce(),
                usePopup :     true 
            });
            AppleID.auth.signIn();
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
    }
}
</script>
<style scoped>
.loading-state, .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin-top: 1rem;
}

.loading-spinner {
    border: 4px solid transparent;
    border-top: 4px solid #6059ef;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
