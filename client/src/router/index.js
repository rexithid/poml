import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../stores/auth.js';
import Live from '../pages/Live.vue';
import Login from '../pages/Login.vue';
import AdminDashboard from '../pages/AdminDashboard.vue';
import WorkerDashboard from '../pages/WorkerDashboard.vue';

const routes = [
  { path: '/', name: 'live', component: Live },
  { path: '/login', name: 'login', component: Login },
  {
    path: '/admin/:pathMatch(.*)*',
    name: 'admin',
    component: AdminDashboard,
    meta: { roles: ['admin'] },
  },
  {
    path: '/worker/:pathMatch(.*)*',
    name: 'worker',
    component: WorkerDashboard,
    meta: { roles: ['AR', 'DR'] },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard rute — menggantikan komponen Protected di App.jsx React.
router.beforeEach((to) => {
  const { state } = useAuth();
  if (to.meta?.roles) {
    if (!state.auth) return { name: 'login' };
    if (!to.meta.roles.includes(state.auth.role)) return { path: '/' };
  }
  return true;
});

export default router;
