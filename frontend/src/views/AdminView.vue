<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <span class="mdi mdi-shield-crown text-2xl text-app-600 mr-3"></span>
            <h1 class="text-2xl font-bold text-gray-900">Application Management</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link 
              to="/account" 
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <span class="mdi mdi-account mr-2"></span>
              Back to Account
            </router-link>
            <button 
              @click="logout"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <span class="mdi mdi-logout mr-2"></span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-12 h-12 border-4 border-app-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <div class="flex">
          <div class="flex-shrink-0">
            <span class="mdi mdi-alert text-xl"></span>
          </div>
          <div class="ml-3">
            <p class="text-sm">{{ error }}</p>
            <button @click="fetchApps" class="text-sm font-medium text-red-700 hover:text-red-600 mt-2 cursor-pointer">
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      <!-- Apps grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <!-- Existing apps -->
        <div 
          v-for="app in apps" 
          :key="app.app_id" 
          class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <span 
                  class="mdi text-2xl mr-3"
                  :class="app.login_callback ? 'mdi-cellphone-link text-blue-500' : 'mdi-web text-green-500'"
                ></span>
                <div>
                  <h3 class="text-lg font-medium text-gray-900">{{ app.name || 'Unnamed App' }}</h3>
                  <p class="text-sm text-gray-500">
                    {{ app.login_callback ? 'Mobile/Desktop App' : 'Web App' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-3 mb-6">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">App ID</label>
                <div class="flex items-center">
                  <code class="text-xs bg-gray-100 px-2 py-1 rounded flex-1">{{ app.app_id }}</code>
                  <button 
                    @click="copyToClipboard(app.app_id.toString())"
                    class="ml-2 text-app-600 hover:text-app-800 cursor-pointer"
                    title="Copy App ID"
                  >
                    <span class="mdi mdi-content-copy"></span>
                  </button>
                </div>
              </div>

              <div v-if="!app.login_callback">
                <label class="block text-xs font-medium text-gray-500 mb-1">App Secret</label>
                <div class="flex items-center">
                  <code class="text-xs bg-gray-100 px-2 py-1 rounded flex-1">{{ app.secret }}</code>
                  <button 
                    @click="copyToClipboard(app.secret)"
                    class="ml-2 text-app-600 hover:text-app-800 cursor-pointer"
                    title="Copy App Secret"
                  >
                    <span class="mdi mdi-content-copy"></span>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">App Name</label>
                <input 
                  type="text" 
                  v-model="app.name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-app-500 focus:border-transparent"
                  placeholder="Enter app name"
                />
              </div>

              <div v-if="app.login_callback">
                <label class="block text-xs font-medium text-gray-500 mb-1">Login Callback</label>
                <input 
                  type="text" 
                  v-model="app.login_callback"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-app-500 focus:border-transparent"
                  placeholder="Enter callback URL"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Permissions</label>
                <div class="flex flex-wrap gap-1 mb-2">
                  <span 
                    v-for="(group, index) in app.groups" 
                    :key="index"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-app-100 text-app-800"
                  >
                    {{ group }}
                    <button 
                      @click="removeGroup(app, index)"
                      class="ml-1 text-app-600 hover:text-app-800 cursor-pointer"
                    >
                      <span class="mdi mdi-close text-xs"></span>
                    </button>
                  </span>
                </div>
                <div class="flex">
                  <input 
                    type="text" 
                    v-model="app.newGroup"
                    @keyup.enter="addGroup(app)"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-app-500 focus:border-transparent"
                    placeholder="Add permission"
                  />
                  <button 
                    @click="addGroup(app)"
                    class="px-3 py-2 bg-app-600 text-white rounded-r-md hover:bg-app-700 focus:outline-none focus:ring-2 focus:ring-app-500 cursor-pointer"
                  >
                    <span class="mdi mdi-plus"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-between pt-4 border-t border-gray-200">
              <button 
                @click="confirmDelete(app)"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
              >
                <span class="mdi mdi-delete mr-1"></span>
                Delete
              </button>
              <button 
                @click="saveApp(app)"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-app-600 hover:bg-app-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-500 cursor-pointer"
              >
                <span class="mdi mdi-content-save mr-1"></span>
                Save
              </button>
            </div>
          </div>
        </div>

        <!-- New app form -->
        <div class="bg-white rounded-lg shadow-md border border-gray-200 border-dashed overflow-hidden">
          <div class="p-6">
            <div class="flex items-center mb-4">
              <span class="mdi mdi-plus-circle text-2xl text-gray-400 mr-3"></span>
              <h3 class="text-lg font-medium text-gray-900">Create New App</h3>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                <input 
                  type="text" 
                  v-model="newApp.name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-app-500 focus:border-transparent"
                  placeholder="Enter app name"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">App Type</label>
                <select 
                  v-model="newApp.type"
                  @change="handleTypeChange"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-app-500 focus:border-transparent"
                >
                  <option value="web">Web App</option>
                  <option value="app">Mobile/Desktop App</option>
                </select>
              </div>

              <div v-if="newApp.type === 'app'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Login Callback</label>
                <input 
                  type="text" 
                  v-model="newApp.login_callback"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-app-500 focus:border-transparent"
                  placeholder="Enter callback URL"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                <div class="flex flex-wrap gap-1 mb-2">
                  <span 
                    v-for="(group, index) in newApp.groups" 
                    :key="index"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-app-100 text-app-800"
                  >
                    {{ group }}
                    <button 
                      @click="removeNewAppGroup(index)"
                      class="ml-1 text-app-600 hover:text-app-800 cursor-pointer"
                    >
                      <span class="mdi mdi-close text-xs"></span>
                    </button>
                  </span>
                </div>
                <div class="flex">
                  <input 
                    type="text" 
                    v-model="newApp.newGroup"
                    @keyup.enter="addNewAppGroup"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-app-500 focus:border-transparent"
                    placeholder="Add permission"
                  />
                  <button 
                    @click="addNewAppGroup"
                    class="px-3 py-2 bg-app-600 text-white rounded-r-md hover:bg-app-700 focus:outline-none focus:ring-2 focus:ring-app-500 cursor-pointer"
                  >
                    <span class="mdi mdi-plus"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end pt-6 border-t border-gray-200 mt-6">
              <button 
                @click="createApp"
                :disabled="!newApp.name"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-app-600 hover:bg-app-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span class="mdi mdi-plus mr-1"></span>
                Create App
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <span class="mdi mdi-alert text-red-600 text-2xl"></span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-4">Delete Application</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete "{{ appToDelete?.name }}"? This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-3 mt-4">
            <button 
              @click="showDeleteModal = false"
              class="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              @click="deleteApp"
              class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';

export default {
  name: 'AdminView',
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      loading: true,
      error: '',
      apps: [],
      newApp: {
        name: '',
        type: 'web',
        login_callback: '',
        groups: [],
        newGroup: ''
      },
      showDeleteModal: false,
      appToDelete: null
    };
  },
  mounted() {
    this.fetchApps();
  },
  methods: {
    async fetchApps() {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await fetch('/api/admin/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        if (response.status === 403) {
          window.location.href = '/account';
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        
        this.apps = (await response.json()).map(app => ({
          ...app,
          groups: app.groups || [],
          newGroup: ''
        }));
      } catch (error) {
        this.error = error.message || 'An error occurred while fetching applications';
        this.showNotification(this.error, 'error');
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        const response = await fetch('/api/admin/logout', { method: 'POST' });
        if (response.ok) {
          window.location.href = '/login';
        } else {
          this.showNotification('An error occurred logging out', 'error');
        }
      } catch (error) {
        this.showNotification('An error occurred logging out', 'error');
      }
    },

    async saveApp(app) {
      try {
        const response = await fetch('/api/admin/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            save: app.app_id,
            name: app.name,
            login_callback: app.login_callback,
            groups: app.groups
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save application');
        }

        this.showNotification('Application saved successfully', 'success');
        this.fetchApps();
      } catch (error) {
        this.showNotification(error.message, 'error');
      }
    },

    async createApp() {
      if (!this.newApp.name) return;

      try {
        const response = await fetch('/api/admin/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            add: 'new',
            name: this.newApp.name,
            login_callback: this.newApp.type === 'app' ? this.newApp.login_callback : '',
            groups: this.newApp.groups
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create application');
        }

        this.showNotification('Application created successfully', 'success');
        this.resetNewApp();
        this.fetchApps();
      } catch (error) {
        this.showNotification(error.message, 'error');
      }
    },

    confirmDelete(app) {
      this.appToDelete = app;
      this.showDeleteModal = true;
    },

    async deleteApp() {
      if (!this.appToDelete) return;

      try {
        const response = await fetch('/api/admin/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            del: this.appToDelete.app_id
          })
        });

        if (!response.ok) {
          throw new Error('Failed to delete application');
        }

        this.showNotification('Application deleted successfully', 'success');
        this.showDeleteModal = false;
        this.appToDelete = null;
        this.fetchApps();
      } catch (error) {
        this.showNotification(error.message, 'error');
      }
    },

    addGroup(app) {
      if (app.newGroup && app.newGroup.trim() && !app.groups.includes(app.newGroup.trim())) {
        app.groups.push(app.newGroup.trim());
        app.newGroup = '';
      }
    },

    removeGroup(app, index) {
      app.groups.splice(index, 1);
    },

    addNewAppGroup() {
      if (this.newApp.newGroup && this.newApp.newGroup.trim() && !this.newApp.groups.includes(this.newApp.newGroup.trim())) {
        this.newApp.groups.push(this.newApp.newGroup.trim());
        this.newApp.newGroup = '';
      }
    },

    removeNewAppGroup(index) {
      this.newApp.groups.splice(index, 1);
    },

    handleTypeChange() {
      if (this.newApp.type === 'web') {
        this.newApp.login_callback = '';
      }
    },

    resetNewApp() {
      this.newApp = {
        name: '',
        type: 'web',
        login_callback: '',
        groups: [],
        newGroup: ''
      };
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('Copied to clipboard', 'success');
      }).catch(() => {
        this.showNotification('Failed to copy to clipboard', 'error');
      });
    },

    showNotification(message, type = 'success') {
      this.toast(message, {
        type: type,
        timeout: 3000
      });
    }
  }
}
</script>
