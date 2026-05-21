<template>
  <main class="home-view">
    <a-card class="home-card">
      <p class="eyebrow">首页占位页</p>
      <h1>这里可以放你的普通用户工作台首页</h1>
      <p>当前先提供一个最小可跳转主页，后续可以替换为真实首页内容。</p>
      <a-button type="primary" @click="goLogin">返回登录</a-button>
    </a-card>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(95, 166, 255, 0.12), transparent 36%),
    #f5f8fc;
}

.home-card {
  width: min(720px, 100%);
  padding: 12px;
  border-radius: 24px;
  box-shadow: 0 18px 60px rgba(12, 28, 52, 0.12);
}

.eyebrow {
  margin: 0 0 12px;
  color: #5b7aa5;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #132033;
}

p {
  color: #627085;
  line-height: 1.8;
}
</style>
