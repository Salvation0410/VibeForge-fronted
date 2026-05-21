<template>
  <a-layout class="app-layout">
    <a-layout-header class="app-header">
      <div class="brand">
        <div class="brand-mark">Y</div>
        <div>
          <div class="brand-name">YuAIGenerate</div>
        </div>
      </div>

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

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

const selectedKeys = ref<string[]>([route.path])

watch(
  () => route.path,
  (path) => {
    selectedKeys.value = [path]
  },
  { immediate: true },
)

const isAdmin = computed(() => loginUserStore.loginUser?.userRole === 'admin')
const displayName = computed(() => loginUserStore.loginUser?.nickname || loginUserStore.loginUser?.account || '用户')
const avatarText = computed(() => (displayName.value?.slice(0, 1) || 'U').toUpperCase())
const roleLabel = computed(() => (isAdmin.value ? '管理员' : '普通用户'))

const menuItems = computed<MenuProps['items']>(() => {
  const items: MenuProps['items'] = [{ key: '/home', label: '首页' }]
  if (isAdmin.value) {
    items.push({ key: '/users', label: '用户管理' })
  }
  return items
})

const handleMenuClick: MenuProps['onClick'] = (e) => {
  router.push(String(e.key))
}

const handleUserMenuClick: MenuProps['onClick'] = (e) => {
  if (e.key !== 'logout') {
    return
  }

  Modal.confirm({
    title: '确认退出登录？',
    content: '退出后需要重新登录。',
    okText: '退出',
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
    radial-gradient(circle at top right, rgba(41, 171, 225, 0.12), transparent 24%),
    linear-gradient(180deg, #f6f9fd 0%, #edf3f9 100%);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 72px;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(26, 43, 69, 0.08);
  box-sizing: border-box;
  line-height: normal;
}

.brand {
  flex: 0 0 260px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: white;
  background: linear-gradient(145deg, #20bfd1, #178fd4);
  box-shadow: 0 12px 24px rgba(29, 149, 196, 0.28);
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #1b273b;
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
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.avatar {
  cursor: pointer;
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
  font-weight: 600;
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
  line-height: normal;
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
  height: 72px;
  margin-top: 0;
  margin-bottom: 0;
}

:deep(.nav-menu .ant-menu-title-content) {
  line-height: 1;
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

  .brand {
    flex: 1 1 auto;
  }
}
</style>
