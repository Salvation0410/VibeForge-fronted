import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import HomeView from '@/pages/HomeView.vue'
import ProfileView from '@/pages/ProfileView.vue'
import UserManageView from '@/pages/UserManageView.vue'
import AppChatView from '@/pages/AppChatView.vue'
import AppManageView from '@/pages/AppManageView.vue'
import AppEditView from '@/pages/AppEditView.vue'
import ChatManageView from '@/pages/ChatManageView.vue'
import CommunitySquareView from '@/views/community/CommunitySquareView.vue'
import CommunityPostDetailView from '@/views/community/CommunityPostDetailView.vue'
import CommunityPostReviewView from '@/views/community/CommunityPostReviewView.vue'
import CommunityCommentAdminView from '@/views/community/CommunityCommentAdminView.vue'
import CommunityTagAdminView from '@/views/community/CommunityTagAdminView.vue'
import PostCreateView from '@/views/community/PostCreateView.vue'
import AdminLayoutView from '@/views/admin/AdminLayoutView.vue'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
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
          path: 'profile/:userId',
          name: 'publicProfile',
          component: ProfileView,
          meta: {
            title: '用户主页',
            requiresAuth: false,
            hideInMenu: true,
          },
        },
        {
          path: 'community',
          name: 'community',
          component: CommunitySquareView,
          meta: {
            title: '交流社区',
            requiresAuth: false,
            hideAppHeader: true,
          },
        },
        {
          path: 'community/post/:id',
          name: 'communityPostDetail',
          component: CommunityPostDetailView,
          meta: {
            title: '帖子详情',
            requiresAuth: false,
            hideInMenu: true,
            hideAppHeader: true,
          },
        },
        {
          path: 'community/create',
          name: 'communityCreate',
          component: PostCreateView,
          meta: {
            title: '创建帖子',
            requiresAuth: false,
            hideInMenu: true,
            hideAppHeader: true,
          },
        },
        {
          path: 'community/posts/manage',
          name: 'communityPostManage',
          redirect: '/admin/community/posts',
          meta: {
            title: '社区帖子审核',
            requiresAuth: true,
            roles: ['admin'],
          },
        },
        {
          path: 'community/comments/manage',
          name: 'communityCommentManage',
          redirect: '/admin/community/comments',
          meta: {
            title: '社区评论管理',
            requiresAuth: true,
            roles: ['admin'],
          },
        },
        {
          path: 'community/tags/manage',
          name: 'communityTagManage',
          redirect: '/admin/community/tags',
          meta: {
            title: '社区标签管理',
            requiresAuth: true,
            roles: ['admin'],
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
          redirect: '/admin/apps',
          meta: {
            title: '应用管理',
            requiresAuth: true,
            roles: ['admin'],
          },
        },
        {
          path: 'chats/manage',
          name: 'chatManage',
          redirect: '/admin/chats',
          meta: {
            title: '对话管理',
            requiresAuth: true,
            roles: ['admin'],
          },
        },
        {
          path: 'users',
          name: 'users',
          redirect: '/admin/users',
          meta: {
            title: '用户管理',
            requiresAuth: true,
            roles: ['admin'],
          },
        },
        {
          path: 'admin',
          component: AdminLayoutView,
          meta: {
            title: '后台管理',
            requiresAuth: true,
            roles: ['admin'],
          },
          children: [
            {
              path: '',
              redirect: '/admin/dashboard',
            },
            {
              path: 'dashboard',
              name: 'adminDashboard',
              component: AdminDashboardView,
              meta: {
                title: '数据报表',
                requiresAuth: true,
                roles: ['admin'],
              },
            },
            {
              path: 'community/posts',
              name: 'adminCommunityPosts',
              component: CommunityPostReviewView,
              meta: {
                title: '社区帖子审核',
                requiresAuth: true,
                roles: ['admin'],
              },
            },
            {
              path: 'community/comments',
              name: 'adminCommunityComments',
              component: CommunityCommentAdminView,
              meta: {
                title: '社区评论管理',
                requiresAuth: true,
                roles: ['admin'],
              },
            },
            {
              path: 'community/tags',
              name: 'adminCommunityTags',
              component: CommunityTagAdminView,
              meta: {
                title: '社区标签管理',
                requiresAuth: true,
                roles: ['admin'],
              },
            },
            {
              path: 'apps',
              name: 'adminApps',
              component: AppManageView,
              meta: {
                title: '应用管理',
                requiresAuth: true,
                roles: ['admin'],
              },
            },
            {
              path: 'chats',
              name: 'adminChats',
              component: ChatManageView,
              meta: {
                title: '对话管理',
                requiresAuth: true,
                roles: ['admin'],
              },
            },
            {
              path: 'users',
              name: 'adminUsers',
              component: UserManageView,
              meta: {
                title: '用户管理',
                requiresAuth: true,
                roles: ['admin'],
              },
            },
          ],
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
