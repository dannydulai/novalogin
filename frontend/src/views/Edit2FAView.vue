<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-12 h-12 border-4 border-app-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Enable 2FA Section -->
    <div v-else-if="state === 'add'" class="max-w-3xl mx-auto">
      <div class="mb-6">
        <router-link to="/account" class="text-app-600 hover:text-app-800 flex items-center">
          <span class="mdi mdi-arrow-left mr-2"></span>
          Back to account
        </router-link>
      </div>
      
      <h1 class="text-2xl font-bold mb-6">Set up multi-factor authentication</h1>
      
      <!-- Already enabled message -->
      <div v-if="hasTfa" class="text-center text-gray-600 py-4">
        Multi-factor authentication is already enabled on your account.
      </div>
      
      <!-- Setup instructions -->
      <div v-else>
        <ol class="list-decimal pl-6 space-y-4 mb-8">
          <li>
            <p class="text-gray-600">
              Please install an authenticator app to your mobile device. You can use any popular authenticator app, such as 
              <a href="https://support.google.com/accounts/answer/1066447?hl=en&ref_topic=2954345" class="text-app-600 hover:text-app-800">Google Authenticator</a> or 
              <a href="https://www.microsoft.com/en-us/security/mobile-authenticator-app" class="text-app-600 hover:text-app-800">Microsoft Authenticator</a>, but we like 
              <a href="https://ente.io/auth/" target="_blank" class="text-app-600 hover:text-app-800">Ente</a>.
            </p>
          </li>
          <li>
            <p v-if="mode === 'qr'" class="text-gray-600">
              Then open the authenticator app and scan the QR code below to generate a passcode.
            </p>
            <p v-else class="text-gray-600">
              Then open the authenticator app and manually enter the set up key below into the app to generate a passcode.
            </p>
          </li>
          <li>
            <p class="text-gray-600">
              Enter the passcode below.
            </p>
          </li>
        </ol>

        <!-- QR Code or Manual Key Display -->
        <div class="flex justify-center mb-8">
          <div v-if="mode === 'qr'" class="bg-white p-4 rounded-lg shadow-md">
            <img :src="qr" alt="QR Code" class="w-64 h-64" />
          </div>
          <div 
            v-else 
            @click="copyCode" 
            class="bg-gray-100 p-4 rounded-lg shadow-md w-64 h-64 flex flex-col justify-center items-center cursor-pointer"
          >
            <div class="text-center mb-2 text-gray-700">Your set up key</div>
            <div class="font-mono text-lg mb-6 text-center">
              {{ splitIntoChunks(secret, 4).join(' ') }}
            </div>
            <div class="text-gray-500 text-sm">Click to copy</div>
          </div>
        </div>

        <!-- Toggle between QR and manual -->
        <div class="text-center mb-8">
          <button 
            v-if="mode === 'qr'" 
            @click="mode = 'manual'" 
            class="text-app-600 hover:text-app-800"
          >
            Set up manually instead
          </button>
          <button 
            v-else 
            @click="mode = 'qr'" 
            class="text-app-600 hover:text-app-800"
          >
            Setup with QR code instead
          </button>
        </div>

        <!-- Copy success notification -->
        <div 
          v-if="copySuccess" 
          class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded"
        >
          Set up key has been copied to clipboard!
        </div>

        <!-- Token input form -->
        <form @submit.prevent="enableTFA" class="max-w-md mx-auto">
          <div class="mb-4">
            <label for="token" class="block text-sm font-medium text-gray-700 mb-1">
              Passcode from authenticator app
            </label>
            <input 
              type="text" 
              id="token" 
              v-model="enableTFAToken" 
              required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-app-500 focus:border-app-500 sm:text-sm"
            />
          </div>
          <div class="flex flex-col space-y-3">
            <button 
              type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-app-600 hover:bg-app-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-500"
            >
              Submit
            </button>
            <router-link 
              to="/account" 
              class="text-center text-app-600 hover:text-app-800"
            >
              Cancel
            </router-link>
          </div>
        </form>
      </div>
    </div>

    <!-- Disable 2FA Section -->
    <div v-else-if="state === 'remove'" class="max-w-3xl mx-auto">
      <div class="mb-6">
        <router-link to="/account" class="text-app-600 hover:text-app-800 flex items-center">
          <span class="mdi mdi-arrow-left mr-2"></span>
          Back to account
        </router-link>
      </div>
      
      <h1 class="text-2xl font-bold mb-6">Disable multi-factor authentication</h1>
      
      <p class="text-center text-gray-600 mb-4">
        To disable multi-factor authentication, please verify yourself by entering the passcode from your authenticator app.
      </p>
      
      <p class="text-center text-gray-600 mb-8">
        If you do not have access to your authenticator app, please 
        <button @click="lostTfa" class="text-app-600 hover:text-app-800">contact us</button>.
      </p>

      <!-- Token input form -->
      <form @submit.prevent="disableTFA" class="max-w-md mx-auto">
        <div class="mb-4">
          <label for="disable-token" class="block text-sm font-medium text-gray-700 mb-1">
            Passcode from authenticator app
          </label>
          <input 
            type="text" 
            id="disable-token" 
            v-model="disableTFAToken" 
            required
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-app-500 focus:border-app-500 sm:text-sm"
          />
        </div>
        <div class="flex flex-col space-y-3">
          <button 
            type="submit" 
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-app-600 hover:bg-app-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-500"
          >
            Submit
          </button>
          <router-link 
            to="/account" 
            class="text-center text-app-600 hover:text-app-800"
          >
            Cancel
          </router-link>
        </div>
      </form>
    </div>

    <!-- Error Message -->
    <div 
      v-if="error" 
      class="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded max-w-md mx-auto"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="mdi mdi-alert text-xl"></span>
        </div>
        <div class="ml-3">
          <p class="text-sm">
            Please enter the passcode from your authenticator app again.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';

