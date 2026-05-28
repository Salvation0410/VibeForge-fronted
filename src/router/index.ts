import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import HomeView from '@/pages/HomeView.vue'
import ProfileView from '@/pages/ProfileView.vue'
import UserManageView from '@/pages/UserManageView.vue'
import AppChatView from '@/pages/AppChatView.vue'
import AppManageView from '@/pages/AppManageView.vue'
import AppEditView from '@/pages/AppEditView.vue'
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
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: {
            title: '个人中心',
            requiresAuth: true,
            hideInMenu: true,
          },
        },
        {
          path: 'apps/:id/chat',
          name: 'appChat',
          component: AppChatView,
          meta: {
            title: '应用生成',
            requiresAuth: true,
            hideInMenu: true,
          },
        },
        {
          path: 'apps/:id/edit',
          name: 'appEdit',
          component: AppEditView,
          meta: {
            title: '应用编辑',
            requiresAuth: true,
            hideInMenu: true,
          },
        },
        {
          path: 'apps/manage',
          name: 'appManage',
          component: AppManageView,
          meta: {
            title: '应用管理',
            requiresAuth: true,
            roles: ['admin'],
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
