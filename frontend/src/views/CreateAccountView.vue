<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center sm:p-4 relative">
    <div class="bg-white sm:rounded-xl sm:shadow-lg p-6 sm:p-8 w-full sm:max-w-md md:max-w-lg">
      <div class="text-center mb-6">
        <div class="flex justify-center mb-2">
          <img v-if="$config.appLogo" :src="$config.appLogo" alt="Logo" class="h-24 sm:h-28">
          <span v-else class="mdi mdi-key-variant text-4xl sm:text-5xl text-app-500"></span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">Create your account</h1>
        <p class="text-gray-500 mt-2">Join {{ clientAppName || $config.appName }} today</p>
      </div>
      
      <form @submit.prevent="submit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2" for="firstname">
              First name
            </label>
            <input 
              type="text" 
              id="firstname" 
              v-model.trim="firstname"
              ref="firstname"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-500"
              required
              autocomplete="given-name"
            />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2" for="lastname">
              Last name
            </label>
            <input 
              type="text" 
              id="lastname" 
              v-model.trim="lastname"
              ref="lastname"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-500"
              required
              autocomplete="family-name"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-gray-700 text-sm font-medium mb-2" for="email">
            Email
          </label>
          <input 
            type="email" 
            id="email" 
            v-model.trim="email"
            ref="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-500"
            required
            autocomplete="email"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2" for="password">
              Password
            </label>
            <input 
              type="password" 
              id="password" 
              v-model="password1"
              ref="password1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-500"
              required
              autocomplete="new-password"
              minlength="4"
            />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2" for="confirm-password">
              Confirm password
            </label>
            <input 
              type="password" 
              id="confirm-password" 
              v-model="password2"
              ref="password2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-500"
              required
              autocomplete="new-password"
              minlength="4"
            />
          </div>
        </div>
        
        <button 
          type="submit"
          class="w-full bg-app-500 hover:bg-app-600 text-white font-medium py-2 px-4 rounded-lg transition flex justify-center items-center"
        >
          <span v-if="!loading">Create account</span>
          <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </button>
      </form>
      
      <div class="text-center mt-4 text-sm text-gray-600">
        Already have an account? 
        <a :href="signInUrl" class="font-semibold text-app-500 hover:text-app-600">
          Sign in
        </a>
      </div>

      <div v-if="status" 
           class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mt-6 relative cursor-pointer"
           @click="status = null">
        <span class="absolute top-2 right-2 text-red-500">&times;</span>
        
        <div v-if="status === 'error_account_exists'">
          <p>An account already exists with this email. Please try to sign in <a href="/login" class="text-red-700 font-bold underline">here</a> with the correct password.</p>
        </div>
        
        <div v-else-if="status === 'error_invalid_email'">
          <p>Invalid Email. Please check your Email address and try again.</p>
        </div>
        
        <div v-else-if="status === 'error_invalid_name'">
          <p>Invalid Name. Please check your first and last name and try again.</p>
        </div>
        
        <div v-else-if="status === 'error_invalid_password'">
          <p>Invalid Password. Please check your password and try again.</p>
        </div>
        
        <div v-else-if="status === 'error_passwords_dont_match'">
          <p>Your password confirmation does not match. Please try again.</p>
        </div>
        
        <div v-else-if="status === 'error_network'">
          <p>Create an account failed due to network error. Please check your connection and try again.</p>
        </div>
        
        <div v-else>
          <p>Create an account failed: InvalidRequest. Please try again.</p>
        </div>
      </div>

      <!-- Powered by NovaLogin footer -->
      <div v-if="!$config.hidePoweredBy" class="text-center mt-6">
        <div class="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-sm text-gray-600">
          <span>Powered by</span>
          <a href="https://novalogin.io" target="_blank" rel="noopener"  class="font-medium ml-1 flex items-center hover:underline text-app-600">
            <span class="mdi mdi-space-invaders text-xl mr-1"></span>
            NovaLogin
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../config';
export default {
  name: 'CreateAccountView',
  data() {
    return {
      email: '',
      password1: '',
      password2: '',
      firstname: '',
      lastname: '',
      status: null,
      loading: false,
      qs: {},
      clientAppName: ''
    }
  },
  computed: {
    signInUrl() {
      const qs = {...this.qs};
      let q = Object.entries(qs)
          .map(k => `${encodeURIComponent(k[0])}=${encodeURIComponent(k[1])}`)
          .join('&');
      if (q) q = `?${q}`;
      return `/login${q}`
    }
  },
  mounted() {
    // Build query string parameters
    const querystring = window.location.search;
    const pairs = (querystring[0] === "?" ? querystring.substr(1) : querystring).split("&");
    pairs.filter(p => p !== '').forEach((pair) => {
      const [key, value] = pair.split("=");
      this.qs[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
    
    // Clean up query string
    const search = location.search
      .replace(/&?tid=[^&]*/g, "")    // remove tid query param
      .replace(/\?&?$/, "")           // remove ? and & if there are no params left
      .replace(/\?&(.+)/, "?$1")      // remove & if it immediately follows ?
    ;
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + search + window.location.hash
    );

    // Pre-fill fields from query params
    this.email = this.qs.email || "";
    this.firstname = this.qs.fname || "";
    this.lastname = this.qs.lname || "";
    this.clientAppName = this.qs.app_name || "";

    // Focus on the first empty field
    if (!this.firstname) this.$refs.firstname.focus();
    else if (!this.lastname) this.$refs.lastname.focus();
    else if (!this.email) this.$refs.email.focus();
    else this.$refs.password1.focus();
  },
  methods: {
    async submit() {
      try {
        this.status = null;
        this.loading = true;

        if (!this.firstname) {
          this.status = 'error_invalid_name';
          this.$refs.firstname.focus();
          return;
        } 
        
        if (!this.lastname) {
          this.status = 'error_invalid_name';
          this.$refs.lastname.focus();
          return;
        } 
        
        if (!this.email) {
          this.status = 'error_invalid_email';
          this.$refs.email.focus();
          return;
        } 
        
        if (!this.password1) {
          this.status = 'error_invalid_password';
          this.$refs.password1.focus();
          return;
        } 
        
        if (!this.password2) {
          this.status = 'error_invalid_password';
          this.$refs.password2.focus();
          return;
        } 
        
        if (this.password1 !== this.password2) {
          this.status = 'error_passwords_dont_match';
          this.$refs.password1.focus();
          return;
        }

        // Get recaptcha token
        const recaptchaToken = await this.recaptcha('login_create_account');
        
        // Prepare request data
        const requestData = {
          ...this.qs,
          firstname: this.firstname,
          lastname: this.lastname,
          email: this.email,
          password: this.password1,
          recaptcha: recaptchaToken
        };
        
        // Add referral code if present
        if (this.qs.r) {
          requestData.referral_code = this.qs.r;
        }

        const response = await fetch("/api/account/create", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        const data = await response.json();

        if (data.status === "Success") {
          // Redirect to login page or account page
          if (this.qs && this.qs.cb) {
            window.location.href = this.qs.cb;
          } else {
            window.location.href = this.signInUrl;
          }
        } else if (data.status === "EmailExists") {
          this.status = 'error_account_exists';
        } else if (data.status === "InvalidName") {
          this.status = 'error_invalid_name';
        } else if (data.status === "InvalidEmail") {
          this.status = 'error_invalid_email';
        } else if (data.status === "InvalidPassword") {
          this.status = 'error_invalid_password';
        } else {
          this.status = 'error_other';
        }
      } catch (e) {
        console.error(e);
        this.status = 'error_network';
      } finally {
        this.loading = false;
      }
    },
    async recaptcha(action) {
      // For development/testing, return a dummy token if recaptcha is not available
      if (!window.grecaptcha || !window.grecaptcha.ready) {
        console.warn('Recaptcha not available, using dummy token');
        return 'dummy-recaptcha-token-for-development';
      }
      
      return new Promise((resolve, reject) => {
        grecaptcha.ready(() => {
          grecaptcha.execute(config.recaptchaSiteKey || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI", { action })
            .then(resolve)
            .catch(error => {
              console.error('Recaptcha error:', error);
              // Still resolve with a dummy token to allow testing
              resolve('dummy-recaptcha-token-for-development');
            });
        });
      });
    }
  }
}
</script>

<style>
.grecaptcha-badge {
  visibility: hidden;
}
</style>
