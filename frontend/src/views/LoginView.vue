<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center sm:p-4 relative">
    <div v-if="auth_state === 'checking'" class="bg-white sm:rounded-xl sm:shadow-lg p-6 sm:p-8 w-full sm:max-w-md md:max-w-lg">
      <div class="flex justify-center py-6">
        <div class="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <div v-else-if="auth_state === 'loggedin'" class="bg-white sm:rounded-xl sm:shadow-lg p-6 sm:p-8 w-full sm:max-w-md md:max-w-lg">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Welcome back!</h1>
        <p class="text-gray-600">Choose an account to continue</p>
      </div>
      
      <div class="mb-4">
        <div @click="() => { auth_state = 'checking'; getLoginStatus() }" 
             class="flex items-center p-3 rounded-lg hover:bg-slate-50 transition cursor-pointer">
          <div class="bg-cyan-500 text-white h-10 w-10 rounded-full flex items-center justify-center font-bold">
            {{(name || '').slice(0,1).toUpperCase()}}
          </div>
          <div class="ml-4">
            <div class="font-medium">{{name}}</div>
            <div class="text-sm text-gray-500">{{email}}</div>
          </div>
        </div>
        
        <hr class="my-3 border-gray-200"/>
        
        <div @click="clearSelectAccount" 
             class="flex items-center p-3 rounded-lg hover:bg-slate-50 transition cursor-pointer">
          <div class="h-10 w-10 flex items-center justify-center text-gray-500">
            <span class="mdi mdi-account-off text-xl"></span>
          </div>
          <div class="ml-4 text-gray-700">Sign out and use another account</div>
        </div>
      </div>

      <div v-if="error" 
           class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mt-4 relative cursor-pointer"
           @click="error = ''">
        <span class="absolute top-2 right-2 text-red-500">&times;</span>
        <p v-if="error === 'LogoutError'">There was an error logging out, please try again.</p>
        <p v-else>Unexpected error, please try again.</p>
      </div>
    </div>

    <div v-else-if="auth_state === 'tfa'" class="bg-white sm:rounded-xl sm:shadow-lg p-6 sm:p-8 w-full sm:max-w-md md:max-w-lg">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Verification</h1>
        <p class="text-gray-600">Multi-factor protection</p>
      </div>
      
      <p class="text-center text-gray-500 mb-6">Please verify yourself by entering the token from your authenticator app.</p>

      <form @submit.prevent="enterTfa">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-medium mb-2" for="token">
            Token from authenticator app
          </label>
          <input 
            type="text" 
            id="token" 
            v-model="tfatoken"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>
        
        <button 
          type="submit"
          class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition flex justify-center items-center"
        >
          <span v-if="loading.action !== 'enter-tfa'">Submit</span>
          <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </button>
        
        <button 
          @click.prevent="cancelTfa"
          class="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg transition mt-2"
        >
          Cancel
        </button>
      </form>

      <div v-if="error" 
           class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mt-4 relative cursor-pointer"
           @click="error = ''">
        <span class="absolute top-2 right-2 text-red-500">&times;</span>
        <p>Please enter the token from your authenticator app.</p>
      </div>
    </div>

    <div v-else-if="auth_state === 'appforbidden'" class="bg-white sm:rounded-xl sm:shadow-lg p-6 sm:p-8 w-full sm:max-w-md md:max-w-lg">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Access Forbidden</h1>
      </div>
      
      <p class="text-center text-gray-600 mb-6">
        You do not have access to <span class="font-bold">{{forbiddenname}}</span>.
      </p>
      
      <button 
        @click="gotoaccount"
        class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition"
      >
        Go to your account
      </button>
    </div>

    <div v-else-if="auth_state === 'confirmapp'" class="bg-white sm:rounded-xl sm:shadow-lg p-6 sm:p-8 w-full sm:max-w-md md:max-w-lg">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Welcome back!</h1>
      </div>
      
      <div class="mb-6">
        <h2 class="text-xl font-bold text-center mb-4">Make sure you downloaded this app</h2>
        <p class="text-gray-600 mb-3">
          Do not sign into <span class="font-bold text-cyan-600">{{appname}}</span> unless you downloaded it from Keyflow.
        </p>
        <p class="text-gray-600 mb-3">
          If you did download <span class="font-bold text-cyan-600">{{appname}}</span> from Keyflow, it is asking you to sign in again now because your previous session expired or there has been an important update.
        </p>
        <p class="text-gray-600">
          If you cannot confirm that you downloaded <span class="font-bold text-cyan-600">{{appname}}</span> from Keyflow, delete it now.
        </p>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-3">
        <button 
          @click.prevent="confirmApp('canceled')"
          class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition flex justify-center items-center"
        >
          <span v-if="loading.action !== 'cancel-confirm-app'">Cancel</span>
          <div v-else class="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
        </button>
        
        <button 
          @click.prevent="confirmApp('confirmed')"
          class="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition flex justify-center items-center"
        >
          <span v-if="loading.action !== 'confirm-app'">Sign in</span>
          <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </button>
      </div>
    </div>

    <div v-else-if="auth_state === 'redirecting'" class="bg-white sm:rounded-xl sm:shadow-lg p-6 sm:p-8 w-full sm:max-w-md md:max-w-lg">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <span class="mdi mdi-key-variant text-5xl text-cyan-500"></span>
        </div>
        <h2 class="text-xl font-medium text-gray-800 mb-4">Redirecting, please wait...</h2>
        <p class="text-gray-600">
          <a :href="redirect_url" class="text-cyan-600 hover:text-cyan-800">
            If this doesn't continue after a few seconds, click here to continue.
          </a>
        </p>
      </div>
    </div>

    <div v-else-if="auth_state === 'login'" class="bg-white sm:rounded-xl sm:shadow-lg p-6 sm:p-8 w-full sm:max-w-md md:max-w-lg">
      <div class="text-center mb-6">
        <div class="flex justify-center mb-2">
          <img v-if="$config.appLogo" :src="$config.appLogo" alt="Logo" class="h-24 sm:h-28">
          <span v-else class="mdi mdi-key-variant text-4xl sm:text-5xl" :class="$config.primaryColorClass || 'text-cyan-500'"></span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
          {{ clientAppName || `Welcome to ${$config.appName}` }}
        </h1>
      </div>
      
      <form @submit.prevent="enterCredentials">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-medium mb-2" for="email">
            Email
          </label>
          <input 
            type="email" 
            id="email" 
            v-model="email"
            @input="error = ''"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
            autocomplete="email"
          />
        </div>
        
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-medium mb-2" for="password">
            Password
          </label>
          <input 
            type="password" 
            id="password" 
            v-model="password"
            @input="error = ''"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
            autocomplete="current-password"
          />
        </div>
        
        <button 
          ref="enterCredentialsBtn"
          type="submit"
          :disabled="!email || !password"
          class="cursor-pointer bg-cyan-500 hover:bg-cyan-600 transition-colors w-full text-white font-medium py-2 px-4 rounded-lg transition flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading.action !== 'enter-credentials'">Sign in</span>
          <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </button>
        
        <div class="text-center mt-2">
          <a :href="'/reset?email=' + encodeURIComponent(email)" class="text-sm text-gray-500 hover:text-gray-700">
            Forgot password?
          </a>
        </div>
      </form>
      
      <div v-if="$config.googleClientId || $config.appleClientId" class="flex items-center my-5 sm:my-6">
        <hr class="flex-1 border-gray-200">
        <span class="px-2 sm:px-3 text-xs sm:text-sm text-gray-500 uppercase font-bold">or</span>
        <hr class="flex-1 border-gray-200">
      </div>
      
      <div v-if="$config.googleClientId" id="google-signin" class="mb-3"></div>
      
      <div v-if="$config.appleClientId" id="appleid-signin" class="mb-6"></div>
      
      <div class="text-center text-sm text-gray-600">
        Don't have an account? 
        <router-link :to="'/create' + (qs.toString() ? `?${qs.toString()}` : '')" class="font-semibold text-cyan-500 hover:text-cyan-600">
          Sign up
        </router-link>
      </div>

      <div v-if="error" 
           class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mt-4 relative cursor-pointer"
           @click="error = ''">
        <span class="absolute top-2 right-2 text-red-500">&times;</span>
        
        <div v-if="error === 'Unauthorized'">
          Invalid Password. Please check your password and try again.
        </div>
        
        <div v-else-if="error === 'NotFound'">
          <p>There is no account with this email address.</p>
          <p class="font-bold">{{email}}</p>
          <p>Check the email address and try again.</p>
        </div>
        
        <div v-else-if="error === 'TryAgain'">
          Unexpected state when signing in. Please try again.
        </div>
        
        <div v-else-if="error === 'NeedsAssociation'">
          <p>No Keyflow account associated with this Apple ID.</p>
          <p>Please use a different Apple ID or log in with your email and password.</p>
        </div>
        
        <div v-else-if="error === 'Google-NotFound'">
          <p>No Keyflow account associated with this Google account.</p>
          <p>Please use a different Google account or log in with your email and password.</p>
        </div>
        
        <div v-else>
          There was an error logging in: {{error}}
        </div>
      </div>
    </div>
    
    <!-- Powered by NovaLogin footer -->
    <div v-if="!$config.hidePoweredBy" class="absolute bottom-2 w-full text-center">
      <div class="inline-flex items-center px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-sm text-gray-600">
        <span>Powered by</span>
        <a href="https://novalogin.io" target="_blank" rel="noopener"  class="font-medium ml-1 flex items-center hover:underline text-cyan-600">
          <span class="mdi mdi-space-invaders text-xl mr-1"></span>
          NovaLogin
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../config';
export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      name: '',
      loading: { action: null },
      loaded_grecaptcha: false,
      auth_state: 'checking',
      forbiddenname: '',
      error: '',
      challenge: '',
      _id: '',
      cb: '',
      state: '',
      email: '',
      password: '',
      redirect_url: '',
      appname: '',
      clientAppName: '',
      tfatoken: '',
      _nonce: null,
      qs: new URLSearchParams()
    };
  },
  mounted() {
    this.loadedGrecaptcha = true;
    //const grepcaptchasrc = document.createElement('script');
    //grepcaptchasrc.onload = () => { this.loadedGrecaptcha = true; };
    //grepcaptchasrc.setAttribute('src', 'https://www.google.com/recaptcha/api.js?render=xxx');
    //document.head.appendChild(grepcaptchasrc);

    // Pick out any params
    this.mapQSToState();
    
    //if (typeof AppleID !== 'undefined') {
    //  AppleID.auth.init({
    //    clientId: 'com.keyflow.website.signin',
    //    scope: 'name email',
    //    redirectURI: window.location.origin + '/login/acb',
    //    state: JSON.stringify({ challenge: this.challenge, id: this._id, cb: this.cb, state: this.state }),
    //    nonce: this.nonce(),
    //    usePopup: true 
    //  });
    //}
    
    console.log('google', typeof google, this.$config);
    if (typeof google !== 'undefined' && this.$config.googleClientId) { 
      google.accounts.id.initialize({
        client_id: this.$config.googleClientId,
        callback: this.signInWithGoogle
      });
    }

    this.$nextTick(() => {
      //if (typeof AppleID !== 'undefined') {
      //  AppleID.auth.renderButton();
      //}
      
      if (typeof google !== 'undefined' && this.auth_state === 'login' && this.$config.googleClientId) {
        google.accounts.id.renderButton(
          document.getElementById("google-signin"),
          { theme: "outline", size: "large", width: "100%" }
        );
        google.accounts.id.prompt();
      }
    });

    ///if (typeof AppleID !== 'undefined') {
    ///  document.addEventListener('AppleIDSignInOnSuccess', async (event) => {
    ///    this.loading.action = 'checking';
    ///    await this.signInWithApple(event.detail.authorization);
    ///  });

    ///  document.addEventListener('AppleIDSignInOnFailure', (event) => {
    ///    this.loading.action = null;
    ///    console.log(event.detail.error);
    ///    if (event.detail.error === 'popup_closed_by_user' || event.detail.error === 'user_cancelled_authorize') return;
    ///    this.error = event.detail.error;
    ///  });
    ///}
  },
  computed: {
  },
  watch: {
    auth_state(val) {
      if (this.auth_state === 'login') {
        this.$nextTick(() => {
          if (typeof AppleID !== 'undefined') {
            AppleID.auth.renderButton();
          }
          
          if (typeof google !== 'undefined') {
            google.accounts.id.renderButton(
              document.getElementById("google-signin"),
              { theme: "outline", size: "large", width: 400 }
            );
            google.accounts.id.prompt();
          }
        });
      }
    }
  },
  methods: {
    gotoaccount() {
      window.location.href = '/account';
    },
    async clearSelectAccount() {
      this.auth_state = 'checking';
      try {
        const res = await fetch('/api/account/logout', {method: 'POST'});
        if (res.status != 200) throw '';
        this.loading.action = null;
        this.email = '';
        this.name = '';
        this.auth_state = 'login';
      } catch (e) {
        this.auth_state = 'loggedin';
        this.error = 'LogoutError';
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
        const res = await fetch('/api/login/gcb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recaptcha: await this.recaptcha('keyflow_login_exchange_google_code'),
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
    //async signInWithApple({ code, id_token }) {
    //  this.loading.action = 'checking';
    //  this.auth_state = 'checking';
    //  try {
    //    const res = await fetch('/api/acb', {
    //      method: 'POST',
    //      headers: { 'Content-Type': 'application/json' },
    //      body: JSON.stringify({
    //        recaptcha: await this.recaptcha('keyflow_login_enter_credentials_apple'),
    //        code,
    //        id_token,
    //        nonce: this._nonce,
    //      })
    //    });
    //    const data = await res.json();
    //    if (data.status === 'Success') {
    //      this.getLoginStatus();
    //    } else {
    //      this.error = data.status;
    //      this.auth_state = 'login';
    //      this.loading.action = null;
    //    }
    //  } catch (e) {
    //    console.log(e)
    //    this.auth_state = 'login';
    //    this.loading.action = null;
    //  }
    //},
    //appleSignInClicked() {
    //  this.error = '';
    //},
    nonce() {
      const nonceBytes = new Uint8Array(16);
      crypto.getRandomValues(nonceBytes);
      const nonce = btoa(String.fromCharCode.apply(null, nonceBytes));
      this._nonce = nonce;
      return nonce;
    },
    async recaptcha(action) {
      while (!this.loadedGrecaptcha) await new Promise(r => setTimeout(r, 100));
        return null
      const p = new Promise((resolve, reject) => {
        grecaptcha.ready(() => {
          grecaptcha.execute("xxx", { action })
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
      this.qs = new URLSearchParams(window.location.search);
      this._id = this.qs.get('id') || this.qs.get('client_id');
      this.cb = this.qs.get('cb') || this.qs.get('redirect_uri');
      this.state = this.qs.get('state');
      this.challenge = this.qs.get('challenge') || this.qs.get('code_challenge');
      // Always continue with the login flow, even without ID/challenge
      // The backend will handle it appropriately
      this.getLoginStatus(true);
    },
    async getLoginStatus(getinfo = false) {
      try {
        const res = await fetch('/api/login/status' + (getinfo ? '?info=1' : ''), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this._id,
          })
        });

        if (res.status !== 200) {
          this.auth_state = 'login';
          this.loading.action = null;
          return;
        }

        const data = await res.json();
        const { state, email, name, clientAppName } = data;

        if (getinfo && email && name) {
          this.email = email;
          this.name = name;
          this.clientAppName = clientAppName || '';
          
          // If no app ID is provided, go directly to account page
          if (!this._id) {
            window.location.href = '/account';
            return;
          }
          
          this.auth_state = 'loggedin';
          return;
        }

        if (state === 'loggedin') {
          // Show continue with xxx or sign into another account
          const res = await fetch('/api/login/setup-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: this._id,
              recaptcha: await this.recaptcha('keyflow_login_setup_token'),
              cb: this.cb,
              challenge: this.challenge,
              state: this.state
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
              this.auth_state = 'redirecting';
              this.redirect_url = data.redirect;
              this.loading.action = null;
              window.location.href = this.redirect_url;
            }
          } else {
            if (data.status === 'AppForbidden') {
              this.forbiddenname = data.name;
              this.auth_state = 'appforbidden';
              return;
            }
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
          }
          this.loading.action = null;
        }

      } catch (e) {
        console.log(e);
        if (e.status === 400) {
          window.location.href = '/bad-login';
        }
        this.loading.action = null;
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
            id: this._id,
            recaptcha: await this.recaptcha('keyflow_login_enter_credentials'),
            email: this.email,
            password: this.password,
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
      }
    },
    async cancelTfa() {
      this.loading.action = 'cancel-tfa';
      try {
        const res = await fetch('/api/login/enter-tfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this._id,
            recaptcha: await this.recaptcha('keyflow_login_enter_tfa'),
            tfa: 'goback',
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
        const res = await fetch('/api/login/enter-tfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this._id,
            recaptcha: await this.recaptcha('keyflow_login_enter_tfa'),
            tfa: this.tfatoken,
          })
        });
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
      }
    },
    async confirmApp(confirmapp_result) {
      this.loading.action = confirmapp_result == 'canceled' ? 'cancel-confirm-app' : 'confirm-app';
      try {
        const res = await fetch('/api/login/confirm-app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this._id,
            recaptcha: await this.recaptcha('keyflow_login_confirm_app'),
            confirmapp_result
          })
        });
        const data = await res.json();
        if (data.status === 'Success') {
          this.getLoginStatus();
        } else if (data.status === 'Canceled') {
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
    }
  }
}
</script>

<style>
.grecaptcha-badge {
  visibility: hidden;
}

#appleid-signin {
  width: 100%;
  height: 40px;
  cursor: pointer;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .min-h-screen {
    min-height: 100vh;
    min-height: -webkit-fill-available;
  }
  
  input, button {
    font-size: 16px; /* Prevents iOS zoom on input focus */
  }
  
  /* Full height on mobile */
  body, html {
    height: 100%;
  }
}

/* Fix for mobile viewport height issues */
@supports (-webkit-touch-callout: none) {
  .min-h-screen {
    height: -webkit-fill-available;
  }
}
</style>
