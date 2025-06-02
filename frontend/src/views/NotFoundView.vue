<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <span class="mdi mdi-alert-circle-outline text-6xl text-gray-400 mb-4 block"></span>
        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">
          {{ title }}
        </h2>
        <p class="text-sm text-gray-600 mb-8">
          {{ message }}
        </p>
        <div class="space-y-3">
          <router-link 
            to="/account" 
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            <span class="mdi mdi-account mr-2"></span>
            Go to Account
          </router-link>
          <router-link 
            to="/login" 
            class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            <span class="mdi mdi-login mr-2"></span>
            Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView',
  computed: {
    title() {
      return this.$route.params.title || 'Page Not Found';
    },
    message() {
      return this.$route.params.message || 'The page you are looking for does not exist or you do not have permission to access it.';
    }
  }
}
</script>
