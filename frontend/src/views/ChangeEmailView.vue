<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-app-600 rounded-lg flex items-center justify-center">
          <span class="mdi mdi-email-edit text-white text-2xl"></span>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Reset Email Address
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your current email address to receive a reset link
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form v-if="status !== 'Success'" @submit.prevent="submit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div class="mt-1 relative">
              <input
                id="email"
                ref="email"
                v-model.trim="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-app-500 focus:border-app-500 sm:text-sm"
                placeholder="Enter your email address"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span class="mdi mdi-email text-gray-400"></span>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-app-600 hover:bg-app-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading" class="mdi mdi-loading mdi-spin mr-2"></span>
              <span v-else class="mdi mdi-send mr-2"></span>
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
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
                  Reset link sent!
                </h3>
                <div class="mt-2 text-sm text-green-700">
                  <p>An email reset link has been sent. Please check the email you entered for a link to reset it.</p>
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
                  <p>{{ getErrorMessage(status) }}</p>
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
              to="/login"
              class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-500"
            >
              <span class="mdi mdi-arrow-left mr-2"></span>
              Back to Sign In
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChangeEmailView',
  data() {
    return {
      email: '',
      status: null,
      loading: false
    }
  },
  mounted() {
    // Auto-populate email from query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      this.email = emailParam;
    }

    // Check if there's a code parameter (redirect to step 2)
    const code = urlParams.get('code');
    if (code) {
      this.$router.push(`/reset-email-confirm?code=${encodeURIComponent(code)}`);
      return;
    }

    // Focus email input
    this.$nextTick(() => {
      if (this.$refs.email) {
        this.$refs.email.focus();
      }
    });

    // Auto-submit if auto parameter is present
    if (urlParams.get('auto')) {
      this.submit();
    }
  },
  methods: {
    async submit() {
      try {
        this.status = null;
        this.loading = true;

        if (!this.email) {
          this.status = 'EmptyEmail';
          this.$refs.email.focus();
          return;
        }

        if (!(/.@.*\..*$/.test(this.email))) {
          this.status = 'InvalidEmail';
          this.$refs.email.focus();
          return;
        }

        const response = await fetch('/api/account/reset-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: this.email })
        });

        const data = await response.json();

        if (data.status === 'Success') {
          this.status = 'Success';
        } else if (data.status === 'NotFound') {
          this.status = 'EmailNotFound';
          this.$refs.email.focus();
        } else {
          console.error('Reset email error:', data);
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
        'EmptyEmail': 'Email Required',
        'InvalidEmail': 'Invalid Email',
        'EmailNotFound': 'Email Not Found',
        'UnexpectedError': 'Unexpected Error',
        'NetworkFailure': 'Network Error'
      };
      return titles[status] || 'Error';
    },

    getErrorMessage(status) {
      const messages = {
        'EmptyEmail': 'Please enter an email address.',
        'InvalidEmail': 'Please check your email address for mistakes.',
        'EmailNotFound': 'This email is not associated with an account. Please enter an email associated with an account.',
        'UnexpectedError': 'There was an unexpected error resetting your email. Please wait a while and try again.',
        'NetworkFailure': 'There was a network error communicating. Please check your network and try again.'
      };
      return messages[status] || 'An unknown error occurred.';
    }
  }
}
</script>
