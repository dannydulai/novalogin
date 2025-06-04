import { createApp } from 'vue'
import './style.css'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import router from './router'
import NovaAuth from 'vue-nova-login'

// Setup NovaAuth with the router
NovaAuth.install(router, {
  loginUrl: AUTH_URL,
  appId: APP_ID
})

const app = createApp(App)
app.use(router)
app.mount('#app')
