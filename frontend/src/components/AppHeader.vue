<template>
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <div class="flex items-center">
        <span class="mdi mdi-key-variant text-2xl" :class="$config.primaryColorClass || 'text-cyan-500'"></span>
        <h1 class="ml-2 text-xl font-semibold text-gray-800">{{ $config.appName }}</h1>
      </div>
      <button 
        @click="logout" 
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
      >
        <span class="mdi mdi-logout-variant mr-2"></span>
        Sign Out
      </button>
    </div>
  </header>
</template>

<script>
import { useToast } from 'vue-toastification';

export default {
  name: 'AppHeader',
  setup() {
    const toast = useToast();
    return { toast };
  },
  methods: {
    async logout() {
      try {
        const response = await fetch('/api/login/logout', {
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
        this.toast('Failed to logout: ' + error.message, {
          type: 'error',
          timeout: 3000
        });
      }
    }
  }
}
</script>
