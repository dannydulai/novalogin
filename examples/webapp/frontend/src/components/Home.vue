<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading your profile...</p>
      </div>

      <!-- Logout State -->
      <div v-else-if="loggingOut" class="text-center">
        <div class="mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto flex items-center justify-center">
            <i class="mdi mdi-check text-white text-3xl"></i>
          </div>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">
          You've been signed out
        </h1>
        <p class="text-gray-600 mb-4">
          Redirecting to login in {{ countdown }} second{{ countdown !== 1 ? 's' : '' }}...
        </p>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-linear"
            :style="{ width: `${((3 - countdown) / 3) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <div class="text-red-500 mb-4">
          <i class="mdi mdi-alert-circle text-4xl"></i>
        </div>
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button 
          @click="fetchUser" 
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- User Profile -->
      <div v-else class="text-center">
        <!-- Avatar -->
        <div class="mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mx-auto flex items-center justify-center">
            <i class="mdi mdi-account text-white text-3xl"></i>
          </div>
        </div>

        <!-- User Info -->
        <h1 class="text-2xl font-bold text-gray-800 mb-2">
          Welcome back!
        </h1>
        
        <div class="space-y-3 mb-6">
          <div v-if="user.user_id" class="flex items-center justify-center text-gray-600">
            <i class="mdi mdi-account-circle text-indigo-500 mr-2"></i>
            <span>{{ user.user_id }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button 
            @click="refreshProfile" 
            class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
          >
            <i class="mdi mdi-refresh mr-2"></i>
            Refresh Profile
          </button>
          
          <button 
            @click="logout" 
            class="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <i class="mdi mdi-logout mr-2"></i>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import NovaAuth from 'vue-nova-login'

export default {
  name: 'Home',
  data() {
    return {
      user: {},
      loading: true,
      error: null,
      loggingOut: false,
      countdown: 3
    }
  },
  async mounted() {
    await this.fetchUser()
  },
  methods: {
    async fetchUser() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/user')
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        this.user = response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load user information'
        console.error('Error fetching user:', err)
      } finally {
        this.loading = false
      }
    },
    
    async refreshProfile() {
      await this.fetchUser()
    },
    
    async logout() {
      this.loggingOut = true;
      this.countdown = 3;
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(countdownInterval);
          this.redirectToLogin();
        }
      }, 1000);
      
      // Perform logout
      await NovaAuth.logout({ to: '/' });
    },
    
    async redirectToLogin() {
      NovaAuth.login();
    },
  }
}
</script>
