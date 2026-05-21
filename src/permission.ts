import type { Router } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'

const AUTH_PATHS = new Set(['/login', '/register'])

function isAuthPath(path: string) {
  return AUTH_PATHS.has(path)
}

export function setupPermissionGuard(router: Router) {
  router.beforeEach(async (to) => {
    const loginUserStore = useLoginUserStore()
    const needUser = Boolean(to.meta.requiresAuth) || isAuthPath(to.path)

    if (!loginUserStore.hasFetched && needUser) {
      await loginUserStore.fetchLoginUser()
    }

    if (isAuthPath(to.path) && loginUserStore.isLogin) {
      return { path: '/home' }
    }

    if (to.meta.requiresAuth && !loginUserStore.isLogin) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    const roles = to.meta.roles
    if (roles?.length) {
      const userRole = loginUserStore.loginUser?.userRole
      if (!userRole || !roles.includes(userRole)) {
        message.warning('无权限访问该页面')
        return { path: '/home' }
      }
    }

    if (to.meta.title) {
      document.title = `${to.meta.title} - YuAIGenerate`
    }

    return true
  })
}

