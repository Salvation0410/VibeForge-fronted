import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import HomeView from '@/pages/HomeView.vue'
import UserManageView from '@/pages/UserManageView.vue'
import { setupPermissionGuard } from '@/permission'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: '',
          redirect: '/home',
        },
        {
          path: 'home',
          name: 'home',
          component: HomeView,
          meta: {
            title: '首页',
            requiresAuth: true,
          },
        },
        {
          path: 'users',
          name: 'users',
          component: UserManageView,
          meta: {
            title: '用户管理',
            requiresAuth: true,
            roles: ['admin'],
          },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: AuthLayout,
      meta: {
        title: '登录',
      },
    },
    {
      path: '/register',
      name: 'register',
      component: AuthLayout,
      meta: {
        title: '注册',
      },
    },
  ],
})

setupPermissionGuard(router)

export default router
