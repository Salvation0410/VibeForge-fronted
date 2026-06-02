<template>
  <a-layout class="app-layout">
    <a-layout-header class="app-header">
      <button class="brand" type="button" @click="router.push('/home')">
        <img class="brand-logo" src="@/assets/logo.png" alt="智创 · AI应用平台" />
        <div class="brand-copy">
          <span class="brand-title">智创 · AI应用平台</span>
          <span class="brand-subtitle">AI 驱动应用创新平台</span>
        </div>
      </button>

      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="horizontal"
        :items="menuItems"
        class="nav-menu"
        @click="handleMenuClick"
      />

      <div class="user-zone">
        <a-dropdown placement="bottomRight">
          <button class="user-trigger" type="button">
            <a-avatar class="avatar" :src="loginUserStore.loginUser?.avatarUrl">
              {{ avatarText }}
            </a-avatar>
            <div class="user-text">
              <span class="user-name">{{ displayName }}</span>
              <span class="user-role">{{ roleLabel }}</span>
            </div>
          </button>

          <template #overlay>
            <a-menu @click="handleUserMenuClick">
              <a-menu-item key="profile">个人中心</a-menu-item>
              <a-menu-item key="logout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </a-layout-header>

    <a-layout-content class="app-content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuProps } from 'ant-design-vue'
import { Modal, message } from 'ant-design-vue'
import { logoutUser } from '@/api/sysUserApi'
import { useLoginUserStore } from '@/stores/loginUser'
import { isAdminRole } from '@/utils/appUtils'

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

const selectedKeys = ref<string[]>(['/home'])

function resolveMenuKey(path: string) {
  if (path.startsWith('/apps/manage')) {
    return '/apps/manage'
  }
  if (path.startsWith('/chats/manage')) {
    return '/chats/manage'
  }
  if (path.startsWith('/users')) {
    return '/users'
  }
  if (path.startsWith('/home')) {
    return '/home'
  }
  return ''
}

watch(
  () => route.path,
  (path) => {
    const menuKey = resolveMenuKey(path)
    selectedKeys.value = menuKey ? [menuKey] : []
  },
  { immediate: true },
)

const isAdmin = computed(() => isAdminRole(loginUserStore.loginUser?.userRole))
const displayName = computed(
  () => loginUserStore.loginUser?.nickname || loginUserStore.loginUser?.account || '用户',
)
const avatarText = computed(() => (displayName.value.slice(0, 1) || 'U').toUpperCase())
const roleLabel = computed(() => (isAdmin.value ? '管理员' : '普通用户'))

const menuItems = computed<MenuProps['items']>(() => {
  const items: NonNullable<MenuProps['items']> = [{ key: '/home', label: '首页' }]
  if (isAdmin.value) {
    items.push({ key: '/apps/manage', label: '应用管理' })
    items.push({ key: '/chats/manage', label: '对话管理' })
    items.push({ key: '/users', label: '用户管理' })
  }
  return items
})

const handleMenuClick: MenuProps['onClick'] = (e) => {
  router.push(String(e.key))
}

const handleUserMenuClick: MenuProps['onClick'] = (e) => {
  if (e.key === 'profile') {
    router.push('/profile')
    return
  }

  if (e.key !== 'logout') {
    return
  }

  Modal.confirm({
    title: '确认退出登录？',
    content: '退出后需要重新登录才能继续生成和管理应用。',
    okText: '退出登录',
    cancelText: '取消',
    async onOk() {
      try {
        await logoutUser()
      } finally {
        loginUserStore.clearLoginUser()
        message.success('已退出登录')
        await router.replace('/login')
      }
    },
  })
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background:
    radial-gradient(circle at 95% 6%, rgba(79, 198, 219, 0.2), transparent 18%),
    radial-gradient(circle at 8% 88%, rgba(80, 159, 255, 0.15), transparent 18%),
    linear-gradient(180deg, #f7fbff 0%, #edf4fb 100%);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 78px;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(27, 39, 59, 0.08);
  box-sizing: border-box;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.brand-logo {
  width: 46px;
  height: 46px;
  object-fit: contain;
  filter: drop-shadow(0 12px 24px rgba(31, 167, 199, 0.16));
}

.brand-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
}

.brand-title {
  color: #16233a;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.brand-subtitle {
  color: #6d7c93;
  font-size: 12px;
}

.nav-menu {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  background: transparent;
  border-bottom: 0;
}

.user-zone {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(26, 43, 69, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(24, 45, 79, 0.06);
}

.avatar {
  background: linear-gradient(145deg, #1fb7cf, #127fc6);
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.user-name {
  color: #1b273b;
  font-weight: 700;
}

.user-role {
  color: #7c8aa2;
  font-size: 12px;
}

.app-content {
  padding: 28px;
}

:deep(.nav-menu.ant-menu-horizontal) {
  width: 100%;
  height: 100%;
  border-bottom: 0;
  align-items: center;
}

:deep(.nav-menu .ant-menu-overflow) {
  width: 100%;
  justify-content: center;
}

:deep(.nav-menu .ant-menu-item) {
  display: flex;
  align-items: center;
  height: 78px;
  margin-top: 0;
  margin-bottom: 0;
  color: #53627a;
  font-weight: 600;
}

:deep(.nav-menu .ant-menu-item-selected) {
  color: #158fb9;
}

:deep(.nav-menu .ant-menu-item-selected::after) {
  border-bottom-width: 3px !important;
  border-bottom-color: #20bfd1 !important;
}

@media (max-width: 960px) {
  .app-header {
    height: auto;
    padding: 16px 20px;
    flex-wrap: wrap;
  }

  .nav-menu {
    order: 3;
    flex-basis: 100%;
    justify-content: flex-start;
  }

  .app-content {
    padding: 18px;
  }
}
</style>
