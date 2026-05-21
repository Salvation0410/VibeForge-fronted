<template>
  <div class="auth-page" :data-active="activeTab">
    <div class="bg-orb bg-orb-left"></div>
    <div class="bg-orb bg-orb-right"></div>
    <div class="bg-grid"></div>

    <main class="auth-shell">
      <aside class="hero">
        <div class="brand">
          <div class="brand-mark">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <defs>
                <linearGradient id="brandGradientTop" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#22d3ee" />
                  <stop offset="100%" stop-color="#1ea7c7" />
                </linearGradient>
                <linearGradient id="brandGradientBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#6ee7f5" />
                  <stop offset="100%" stop-color="#16a6d9" />
                </linearGradient>
              </defs>
              <path
                d="M10 11L20 6L30 11V18L20 24L10 18V11Z"
                class="mark-top"
              />
              <path
                d="M12 22L20 18L28 22V30L20 34L12 30V22Z"
                class="mark-bottom"
              />
            </svg>
          </div>
          <span class="brand-name">YuAIGenerate</span>
        </div>

        <h1>AI-Powered
Development
Platform</h1>
        <p>Build smarter. Ship faster. Keep the flow.</p>

        <div class="hero-illustration" aria-hidden="true">
          <div class="chip chip-back"></div>
          <div class="chip chip-mid">AI</div>
          <div class="chip chip-front"></div>
        </div>
      </aside>

      <section class="card">
        <header class="card-tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'login' }"
            type="button"
            @click="go('/login')"
          >
            登录
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'register' }"
            type="button"
            @click="go('/register')"
          >
            注册
          </button>
        </header>

        <div class="card-body">
          <LoginView v-if="activeTab === 'login'" key="login" />
          <RegisterView v-else key="register" />
        </div>

        <footer class="card-footer">
          <span>© 2026 YuAIGenerate. 普通用户入口示例。</span>
          <span class="footer-links">首页占位 · 隐私 · 条款 · 联系</span>
        </footer>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginView from '@/pages/LoginView.vue'
import RegisterView from '@/pages/RegisterView.vue'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => (route.name === 'register' ? 'register' : 'login'))

const go = (path: '/login' | '/register') => {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 6%, rgba(109, 183, 255, 0.18), transparent 22%),
    radial-gradient(circle at 8% 92%, rgba(57, 173, 225, 0.12), transparent 20%),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
  color: #1f2b43;
}

.bg-orb,
.bg-grid {
  position: absolute;
  pointer-events: none;
}

.bg-orb {
  border-radius: 999px;
  filter: blur(18px);
}

.bg-orb-left {
  width: 280px;
  height: 280px;
  top: 40px;
  left: -80px;
  background: rgba(24, 172, 206, 0.08);
}

.bg-orb-right {
  width: 460px;
  height: 460px;
  top: -140px;
  right: -160px;
  background: rgba(130, 192, 255, 0.18);
}

.bg-grid {
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.55) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.45) 1px, transparent 1px);
  background-size: 88px 88px;
  opacity: 0.16;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.4), transparent 78%);
}

.auth-shell {
  position: relative;
  z-index: 1;
  max-width: 1440px;
  margin: 0 auto;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(280px, 430px) minmax(0, 1fr);
  gap: 36px;
  align-items: center;
  padding: 32px 28px 24px;
}

.hero {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 8px 20px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  position: relative;
}

.brand-mark svg {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 12px 28px rgba(32, 165, 204, 0.24));
}

.mark-top {
  fill: url(#brandGradientTop);
}

.mark-bottom {
  fill: url(#brandGradientBottom);
}

.brand-name {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #1a263b;
}

.hero h1 {
  margin: 92px 0 0;
  max-width: 9ch;
  font-size: clamp(40px, 4.2vw, 68px);
  line-height: 1.06;
  letter-spacing: -0.05em;
  white-space: pre-line;
}

.hero p {
  max-width: 18ch;
  margin: 26px 0 0;
  font-size: 18px;
  line-height: 1.6;
  color: #60708a;
}

.hero-illustration {
  position: relative;
  height: 270px;
  margin-top: auto;
}

.chip {
  position: absolute;
  left: 26px;
  width: 220px;
  height: 104px;
  border-radius: 28px;
  border: 1px solid rgba(161, 204, 255, 0.5);
  background: rgba(255, 255, 255, 0.62);
  box-shadow:
    0 16px 40px rgba(130, 160, 200, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
}

.chip-back {
  top: 110px;
  transform: rotate(-12deg);
  opacity: 0.52;
}

.chip-mid {
  top: 70px;
  left: 52px;
  display: grid;
  place-items: center;
  color: #f4fbff;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.04em;
  background: linear-gradient(145deg, rgba(36, 193, 214, 0.98), rgba(31, 140, 230, 0.9));
  box-shadow:
    0 24px 50px rgba(25, 135, 198, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.chip-front {
  top: 14px;
  transform: rotate(10deg);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(240, 248, 255, 0.58));
}

.card {
  display: flex;
  flex-direction: column;
  min-height: 760px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 24px 60px rgba(32, 53, 85, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.78) inset;
  backdrop-filter: blur(16px);
  overflow: hidden;
}

.card-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  padding: 14px 56px 0;
  border-bottom: 1px solid rgba(36, 64, 100, 0.08);
}

.tab {
  position: relative;
  padding: 24px 0 18px;
  border: 0;
  background: transparent;
  color: #55647e;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
}

.tab::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -1px;
  width: 0;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #18a8c8, #15b8d4);
  transform: translateX(-50%);
  transition: width 0.2s ease;
}

.tab.active {
  color: #1e2d47;
}

.tab.active::after {
  width: 128px;
}

.card-body {
  display: block;
  flex: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 18px 28px 24px;
  color: #72829c;
  font-size: 13px;
}

.footer-links {
  display: inline-flex;
  gap: 18px;
}

:deep(.auth-panel) {
  position: relative;
  padding: 34px 40px 32px;
  min-height: 100%;
  transition: opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease;
}

@media (max-width: 1180px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .hero {
    padding-bottom: 0;
  }

  .hero h1 {
    margin-top: 42px;
  }
}

@media (max-width: 860px) {
  .card-tabs {
    padding-inline: 28px;
  }

  .card {
    min-height: auto;
  }

  .hero-illustration {
    height: 210px;
  }
}
</style>
