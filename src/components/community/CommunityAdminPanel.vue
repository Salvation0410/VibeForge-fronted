<template>
  <aside class="community-admin-panel">
    <section class="admin-card">
      <div class="card-header">
        <span class="eyebrow">Admin</span>
        <h3>社区后台</h3>
        <p>管理员可以在这里审核帖子、管理评论和维护标签。</p>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <span>当前帖子</span>
          <strong>{{ postCount }}</strong>
        </div>
        <div class="stat-item">
          <span>待审核</span>
          <strong>{{ pendingCount }}</strong>
        </div>
        <div class="stat-item">
          <span>社区标签</span>
          <strong>{{ tagCount }}</strong>
        </div>
      </div>

      <div class="link-group">
        <button type="button" @click="router.push('/community/posts/manage')">帖子审核</button>
        <button type="button" @click="router.push('/community/comments/manage')">评论管理</button>
        <button type="button" @click="router.push('/community/tags/manage')">标签管理</button>
      </div>
    </section>

    <section class="admin-card compact">
      <div class="card-header">
        <h4>其它后台</h4>
      </div>
      <div class="link-group compact-links">
        <button type="button" @click="router.push('/users')">用户管理</button>
        <button type="button" @click="router.push('/apps/manage')">应用管理</button>
        <button type="button" @click="router.push('/chats/manage')">对话管理</button>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  postCount: number
  pendingCount: number
  tagCount: number
}>()

const router = useRouter()
</script>

<style scoped>
.community-admin-panel {
  display: grid;
  gap: 16px;
}

.admin-card {
  display: grid;
  gap: 18px;
  padding: 22px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.admin-card.compact {
  gap: 12px;
}

.card-header h3,
.card-header h4 {
  margin: 0;
  color: #0f172a;
}

.card-header p {
  margin: 8px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 8px;
  color: #0891b2;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  padding: 14px 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f8fc 100%);
  text-align: center;
}

.stat-item span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.stat-item strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 22px;
}

.link-group {
  display: grid;
  gap: 10px;
}

.link-group button {
  height: 42px;
  border: 1px solid rgba(8, 145, 178, 0.14);
  border-radius: 14px;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  text-align: left;
  padding: 0 14px;
}

.link-group button:hover {
  border-color: rgba(8, 145, 178, 0.32);
  background: #f0fbff;
}

.compact-links button {
  border-color: rgba(15, 23, 42, 0.08);
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
