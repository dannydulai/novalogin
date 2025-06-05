<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-6">
      <router-link to="/account" class="text-app-600 hover:text-app-800 flex items-center">
        <span class="mdi mdi-arrow-left mr-2"></span>
        Back to account
      </router-link>
    </div>
    
    <h1 class="text-2xl font-bold mb-6">Edit Account Information</h1>
    
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="p-6">
        <form @submit.prevent="updateAccount">
          <div class="space-y-4">
            <div>
              <label for="firstname" class="block text-sm font-medium text-gray-700">First Name</label>
              <input 
                type="text" 
                id="firstname" 
                v-model="accountForm.firstname" 
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-app-500 focus:border-app-500 sm:text-sm"
              />
            </div>
            <div>
              <label for="lastname" class="block text-sm font-medium text-gray-700">Last Name</label>
              <input 
                type="text" 
                id="lastname" 
                v-model="accountForm.lastname" 
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-app-500 focus:border-app-500 sm:text-sm"
              />
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <router-link 
                to="/account" 
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-500 cursor-pointer"
              >
                Cancel
              </router-link>
              <button 
                type="submit" 
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-app-600 hover:bg-app-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-500 flex items-center cursor-pointer"
                :disabled="updateAccountLoading"
              >
                <span v-if="!updateAccountLoading">Save Changes</span>
                <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';

export default {
  name: 'EditAccountView',
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      accountForm: {
        firstname: '',
        lastname: ''
      },
      updateAccountLoading: false,
      user: null
    };
  },
  mounted() {
    this.fetchAccountInfo();
  },
  methods: {
    async fetchAccountInfo() {
      try {
        const response = await fetch('/api/account/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch account information');
        }
        
        const data = await response.json();
        
        if (data.status === 'Success') {
          this.user = data.user;
          this.accountForm.firstname = this.user.firstname || '';
          this.accountForm.lastname = this.user.lastname || '';
        } else {
          throw new Error(data.status || 'Unknown error');
        }
      } catch (error) {
        this.showNotification(error.message || 'An error occurred while fetching account information', 'error');
      }
    },
    
    // Show notification
    showNotification(message, type = 'success') {
      this.toast(message, {
        type: type,
        timeout: 3000
      });
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
          this.$router.push('/account');
        } else {
          throw new Error(data.status || 'Failed to update account');
        }
      } catch (error) {
        this.showNotification(error.message, 'error');
      } finally {
        this.updateAccountLoading = false;
      }
    }
  }
}
</script>
