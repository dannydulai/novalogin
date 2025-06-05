import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@mdi/font/css/materialdesignicons.css'
import './assets/main.css';
import config from './config';
import toastPlugin from './plugins/toast';

// Initialize color system
config.initColors();

// Create app
const app = createApp(App);

// Make config available globally
app.config.globalProperties.$config = config;

// Use toast plugin
app.use(toastPlugin);

app.use(router);
app.mount('#app');

