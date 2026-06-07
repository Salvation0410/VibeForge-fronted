<template>
  <section class="admin-shell">
    <aside class="admin-rail">
      <div class="rail-head">
        <span class="eyebrow">Admin</span>
        <h1>后台管理</h1>
      </div>

      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        :items="adminMenuItems"
        class="admin-menu"
        @click="handleMenuClick"
      />
    </aside>

    <main class="admin-main">
      <router-view />
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuProps } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()
const selectedKeys = ref<string[]>(['/admin/dashboard'])

const adminMenuItems = computed<MenuProps['items']>(() => [
  { key: '/admin/dashboard', label: '数据报表' },
  { key: '/admin/community/posts', label: '帖子审核' },
  { key: '/admin/community/comments', label: '评论管理' },
  { key: '/admin/community/tags', label: '标签管理' },
  { key: '/admin/apps', label: '应用管理' },
  { key: '/admin/chats', label: '对话管理' },
  { key: '/admin/users', label: '用户管理' },
])

watch(
  () => route.path,
  (path) => {
    const match = adminMenuItems.value?.find((item) => path.startsWith(String(item?.key)))
    selectedKeys.value = match?.key ? [String(match.key)] : ['/admin/dashboard']
  },
  { immediate: true },
)

const handleMenuClick: MenuProps['onClick'] = (event) => {
  void router.push(String(event.key))
}
</script>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  gap: 22px;
  max-width: 1480px;
  margin: 0 auto;
}

.admin-rail {
  position: sticky;
  top: 98px;
  align-self: start;
  min-height: calc(100vh - 126px);
  padding: 18px;
  border: 1px solid rgba(28, 45, 72, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 48px rgba(21, 43, 72, 0.08);
}

.rail-head {
  margin-bottom: 18px;
  padding: 8px 8px 14px;
  border-bottom: 1px solid rgba(26, 43, 69, 0.08);
}

.eyebrow {
  color: #1683a4;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.rail-head h1 {
  margin: 4px 0 0;
  color: #152238;
  font-size: 24px;
  line-height: 1.15;
}

.admin-menu {
  border-inline-end: 0;
  background: transparent;
}

.admin-main {
  min-width: 0;
}

:deep(.admin-menu .ant-menu-item) {
  height: 42px;
  border-radius: 6px;
  font-weight: 700;
}

:deep(.admin-menu .ant-menu-item-selected) {
  background: #e6f7fb;
  color: #127f9b;
}

@media (max-width: 900px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .admin-rail {
    position: static;
    min-height: 0;
  }
}
</style>