export default {
  name: 'Edit2FAView',
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      copySuccess: false,
      mode: 'qr',
      state: 'add',
      enableTFAToken: '',
      disableTFAToken: '',
      error: false,
      hasTfa: false,
      loading: true,
      qr: null,
      secret: null,
      user: null
    };
  },
  mounted() {
    // Determine if we're adding or removing 2FA
    const query = new URLSearchParams(window.location.search);
    if (query.get('action') === 'remove') {
      this.state = 'remove';
      this.loading = false;
    } else {
      this.getAddPrep();
    }
  },
  methods: {
    // Copy secret to clipboard
    copyCode() {
      navigator.clipboard.writeText(this.secret).then(() => {
        this.copySuccess = true;
        this.toast('Set up key has been copied to clipboard!', {
          type: 'success',
          timeout: 3000
        });
        
        setTimeout(() => {
          this.copySuccess = false;
        }, 3000);
      }).catch(err => {
        this.toast('Failed to copy to clipboard', {
          type: 'error',
          timeout: 3000
        });
      });
    },
    
    // Split secret into chunks for readability
    splitIntoChunks(str, chunkSize) {
      if (!str) return [];
      const numChunks = Math.ceil(str.length / chunkSize);
      const chunks = new Array(numChunks);

      for (let i = 0, o = 0; i < numChunks; ++i, o += chunkSize) {
        chunks[i] = str.substr(o, chunkSize);
      }

      return chunks;
    },
    
    // Contact support for lost 2FA
    lostTfa() {
      this.toast('Please contact support for assistance with lost 2FA access', {
        type: 'info',
        timeout: 5000
      });
    },
    
    // Get 2FA setup information
    async getAddPrep() {
      try {
        const response = await fetch('/api/account/tfa/add-prep', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          this.$router.push('/login');
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'AlreadyEnabled') {
          this.hasTfa = true;
        } else if (data.status === 'Success' && data.qr) {
          this.secret = data.secret;
          this.qr = data.qr;
        } else {
          this.error = true;
          this.toast('Failed to prepare 2FA setup', {
            type: 'error',
            timeout: 3000
          });
        }
      } catch (error) {
        this.error = true;
        this.toast('Server error occurred', {
          type: 'error',
          timeout: 3000
        });
      } finally {
        this.loading = false;
      }
    },
    
    // Enable 2FA
    async enableTFA() {
      try {
        const response = await fetch('/api/account/tfa/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: this.enableTFAToken,
            secret: this.secret
          })
        });
        
        if (response.status === 401) {
          this.$router.push('/login');
          return;
        }
        
        const data = await response.json();
        
        if (response.status === 200 && data.status === 'Success') {
          this.toast('Two-factor authentication enabled successfully', {
            type: 'success',
            timeout: 3000
          });
          this.$router.push('/account');
          return;
        } else if (data.status === 'BadToken') {
          this.error = true;
          this.toast('Invalid passcode. Please try again.', {
            type: 'error',
            timeout: 3000
          });
          
          // If we got a new QR code, update it
          if (data.qr && data.secret) {
            this.qr = data.qr;
            this.secret = data.secret;
          }
        } else if (data.status === 'AlreadyEnabled') {
          this.hasTfa = true;
          this.toast('Two-factor authentication is already enabled', {
            type: 'info',
            timeout: 3000
          });
        } else {
          this.error = true;
          this.toast('Failed to enable 2FA', {
            type: 'error',
            timeout: 3000
          });
        }
      } catch (error) {
        this.error = true;
        this.toast('Server error occurred', {
          type: 'error',
          timeout: 3000
        });
      }
    },
    
    // Disable 2FA
    async disableTFA() {
      try {
        const response = await fetch('/api/account/tfa/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: this.disableTFAToken
          })
        });
        
        if (response.status === 401) {
          this.$router.push('/login');
          return;
        }
        
        if (response.status === 200) {
          this.toast('Two-factor authentication disabled successfully', {
            type: 'success',
            timeout: 3000
          });
          this.$router.push('/account');
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'BadToken') {
          this.error = true;
          this.toast('Invalid passcode. Please try again.', {
            type: 'error',
            timeout: 3000
          });
        } else {
          this.error = true;
          this.toast('Failed to disable 2FA', {
            type: 'error',
            timeout: 3000
          });
        }
      } catch (error) {
        this.error = true;
        this.toast('Server error occurred', {
          type: 'error',
          timeout: 3000
        });
      }
    }
  }
};
</script>
