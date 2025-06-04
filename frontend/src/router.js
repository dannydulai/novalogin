import { createRouter, createWebHistory } from 'vue-router';

// Function to check if user has admin privileges
async function checkAdminAccess() {
  try {
    const response = await fetch('/api/account/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      return { isAuthenticated: false, isAdmin: false };
    }
    
    if (!response.ok) {
      return { isAuthenticated: false, isAdmin: false };
    }
    
    const data = await response.json();
    
    if (data.status === 'Success') {
      const isAdmin = data.user && (data.user.groups || []).includes('admin');
      return { isAuthenticated: true, isAdmin };
    }
    
    return { isAuthenticated: false, isAdmin: false };
  } catch (error) {
    return { isAuthenticated: false, isAdmin: false };
  }
}

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
    path: '/change-email',
    name: 'change-email-public',
    component: () => import('./views/ChangeEmailView.vue')
  },
  {
    path: '/reset-email-confirm',
    name: 'reset-email-confirm',
    component: () => import('./views/ResetEmailConfirmView.vue')
  },
  {
    path: '/reset-password',
    name: 'reset-password-public',
    component: () => import('./views/ChangePasswordView.vue')
  },
  {
    path: '/reset-password-confirm',
    name: 'reset-password-confirm',
    component: () => import('./views/ResetPasswordConfirmView.vue')
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
        path: 'edit-2fa',
        name: 'edit-2fa',
        component: () => import('./views/Edit2FAView.vue')
      },
      {
        path: 'edit-account',
        name: 'edit-account',
        component: () => import('./views/EditAccountView.vue')
      }
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./views/AdminView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('./views/UsersView.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('./views/NotFoundView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Navigation guard for admin routes
router.beforeEach(async (to, from, next) => {
  // Routes that don't require authentication
  const publicRoutes = ['login', 'create', 'change-email-public', 'reset-email-confirm', 'reset-password-public', 'reset-password-confirm'];
  
  if (publicRoutes.includes(to.name)) {
    next();
    return;
  }
  
  // Check if route requires admin access
  if (to.meta.requiresAdmin) {
    const { isAuthenticated, isAdmin } = await checkAdminAccess();
    
    if (!isAuthenticated) {
      next('/login');
      return;
    }
    
    if (!isAdmin) {
      next({
        name: 'not-found',
        params: {
          title: 'Access Denied',
          message: 'You do not have permission to access this page. Admin privileges are required.'
        }
      });
      return;
    }
  }
  
  // For other protected routes, just check authentication
  if (to.name !== 'not-found' && !publicRoutes.includes(to.name)) {
    const { isAuthenticated } = await checkAdminAccess();
    
    if (!isAuthenticated) {
      next('/login');
      return;
    }
  }
  
  next();
});

export default router;

