<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div class="flex items-center">
          <span class="mdi mdi-key-variant text-2xl" :class="$config.primaryColorClass || 'text-cyan-500'"></span>
          <h1 class="ml-2 text-xl font-semibold text-gray-800">{{ $config.appName }}</h1>
        </div>
        <button 
          @click="logout" 
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <span class="mdi mdi-logout-variant mr-2"></span>
          Sign Out
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <button 
                @click="openEditModal" 
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-cyan-600 bg-cyan-50 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                <span class="mdi mdi-pencil mr-1.5"></span>
                Edit
              </button>
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
                      class="ml-2 text-cyan-600 hover:text-cyan-800"
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
                <!-- Two-Factor Authentication Toggle -->
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
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
                    <a href="/change-email" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-cyan-700 bg-cyan-100 hover:bg-cyan-200">
                      <span class="mdi mdi-email-edit-outline mr-1.5"></span>
                      Change Email
                    </a>
                    <a href="/change-password" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-cyan-700 bg-cyan-100 hover:bg-cyan-200">
                      <span class="mdi mdi-lock-reset mr-1.5"></span>
                      Change Password
                    </a>
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
                          Connected {{ formatDate(association.created) }}
                        </p>
                      </div>
                    </div>
                    <button 
                      @click="unlinkAccount(association)" 
                      class="text-red-600 hover:text-red-800"
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
              
              <div class="mt-6 grid grid-cols-1 gap-3">
                <button 
                  @click="linkGoogleAccount" 
                  class="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <span class="mdi mdi-google text-lg mr-2"></span>
                  Link Google Account
                </button>
                <button 
                  @click="linkAppleAccount" 
                  class="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
                        class="text-red-600 hover:text-red-800"
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
        </div>
      </div>
    </main>

    <!-- Edit Account Modal -->
    <div 
      v-if="showEditModal" 
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity flex items-center justify-center p-4 z-50"
      @click.self="showEditModal = false"
    >
      <div 
        class="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full"
        @click.stop
      >
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">Edit Account Information</h3>
          <button 
            @click="showEditModal = false" 
            class="text-gray-400 hover:text-gray-500"
          >
            <span class="mdi mdi-close text-xl"></span>
          </button>
        </div>
        <form @submit.prevent="updateAccount">
          <div class="p-6 space-y-4">
            <div>
              <label for="modal-firstname" class="block text-sm font-medium text-gray-700">First Name</label>
              <input 
                type="text" 
                id="modal-firstname" 
                v-model="accountForm.firstname" 
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              />
            </div>
            <div>
              <label for="modal-lastname" class="block text-sm font-medium text-gray-700">Last Name</label>
              <input 
                type="text" 
                id="modal-lastname" 
                v-model="accountForm.lastname" 
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
            <button 
              type="button" 
              @click="showEditModal = false"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 flex items-center"
              :disabled="updateAccountLoading"
            >
              <span v-if="!updateAccountLoading">Save Changes</span>
              <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success notification -->
    <div 
      v-if="notification.show" 
      class="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg"
      style="max-width: 24rem;"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="mdi mdi-check-circle text-xl"></span>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ notification.message }}</p>
        </div>
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button 
              @click="notification.show = false" 
              class="inline-flex text-green-500 hover:text-green-600"
            >
              <span class="mdi mdi-close text-xl"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AccountView',
  data() {
    return {
      loading: true,
      error: '',
      user: null,
      associations: [],
      sessions: [],
      currentSessionToken: '',
      
      // Form data
      accountForm: {
        firstname: '',
        lastname: ''
      },
      
      // Modal state
      showEditModal: false,
      
      // Loading states
      updateAccountLoading: false,
      tfaLoading: false,
      
      // Notification
      notification: {
        show: false,
        message: ''
      }
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
    }
  },
  mounted() {
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
          
          // Find current session
          const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          }, {});
          
          // Populate form data
          this.accountForm.firstname = this.user.firstname || '';
          this.accountForm.lastname = this.user.lastname || '';
        } else {
          throw new Error(data.status || 'Unknown error');
        }
      } catch (error) {
        this.error = error.message || 'An error occurred while fetching account information';
      } finally {
        this.loading = false;
      }
    },
    
    // Format date to a readable string
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    // Copy text to clipboard
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('Copied to clipboard');
      });
    },
    
    // Show notification
    showNotification(message, duration = 3000) {
      this.notification.message = message;
      this.notification.show = true;
      
      setTimeout(() => {
        this.notification.show = false;
      }, duration);
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
    
    // Open edit modal
    openEditModal() {
      // Make sure form has current values
      this.accountForm.firstname = this.user.firstname || '';
      this.accountForm.lastname = this.user.lastname || '';
      this.showEditModal = true;
    },
    
    // Account update methods
    async updateAccount() {
      this.updateAccountLoading = true;
      
      try {
        const response = await fetch('/api/account/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstname: this.accountForm.firstname,
            lastname: this.accountForm.lastname
          })
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          this.showNotification('Account information updated successfully');
          this.showEditModal = false;
          this.fetchAccountInfo(); // Refresh data
        } else {
          throw new Error(data.status || 'Failed to update account');
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.updateAccountLoading = false;
      }
    },
    
    // Toggle Two-Factor Authentication
    async toggleTFA() {
      this.tfaLoading = true;
      
      try {
        const response = await fetch('/api/account/toggle-tfa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            enabled: !this.user.tfa_enabled
          })
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          this.showNotification(`Two-factor authentication ${!this.user.tfa_enabled ? 'enabled' : 'disabled'} successfully`);
          this.fetchAccountInfo(); // Refresh data
        } else {
          throw new Error(data.status || 'Failed to update two-factor authentication');
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.tfaLoading = false;
      }
    },
    
    // Session management
    async terminateSession(session) {
      try {
        const response = await fetch('/api/account/terminate-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionToken: session.session_token,
            logoutToken: session.logout_token
          })
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          this.showNotification('Session terminated successfully');
          this.fetchAccountInfo(); // Refresh data
        } else {
          throw new Error(data.status || 'Failed to terminate session');
        }
      } catch (error) {
        this.error = error.message;
      }
    },
    
    // Account linking
    async linkGoogleAccount() {
      // This would typically open a Google OAuth flow
      // For now, we'll just show a notification
      this.showNotification('Google account linking not implemented yet');
    },
    
    async linkAppleAccount() {
      // This would typically open an Apple Sign In flow
      // For now, we'll just show a notification
      this.showNotification('Apple account linking not implemented yet');
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
      }
    },
    
    // Logout
    async logout() {
      try {
        const response = await fetch('/api/account/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          window.location.href = '/login';
        } else {
          throw new Error('Failed to logout');
        }
      } catch (error) {
        this.error = error.message;
      }
    }
  }
}
</script>
