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
            <div class="px-6 py-5 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">Account Information</h2>
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

          <!-- Update Account Section -->
          <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div class="px-6 py-5 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">Update Account</h2>
            </div>
            <div class="p-6">
              <form @submit.prevent="updateAccount">
                <div class="space-y-4">
                  <div>
                    <label for="firstname" class="block text-sm font-medium text-gray-700">First Name</label>
                    <input 
                      type="text" 
                      id="firstname" 
                      v-model="accountForm.firstname" 
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label for="lastname" class="block text-sm font-medium text-gray-700">Last Name</label>
                    <input 
                      type="text" 
                      id="lastname" 
                      v-model="accountForm.lastname" 
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <button 
                      type="submit" 
                      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                      :disabled="updateAccountLoading"
                    >
                      <span v-if="!updateAccountLoading">Update Account</span>
                      <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Right column - Security, Sessions, Linked Accounts -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Security Section -->
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="px-6 py-5 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">Security</h2>
            </div>
            <div class="p-6">
              <!-- Change Email -->
              <div class="mb-6 pb-6 border-b border-gray-200">
                <h3 class="text-base font-medium text-gray-900 mb-3">Change Email</h3>
                <form @submit.prevent="changeEmail">
                  <div class="space-y-4">
                    <div>
                      <label for="new-email" class="block text-sm font-medium text-gray-700">New Email</label>
                      <input 
                        type="email" 
                        id="new-email" 
                        v-model="emailForm.newEmail" 
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label for="current-password-email" class="block text-sm font-medium text-gray-700">Current Password</label>
                      <input 
                        type="password" 
                        id="current-password-email" 
                        v-model="emailForm.currentPassword" 
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <button 
                        type="submit" 
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                        :disabled="changeEmailLoading"
                      >
                        <span v-if="!changeEmailLoading">Change Email</span>
                        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Change Password -->
              <div>
                <h3 class="text-base font-medium text-gray-900 mb-3">Change Password</h3>
                <form @submit.prevent="changePassword">
                  <div class="space-y-4">
                    <div>
                      <label for="current-password" class="block text-sm font-medium text-gray-700">Current Password</label>
                      <input 
                        type="password" 
                        id="current-password" 
                        v-model="passwordForm.currentPassword" 
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label for="new-password" class="block text-sm font-medium text-gray-700">New Password</label>
                      <input 
                        type="password" 
                        id="new-password" 
                        v-model="passwordForm.newPassword" 
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                      <input 
                        type="password" 
                        id="confirm-password" 
                        v-model="passwordForm.confirmPassword" 
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <button 
                        type="submit" 
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                        :disabled="changePasswordLoading"
                      >
                        <span v-if="!changePasswordLoading">Change Password</span>
                        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

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
      emailForm: {
        newEmail: '',
        currentPassword: ''
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      
      // Loading states
      updateAccountLoading: false,
      changeEmailLoading: false,
      changePasswordLoading: false,
      
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
    
    async changeEmail() {
      if (!this.emailForm.newEmail || !this.emailForm.currentPassword) {
        this.error = 'Please fill in all fields';
        return;
      }
      
      this.changeEmailLoading = true;
      
      try {
        const response = await fetch('/api/account/change-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            newEmail: this.emailForm.newEmail,
            currentPassword: this.emailForm.currentPassword
          })
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          this.showNotification('Email updated successfully');
          this.emailForm.newEmail = '';
          this.emailForm.currentPassword = '';
          this.fetchAccountInfo(); // Refresh data
        } else {
          throw new Error(data.status || 'Failed to update email');
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.changeEmailLoading = false;
      }
    },
    
    async changePassword() {
      if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
        this.error = 'Please fill in all password fields';
        return;
      }
      
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.error = 'New passwords do not match';
        return;
      }
      
      this.changePasswordLoading = true;
      
      try {
        const response = await fetch('/api/account/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword: this.passwordForm.currentPassword,
            newPassword: this.passwordForm.newPassword
          })
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          this.showNotification('Password changed successfully');
          this.passwordForm.currentPassword = '';
          this.passwordForm.newPassword = '';
          this.passwordForm.confirmPassword = '';
        } else {
          throw new Error(data.status || 'Failed to change password');
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.changePasswordLoading = false;
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
