<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Header -->
    <app-header />

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue';

export default {
  name: 'AccountView',
  components: {
    AppHeader
  }
}
</script>
