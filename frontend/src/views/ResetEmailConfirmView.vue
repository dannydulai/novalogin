<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center">
          <span class="mdi mdi-email-check text-white text-2xl"></span>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Set New Email Address
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your new email address to complete the reset
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form v-if="status !== 'Success'" @submit.prevent="submit" class="space-y-6">
          <div>
            <label for="email1" class="block text-sm font-medium text-gray-700">
              New email address
            </label>
            <div class="mt-1 relative">
              <input
                id="email1"
                ref="email1"
                v-model.trim="email1"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="Enter your new email address"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span class="mdi mdi-email text-gray-400"></span>
              </div>
            </div>
          </div>

          <div>
            <label for="email2" class="block text-sm font-medium text-gray-700">
              Confirm new email address
            </label>
            <div class="mt-1 relative">
              <input
                id="email2"
                ref="email2"
                v-model.trim="email2"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="Confirm your new email address"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span class="mdi mdi-email-check text-gray-400"></span>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading" class="mdi mdi-loading mdi-spin mr-2"></span>
              <span v-else class="mdi mdi-check mr-2"></span>
              {{ loading ? 'Updating...' : 'Update Email Address' }}
            </button>
          </div>
        </form>

        <!-- Status Messages -->
        <div v-if="status" class="mt-6">
          <div 
            v-if="status === 'Success'"
            class="rounded-md bg-green-50 p-4"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <span class="mdi mdi-check-circle text-green-400 text-xl"></span>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  Email updated successfully!
                </h3>
                <div class="mt-2 text-sm text-green-700">
                  <p>Your email has been reset. You may now <router-link to="/account" class="font-medium underline hover:text-green-600">sign in</router-link>.</p>
                </div>
              </div>
            </div>
          </div>

          <div 
            v-else
            class="rounded-md bg-red-50 p-4"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <span class="mdi mdi-alert-circle text-red-400 text-xl"></span>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  {{ getErrorTitle(status) }}
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p v-html="getErrorMessage(status)"></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div class="mt-6">
            <router-link
              to="/change-email"
              class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <span class="mdi mdi-arrow-left mr-2"></span>
              Request New Reset Link
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResetEmailConfirmView',
  data() {
    return {
      email1: '',
      email2: '',
      code: null,
      status: null,
      loading: false
    }
  },
  mounted() {
    // Get code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.code = urlParams.get('code');

    // Redirect if no code
    if (!this.code) {
      this.$router.push('/change-email');
      return;
    }

    // Focus first email input
    this.$nextTick(() => {
      if (this.$refs.email1) {
        this.$refs.email1.focus();
      }
    });
  },
  methods: {
    async submit() {
      try {
        this.status = null;
        this.loading = true;

        if (!this.email1) {
          this.status = 'NoEmail';
          this.$refs.email1.focus();
          return;
        }

        if (this.email1 !== this.email2) {
          this.status = 'BadConfirm';
          this.$refs.email2.focus();
          return;
        }

        const response = await fetch('/api/account/reset-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: this.code,
            email: this.email1
          })
        });

        const data = await response.json();

        if (data.status === 'Success') {
          this.status = 'Success';
        } else if (data.status === 'NotFound') {
          this.status = 'NotFound';
        } else if (data.status === 'InvalidEmail') {
          this.status = 'InvalidEmail';
          this.$refs.email1.focus();
        } else if (data.status === 'EmailExists') {
          this.status = 'EmailExists';
          this.$refs.email1.focus();
        } else {
          console.error('Reset email confirm error:', data);
          this.status = 'UnexpectedError';
        }
      } catch (error) {
        console.error('Network error:', error);
        this.status = 'NetworkFailure';
      } finally {
        this.loading = false;
      }
    },

    getErrorTitle(status) {
      const titles = {
        'NoEmail': 'Email Required',
        'BadConfirm': 'Emails Don\'t Match',
        'NotFound': 'Invalid Reset Link',
        'InvalidEmail': 'Invalid Email',
        'EmailExists': 'Email Already Exists',
        'UnexpectedError': 'Unexpected Error',
        'NetworkFailure': 'Network Error'
      };
      return titles[status] || 'Error';
    },

    getErrorMessage(status) {
      const messages = {
        'NoEmail': 'Please enter a new email address.',
        'BadConfirm': 'Emails don\'t match. Please enter your email again.',
        'NotFound': 'The reset link you followed has expired. Please <a href="/change-email" class="font-medium underline hover:text-red-600">request a new link</a>.',
        'InvalidEmail': 'The email address you entered is invalid. Please type a valid email address.',
        'EmailExists': 'Email already in use by another account. Please enter a different email address.',
        'UnexpectedError': 'There was an unexpected error resetting your email. Please wait a while and try again.',
        'NetworkFailure': 'There was a network error communicating. Please check your network and try again.'
      };
      return messages[status] || 'An unknown error occurred.';
    }
  }
}
</script>
