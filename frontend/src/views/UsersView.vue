<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <span class="mdi mdi-account-group text-2xl text-cyan-600 mr-3"></span>
            <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
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

    <!-- Search and Controls -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div class="flex-1 max-w-lg">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="mdi mdi-magnify text-gray-400"></span>
              </div>
              <input
                type="text"
                v-model="searchQuery"
                @input="debouncedSearch"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Search by email, first name, or last name..."
              />
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">
              {{ pagination.total }} users total
            </span>
          </div>
        </div>
      </div>

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
            <button @click="fetchUsers" class="text-sm font-medium text-red-700 hover:text-red-600 mt-2">
              Try again
            </button>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div v-else class="bg-white shadow rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  2FA
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in users" :key="user.user_id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-medium">
                        {{ getUserInitials(user) }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ getUserFullName(user) }}
                      </div>
                      <div class="text-sm text-gray-500 flex items-center">
                        ID: {{ user.user_id }}
                        <button 
                          @click="copyToClipboard(user.user_id.toString())"
                          class="ml-2 text-cyan-600 hover:text-cyan-800"
                          title="Copy User ID"
                        >
                          <span class="mdi mdi-content-copy"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ user.email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="group in (user.groups || [])"
                      :key="group"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
                    >
                      {{ group }}
                    </span>
                    <span v-if="!user.groups || user.groups.length === 0" class="text-sm text-gray-400">
                      No permissions
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="user.tfa_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  >
                    <span class="mdi mr-1" :class="user.tfa_enabled ? 'mdi-shield-check' : 'mdi-shield-off'"></span>
                    {{ user.tfa_enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(user.created) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="editUser(user)"
                    class="text-cyan-600 hover:text-cyan-900 mr-3"
                    title="Edit user"
                  >
                    <span class="mdi mdi-pencil"></span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="goToPage(pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="goToPage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="goToPage(pagination.page - 1)"
                  :disabled="pagination.page <= 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="mdi mdi-chevron-left"></span>
                </button>
                <button
                  v-for="page in getVisiblePages()"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    page === pagination.page
                      ? 'z-10 bg-cyan-50 border-cyan-500 text-cyan-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <button
                  @click="goToPage(pagination.page + 1)"
                  :disabled="pagination.page >= pagination.totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="mdi mdi-chevron-right"></span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Edit User</h3>
            <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600">
              <span class="mdi mdi-close text-xl"></span>
            </button>
          </div>
          
          <form @submit.prevent="saveUser" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                v-model="editingUser.firstname"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                v-model="editingUser.lastname"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                v-model="editingUser.email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Enter email"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
              <div class="flex flex-wrap gap-1 mb-2">
                <span
                  v-for="(group, index) in editingUser.groups"
                  :key="index"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
                >
                  {{ group }}
                  <button
                    type="button"
                    @click="removeGroup(index)"
                    class="ml-1 text-cyan-600 hover:text-cyan-800"
                  >
                    <span class="mdi mdi-close text-xs"></span>
                  </button>
                </span>
              </div>
              <div class="flex">
                <input
                  type="text"
                  v-model="newGroup"
                  @keyup.enter="addGroup"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Add permission"
                />
                <button
                  type="button"
                  @click="addGroup"
                  class="px-3 py-2 bg-cyan-600 text-white rounded-r-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <span class="mdi mdi-plus"></span>
                </button>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeEditModal"
                class="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="saving" class="mdi mdi-loading mdi-spin mr-1"></span>
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
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
  name: 'UsersView',
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      loading: true,
      error: '',
      users: [],
      searchQuery: '',
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      showEditModal: false,
      editingUser: {},
      originalUser: {},
      newGroup: '',
      saving: false,
      searchTimeout: null
    };
  },
  mounted() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page: this.pagination.page,
            limit: this.pagination.limit,
            search: this.searchQuery
          })
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
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        this.users = data.users;
        this.pagination = data.pagination;
      } catch (error) {
        this.error = error.message || 'An error occurred while fetching users';
        this.showNotification(this.error, 'error');
      } finally {
        this.loading = false;
      }
    },

    debouncedSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchUsers();
      }, 300);
    },

    goToPage(page) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.pagination.page = page;
        this.fetchUsers();
      }
    },

    getVisiblePages() {
      const current = this.pagination.page;
      const total = this.pagination.totalPages;
      const delta = 2;
      
      let start = Math.max(1, current - delta);
      let end = Math.min(total, current + delta);
      
      if (end - start < 4) {
        if (start === 1) {
          end = Math.min(total, start + 4);
        } else {
          start = Math.max(1, end - 4);
        }
      }
      
      const pages = [];
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    },

    editUser(user) {
      this.originalUser = { ...user };
      this.editingUser = {
        user_id: user.user_id,
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email,
        groups: [...(user.groups || [])]
      };
      this.newGroup = '';
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.editingUser = {};
      this.originalUser = {};
      this.newGroup = '';
    },

    addGroup() {
      if (this.newGroup && this.newGroup.trim() && !this.editingUser.groups.includes(this.newGroup.trim())) {
        this.editingUser.groups.push(this.newGroup.trim());
        this.newGroup = '';
      }
    },

    removeGroup(index) {
      this.editingUser.groups.splice(index, 1);
    },

    async saveUser() {
      this.saving = true;
      
      try {
        const response = await fetch('/api/admin/users/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.editingUser)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to update user');
        }

        this.showNotification('User updated successfully', 'success');
        this.closeEditModal();
        this.fetchUsers();
      } catch (error) {
        this.showNotification(error.message, 'error');
      } finally {
        this.saving = false;
      }
    },

    getUserInitials(user) {
      const firstInitial = user.firstname ? user.firstname.charAt(0).toUpperCase() : '';
      const lastInitial = user.lastname ? user.lastname.charAt(0).toUpperCase() : '';
      return firstInitial + lastInitial || user.email.charAt(0).toUpperCase();
    },

    getUserFullName(user) {
      const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
      return fullName || 'No name';
    },

    formatDate(dateString) {
      if (!dateString) return '';
      return dayjs.utc(dateString).local().format('MMM D, YYYY');
    },

    showNotification(message, type = 'success') {
      this.toast(message, {
        type: type,
        timeout: 3000
      });
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('User ID copied to clipboard', 'success');
      }).catch(() => {
        this.showNotification('Failed to copy to clipboard', 'error');
      });
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
    }
  }
}
</script>
