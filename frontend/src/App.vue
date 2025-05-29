<template>
  <div id="app" class="h-screen w-full">
    <nav class="p-4 bg-slate-100 flex gap-4">
      <router-link to="/login">Login</router-link>
      <router-link to="/account">Account</router-link>
      <router-link to="/admin">Admin</router-link>
    </nav>
    <main class="p-4">
      <router-view />
    </main>
  </div>
</template>
