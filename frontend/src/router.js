import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.vue')
  },
  {
    path: '/create',
    name: 'create',
    component: () => import('./views/CreateAccountView.vue')
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('./views/AccountView.vue'),
    children: [
      {
        path: '',
        name: 'account-dashboard',
        component: () => import('./views/AccountDashboard.vue')
      },
      {
        path: 'change-email',
        name: 'change-email',
        component: () => import('./views/ChangeEmailView.vue')
      },
      {
        path: 'change-password',
        name: 'change-password',
        component: () => import('./views/ChangePasswordView.vue')
      },
      {
        path: 'setup-2fa',
        name: 'setup-2fa',
        component: () => import('./views/Setup2FAView.vue')
      },
      {
        path: 'disable-2fa',
        name: 'disable-2fa',
        component: () => import('./views/Disable2FAView.vue')
      }
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./views/AdminView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;

