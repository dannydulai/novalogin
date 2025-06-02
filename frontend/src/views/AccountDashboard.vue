<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="mdi mdi-alert text-xl"></span>
        </div>
        <div class="ml-3">
          <p class="text-sm">{{ error }}</p>
          <button @click="fetchAccountInfo" class="text-sm font-medium text-red-700 hover:text-red-600">
            Try again
          </button>
        </div>
      </div>
    </div>

    <!-- Account content -->
    <div v-else-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column - User info -->
      <div class="lg:col-span-1">
        <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-lg font-medium text-gray-900">Account Information</h2>
            <router-link 
              to="/account/edit-account" 
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-cyan-600 bg-cyan-50 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 cursor-pointer"
            >
              <span class="mdi mdi-pencil mr-1.5"></span>
              Edit
            </router-link>
          </div>
          <div class="p-6">
            <div class="flex items-center mb-6">
              <div class="bg-cyan-500 text-white h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold">
                {{ userInitials }}
              </div>
              <div class="ml-4">
                <h3 class="text-xl font-medium text-gray-900">{{ fullName }}</h3>
                <p class="text-gray-500">{{ user.email }}</p>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-500">Account created</p>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(user.created) }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Last updated</p>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(user.updated) }}</p>
              </div>
              <div v-if="user.referral_code">
                <p class="text-sm font-medium text-gray-500">Referral code</p>
                <div class="mt-1 flex items-center">
                  <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ user.referral_code }}</code>
                  <button 
                    @click="copyToClipboard(user.referral_code)" 
                    class="ml-2 text-cyan-600 hover:text-cyan-800 cursor-pointer"
                    title="Copy to clipboard"
                  >
                    <span class="mdi mdi-content-copy"></span>
                  </button>
                </div>
              </div>
              <div v-if="user.class">
                <p class="text-sm font-medium text-gray-500">Account type</p>
                <p class="mt-1 text-sm text-gray-900">{{ user.class }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Settings -->
        <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div class="px-6 py-5 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Account Settings</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <!-- Multi-Factor Authentication Toggle -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-700">Multi-Factor Authentication</p>
                  <p class="text-xs text-gray-500 mt-1">Add an extra layer of security to your account</p>
                </div>
                <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="tfa-toggle" 
                    class="absolute w-6 h-6 opacity-0 cursor-pointer"
                    :checked="user.tfa_enabled"
                    @change="toggleTFA"
                  />
                  <label 
                    for="tfa-toggle" 
                    class="block h-6 overflow-hidden rounded-full cursor-pointer"
                    :class="user.tfa_enabled ? 'bg-cyan-500' : 'bg-gray-300'"
                  >
                    <span 
                      class="block h-6 w-6 rounded-full transform transition-transform duration-200 ease-in-out bg-white shadow-md"
                      :class="user.tfa_enabled ? 'translate-x-6' : 'translate-x-0'"
                    ></span>
                  </label>
                </div>
              </div>
              
              <!-- Security Links -->
              <div class="bg-gray-50 rounded-lg p-4 mt-4">
                <p class="text-sm text-gray-600 mb-3">
                  Manage your account security by updating your email or password. These changes require verification of your current credentials.
                </p>
                <div class="flex flex-col sm:flex-row gap-3">
                  <router-link to="/account/change-email" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-medium rounded-md text-cyan-700 bg-cyan-100 hover:bg-cyan-200">
                    <span class="mdi mdi-email-edit-outline mr-1.5"></span>
                    Change Email
                  </router-link>
                  <router-link to="/account/change-password" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-medium rounded-md text-cyan-700 bg-cyan-100 hover:bg-cyan-200">
                    <span class="mdi mdi-lock-reset mr-1.5"></span>
                    Change Password
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column - Security, Sessions, Linked Accounts -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Linked Accounts Section -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Linked Accounts</h2>
          </div>
          <div class="p-6">
            <div v-if="associations && associations.length > 0">
              <ul class="divide-y divide-gray-200">
                <li v-for="(association, index) in associations" :key="index" class="py-4 flex justify-between items-center">
                  <div class="flex items-center">
                    <span 
                      class="mdi text-2xl mr-3" 
                      :class="getAssociationIcon(association.association_type)"
                    ></span>
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {{ formatAssociationType(association.association_type) }}
                      </p>
                      <p class="text-sm text-gray-500">
                        <span v-if="association.data && association.data.email">{{ association.data.email }} • </span>Connected {{ formatDate(association.created) }}
                      </p>
                    </div>
                  </div>
                  <button 
                    @click="unlinkAccount(association)" 
                    class="text-red-600 hover:text-red-800 cursor-pointer"
                    title="Unlink account"
                  >
                    <span class="mdi mdi-link-off"></span>
                  </button>
                </li>
              </ul>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              <span class="mdi mdi-account-off text-4xl block mb-2"></span>
              <p>No linked accounts</p>
            </div>
            
            <div v-if="$config.googleClientId || $config.appleClientId" class="mt-6 grid grid-cols-1 gap-3">
              <button 
                v-if="$config.googleClientId"
                @click="linkGoogleAccount" 
                class="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <span class="mdi mdi-google text-lg mr-2"></span>
                Link Google Account
              </button>
              <button 
                v-if="$config.appleClientId"
                @click="linkAppleAccount" 
                class="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <span class="mdi mdi-apple text-lg mr-2"></span>
                Link Apple Account
              </button>
            </div>
          </div>
        </div>

        <!-- Active Sessions Section -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Active Sessions</h2>
          </div>
          <div class="p-6">
            <div v-if="sessions && sessions.length > 0">
              <ul class="divide-y divide-gray-200">
                <li v-for="(session, index) in sessions" :key="index" class="py-4">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="flex items-center">
                        <span class="mdi mdi-laptop text-lg text-gray-500 mr-2"></span>
                        <p class="text-sm font-medium text-gray-900">
                          {{ session.browser }} on {{ session.os }}
                        </p>
                        <span 
                          v-if="isCurrentSession(session)" 
                          class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                        >
                          Current
                        </span>
                      </div>
                      <div class="mt-1 text-sm text-gray-500">
                        <p>{{ session.app_name }}</p>
                        <p>{{ session.location }} • {{ formatDate(session.created) }}</p>
                      </div>
                    </div>
                    <button 
                      v-if="!isCurrentSession(session)"
                      @click="terminateSession(session)" 
                      class="text-red-600 hover:text-red-800 cursor-pointer"
                      title="Terminate session"
                    >
                      <span class="mdi mdi-close-circle"></span>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              <span class="mdi mdi-laptop-off text-4xl block mb-2"></span>
              <p>No active sessions</p>
            </div>
          </div>
        </div>

        <!-- Admin Quick Access -->
        <div v-if="isAdmin" class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Admin Access</h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">User Management</p>
                  <p class="text-xs text-gray-500 mt-1">View, edit, and manage user accounts</p>
                </div>
                <router-link 
                  to="/admin/users" 
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                  <span class="mdi mdi-account-group mr-2"></span>
                  Manage Users
                </router-link>
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Application Management</p>
                  <p class="text-xs text-gray-500 mt-1">Configure and manage registered applications</p>
                </div>
                <router-link 
                  to="/admin" 
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                  <span class="mdi mdi-shield-crown mr-2"></span>
                  Manage Apps
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default {
  name: 'AccountDashboard',
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      loading: true,
      error: '',
      user: null,
      associations: [],
      sessions: [],
      currentSessionToken: '',
      
      
      // Loading states for other operations
    };
  },
  computed: {
    userInitials() {
      if (!this.user) return '';
      const firstInitial = this.user.firstname ? this.user.firstname.charAt(0).toUpperCase() : '';
      const lastInitial = this.user.lastname ? this.user.lastname.charAt(0).toUpperCase() : '';
      return firstInitial + lastInitial;
    },
    fullName() {
      if (!this.user) return '';
      return `${this.user.firstname || ''} ${this.user.lastname || ''}`.trim();
    },
    isAdmin() {
      // Placeholder logic - check if user has admin privileges
       return this.user && (this.user.groups || []).includes('admin');
    }
  },
  mounted() {
    this.handleGoogleCallback();
    this.fetchAccountInfo();
  },
  methods: {
    async fetchAccountInfo() {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await fetch('/api/account/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          // Redirect to login page if unauthorized
          window.location.href = '/login';
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch account information');
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          this.user = data.user;
          this.associations = data.associations;
          this.sessions = data.sessions;
        } else {
          throw new Error(data.status || 'Unknown error');
        }
      } catch (error) {
        this.error = error.message || 'An error occurred while fetching account information';
        this.showNotification(this.error, 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // Format date to a readable string in local time
    formatDate(dateString) {
      if (!dateString) return '';
      return dayjs.utc(dateString, 'z').local().format('MMM D, YYYY h:mm A');
    },
    
    // Copy text to clipboard
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('Copied to clipboard');
      }).catch(err => {
        this.showNotification('Failed to copy to clipboard', 'error');
      });
    },
    
    // Show notification
    showNotification(message, type = 'success') {
      this.toast(message, {
        type: type,
        timeout: 3000
      });
    },

    // Handle Google OAuth callback
    async handleGoogleCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = decodeURIComponent(urlParams.get('state'));
      
      if (code && state) {
        try {
          const stateData = JSON.parse(state);
          if (stateData.action === 'connect_google') {
            // Clear URL parameters immediately
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Complete Google connection
            const response = await fetch('/api/account/connect-google-2', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ code })
            });
            
            if (response.status === 401) {
              window.location.href = '/login';
              return;
            }
            
            const data = await response.json();
            
            if (data.status === 'Success') {
              this.showNotification('Google account connected successfully', 'success');
              // Delay the fetch slightly to ensure the notification shows
              setTimeout(() => {
                this.fetchAccountInfo(); // Refresh to show new association
              }, 100);
            } else if (data.status === 'AlreadyAssociated') {
              this.showNotification('This Google account is already associated with another user', 'error');
            } else {
              this.showNotification('Failed to connect Google account', 'error');
            }
          }
        } catch (error) {
          // Clear URL parameters even on error
          window.history.replaceState({}, document.title, window.location.pathname);
          this.showNotification('Failed to process Google connection', 'error');
        }
      }
    },
    
    // Check if a session is the current one
    isCurrentSession(session) {
      return session.is_current === true;
    },
    
    // Format association type for display
    formatAssociationType(type) {
      if (type === 'google') return 'Google';
      if (type === 'apple') return 'Apple';
      return type.charAt(0).toUpperCase() + type.slice(1);
    },
    
    // Get icon class for association type
    getAssociationIcon(type) {
      if (type === 'google') return 'mdi-google text-red-500';
      if (type === 'apple') return 'mdi-apple text-gray-800';
      return 'mdi-account-circle text-blue-500';
    },
    
    
    // Toggle Two-Factor Authentication
    async toggleTFA() {
        if (!this.user.tfa_enabled) {
            this.$router.push('/account/edit-2fa');
        } else {
            this.$router.push('/account/edit-2fa?action=remove');
        }
    },
    
    // Session management
    async terminateSession(session) {
      try {
        const response = await fetch('/api/account/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_token: session.session_token,
            logout_token: session.logout_token
          })
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        if (response.ok) {
          this.showNotification('Session terminated successfully');
          this.fetchAccountInfo(); // Refresh data
        } else {
          throw new Error('Failed to terminate session');
        }
      } catch (error) {
        this.error = error.message;
        this.showNotification(this.error, 'error');
      }
    },
    
    // Account linking
    async linkGoogleAccount() {
      try {
        const response = await fetch('/api/account/connect-google-1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          // Redirect to Google OAuth
          window.location.href = data.redirect;
        } else {
          this.showNotification('Failed to initiate Google connection', 'error');
        }
      } catch (error) {
        this.showNotification('Failed to connect Google account', 'error');
      }
    },
    
    async linkAppleAccount() {
      // This would typically open an Apple Sign In flow
      // For now, we'll just show a notification
      this.showNotification('Apple account linking not implemented yet', 'info');
    },
    
    async unlinkAccount(association) {
      try {
        const response = await fetch('/api/account/unlink-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            associationType: association.association_type,
            associationId: association.association_id
          })
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          this.showNotification(`${this.formatAssociationType(association.association_type)} account unlinked successfully`);
          this.fetchAccountInfo(); // Refresh data
        } else {
          throw new Error(data.status || 'Failed to unlink account');
        }
      } catch (error) {
        this.error = error.message;
        this.showNotification(this.error, 'error');
      }
    },

  }
}
</script>
