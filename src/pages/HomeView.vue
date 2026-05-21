<template>
  <section class="home-page">
    <a-row :gutter="[20, 20]">
      <a-col :xs="24" :lg="16">
        <a-card class="hero-card">
          <p class="eyebrow">HOME</p>
          <h1>欢迎回来，{{ displayName }}</h1>
          <p class="desc">
            这里先作为首页占位。后续可以继续扩展为工作台、统计卡片、消息中心或快捷入口。
          </p>

          <a-space class="actions">
            <a-button v-if="isAdmin" type="primary" @click="goUsers">进入用户管理</a-button>
            <a-button @click="refreshUser">刷新用户信息</a-button>
          </a-space>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="8">
        <a-card class="side-card">
          <p class="card-title">当前登录信息</p>
          <div class="info-row">
            <span>账号</span>
            <strong>{{ loginUserStore.loginUser?.account || '-' }}</strong>
          </div>
          <div class="info-row">
            <span>邮箱</span>
            <strong>{{ loginUserStore.loginUser?.email || '-' }}</strong>
          </div>
          <div class="info-row">
            <span>角色</span>
            <strong>{{ roleLabel }}</strong>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/loginUser'

const router = useRouter()
const loginUserStore = useLoginUserStore()

const isAdmin = computed(() => loginUserStore.loginUser?.userRole === 'admin')
const displayName = computed(() => loginUserStore.loginUser?.nickname || loginUserStore.loginUser?.account || '用户')
const roleLabel = computed(() => (isAdmin.value ? '管理员' : '普通用户'))

const goUsers = () => {
  router.push('/users')
}

const refreshUser = async () => {
  await loginUserStore.fetchLoginUser()
}
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 120px);
}

.hero-card,
.side-card {
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(30, 52, 86, 0.12);
}

.hero-card {
  min-height: 320px;
  padding: 8px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #5a7693;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #132033;
  font-size: clamp(28px, 3vw, 42px);
}

.desc {
  max-width: 720px;
  margin: 16px 0 0;
  color: #66758c;
  line-height: 1.8;
}

.actions {
  margin-top: 28px;
}

.side-card {
  height: 100%;
}

.card-title {
  margin: 0 0 18px;
  font-size: 16px;
  font-weight: 600;
  color: #1c2740;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(34, 55, 88, 0.08);
  color: #5f6f88;
}

.info-row strong {
  color: #132033;
}
</style>
