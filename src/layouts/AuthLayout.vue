<template>
  <div class="auth-page">
    <main class="auth-shell">
      <section class="brand-side" aria-label="平台介绍">
        <header class="brand-header">
          <img class="brand-logo" src="@/assets/logo.png" alt="" aria-hidden="true" />
          <strong>智创 · AI应用平台</strong>
        </header>

        <div class="hero-copy">
          <h1><span>AI驱动</span>应用创新<br />快速构建业务价值</h1>
          <p>通过可视化与智能化能力，助力企业与开发者快速构建、发布和运营 AI 应用</p>
        </div>

        <div class="capability-list" aria-label="平台能力">
          <article v-for="item in capabilities" :key="item.title" class="capability-item">
            <div class="capability-icon" :class="item.theme">
              <component :is="item.icon" />
            </div>
            <div>
              <h2>{{ item.title }}</h2>
              <p>{{ item.desc }}</p>
            </div>
          </article>
        </div>

        <div class="product-visual" aria-hidden="true">
          <div class="visual-board">
            <div class="board-top">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="flow-grid">
              <i v-for="index in 8" :key="index"></i>
            </div>
            <div class="flow-line one"></div>
            <div class="flow-line two"></div>
          </div>
          <div class="ai-chip">
            <DeploymentUnitOutlined />
            <span>AI应用</span>
          </div>
          <div class="play-chip">
            <CaretRightFilled />
          </div>
          <div class="stat-card small-card">
            <BarChartOutlined />
            <span></span>
            <span></span>
          </div>
        </div>

        <dl class="metrics">
          <div>
            <dt>10万+</dt>
            <dd>应用创建</dd>
          </div>
          <div>
            <dt>50万+</dt>
            <dd>开发者</dd>
          </div>
          <div>
            <dt>99.9%</dt>
            <dd>服务可用性</dd>
          </div>
        </dl>

        <footer class="auth-footer">
          <p>© 2024 智创 · AI应用平台　粤ICP备2024012345号-1</p>
          <nav aria-label="辅助链接">
            <a href="javascript:void(0)">帮助中心</a>
            <span></span>
            <a href="javascript:void(0)">隐私政策</a>
            <span></span>
            <a href="javascript:void(0)">服务条款</a>
          </nav>
        </footer>
      </section>

      <section class="form-side">
        <div class="mobile-brand">
          <img class="brand-logo" src="@/assets/logo.png" alt="" aria-hidden="true" />
          <strong>智创 · AI应用平台</strong>
        </div>

        <div class="auth-card">
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
        </div>

        <div class="other-login">
          <div class="divider"><span>其他登录方式</span></div>
          <div class="other-actions">
            <button type="button" aria-label="微信登录">
              <WechatOutlined />
              <span>微信登录</span>
            </button>
            <button type="button" aria-label="企业SSO">
              <BankOutlined />
              <span>企业SSO</span>
            </button>
          </div>
        </div>

        <footer class="mobile-footer">
          <nav aria-label="辅助链接">
            <a href="javascript:void(0)">帮助中心</a>
            <span></span>
            <a href="javascript:void(0)">隐私政策</a>
            <span></span>
            <a href="javascript:void(0)">服务条款</a>
          </nav>
          <p>© 2024 智创 · AI应用平台<br />粤ICP备2024012345号-1</p>
        </footer>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  CaretRightFilled,
  DeploymentUnitOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  WechatOutlined,
} from '@ant-design/icons-vue'
import LoginView from '@/pages/LoginView.vue'
import RegisterView from '@/pages/RegisterView.vue'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => (route.name === 'register' ? 'register' : 'login'))

const capabilities = [
  {
    title: '可视化应用搭建',
    desc: '拖拽式编排，零代码快速构建 AI 应用',
    icon: AppstoreOutlined,
    theme: 'blue',
  },
  {
    title: '丰富的模型与插件',
    desc: '集成主流大模型与企业级组件生态',
    icon: ThunderboltOutlined,
    theme: 'violet',
  },
  {
    title: '应用发布与运营',
    desc: '一键发布，精细化运营与数据分析',
    icon: BarChartOutlined,
    theme: 'cyan',
  },
  {
    title: '企业级安全与管理',
    desc: '权限管控、数据安全与合规保障',
    icon: SafetyOutlined,
    theme: 'soft',
  },
]

const go = (path: '/login' | '/register') => {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>

<style scoped>
.auth-page {
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 24%, rgba(34, 108, 255, 0.1), transparent 30%),
    radial-gradient(circle at 72% 15%, rgba(79, 188, 255, 0.12), transparent 28%),
    #f7fbff;
  color: #14213d;
}

.auth-shell {
  display: grid;
  grid-template-columns: minmax(620px, 1fr) minmax(430px, 0.64fr);
  height: 100vh;
  min-height: 100vh;
}

.brand-side {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 32px 32px 28px;
  overflow: hidden;
}

.brand-header,
.mobile-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #13213b;
  font-size: 18px;
  font-weight: 800;
}

.brand-logo {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 8px 18px rgba(36, 117, 255, 0.16);
}

.hero-copy {
  max-width: 480px;
  margin-top: 132px;
}

.hero-copy h1 {
  margin: 0;
  color: #102248;
  font-size: 34px;
  font-weight: 900;
  line-height: 1.36;
  letter-spacing: 0;
}

.hero-copy h1 span {
  color: #2f73df;
}

.hero-copy p {
  margin: 24px 0 0;
  max-width: 430px;
  color: #607089;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.9;
}

.capability-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 380px;
  margin-top: 58px;
}

.capability-item {
  display: grid;
  grid-template-columns: 56px 1fr;
  align-items: center;
  gap: 16px;
}

.capability-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  color: #0f6cff;
  font-size: 25px;
  box-shadow: 0 12px 28px rgba(41, 103, 185, 0.1);
}

.capability-icon.blue {
  background: #eaf3ff;
}

.capability-icon.violet {
  color: #7b4df5;
  background: #f1e9ff;
}

.capability-icon.cyan {
  color: #11a8bf;
  background: #e5fbff;
}

.capability-icon.soft {
  background: #edf5ff;
}

.capability-item h2 {
  margin: 0;
  color: #17233d;
  font-size: 16px;
  font-weight: 850;
}

.capability-item p {
  margin: 7px 0 0;
  color: #64758f;
  font-size: 13px;
  line-height: 1.5;
}

.product-visual {
  position: absolute;
  right: 6%;
  bottom: 145px;
  width: 430px;
  height: 400px;
  perspective: 900px;
}

.visual-board {
  position: absolute;
  inset: 24px 8px 64px 22px;
  padding: 28px;
  border: 1px solid rgba(107, 156, 226, 0.25);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(224, 239, 255, 0.72));
  box-shadow: 0 34px 70px rgba(55, 107, 179, 0.18);
  transform: rotateY(-24deg) rotateX(9deg);
  backdrop-filter: blur(10px);
}

.board-top {
  display: flex;
  gap: 8px;
}

.board-top span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6da7ff;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 34px;
}

.flow-grid i {
  height: 42px;
  border-radius: 10px;
  background: rgba(83, 145, 242, 0.16);
  box-shadow: inset 0 0 0 1px rgba(47, 111, 255, 0.12);
}

.flow-grid i:nth-child(2),
.flow-grid i:nth-child(5) {
  background: rgba(35, 112, 255, 0.35);
}

.flow-line {
  position: absolute;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #5c9dff, transparent);
}

.flow-line.one {
  left: 82px;
  right: 84px;
  top: 126px;
}

.flow-line.two {
  left: 116px;
  right: 52px;
  top: 188px;
}

.ai-chip,
.play-chip,
.small-card {
  position: absolute;
  display: grid;
  place-items: center;
  box-shadow: 0 22px 40px rgba(35, 112, 255, 0.2);
}

.ai-chip {
  left: 52px;
  top: 142px;
  width: 84px;
  height: 84px;
  border-radius: 22px;
  background: linear-gradient(145deg, #1d7bff, #4ab2ff);
  color: #ffffff;
  font-size: 28px;
}

.ai-chip span {
  margin-top: -14px;
  font-size: 13px;
  font-weight: 800;
}

.play-chip {
  right: 88px;
  bottom: 96px;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #2378ff;
  color: #ffffff;
  font-size: 24px;
}

.small-card {
  right: 36px;
  bottom: 34px;
  width: 92px;
  height: 72px;
  border: 1px solid rgba(96, 148, 223, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  color: #2378ff;
  font-size: 22px;
}

.small-card span {
  width: 42px;
  height: 6px;
  border-radius: 999px;
  background: #d5e6ff;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 360px;
  margin: auto 0 76px;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 40px rgba(54, 103, 170, 0.1);
}

.metrics div {
  padding: 18px 12px;
  text-align: center;
}

.metrics dt {
  color: #176fff;
  font-size: 21px;
  font-weight: 900;
}

.metrics dd {
  margin: 8px 0 0;
  color: #68758a;
  font-size: 13px;
}

.auth-footer,
.mobile-footer {
  color: #778399;
  font-size: 12px;
}

.auth-footer p,
.mobile-footer p {
  margin: 0 0 14px;
}

.auth-footer nav,
.mobile-footer nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-footer a,
.mobile-footer a {
  color: inherit;
  text-decoration: none;
}

.auth-footer nav span,
.mobile-footer nav span {
  width: 1px;
  height: 12px;
  background: #c7d3e4;
}

.form-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 18px 64px;
  border-left: 1px solid rgba(218, 229, 245, 0.72);
  background: rgba(255, 255, 255, 0.55);
  box-shadow: -18px 0 42px rgba(44, 86, 145, 0.04);
}

.mobile-brand {
  display: none;
  margin-bottom: 30px;
}

.auth-card {
  width: min(100%, 520px);
  border: 1px solid #e7edf7;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 22px 48px rgba(32, 76, 135, 0.1);
  backdrop-filter: blur(14px);
}

.card-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-bottom: 1px solid #edf1f7;
}

.tab {
  position: relative;
  height: 56px;
  border: 0;
  background: transparent;
  color: #1d2a44;
  font-size: 18px;
  font-weight: 750;
  cursor: pointer;
}

.tab::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: -1px;
  height: 2px;
  background: transparent;
}

.tab.active {
  color: #086dff;
}

.tab.active::after {
  background: #176fff;
}

.card-body {
  padding: 20px 40px 24px;
}

.other-login {
  width: min(100%, 520px);
  margin-top: 18px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 18px;
  color: #7c8799;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e4eaf3;
}

.other-actions {
  display: flex;
  justify-content: center;
  gap: 46px;
  margin-top: 14px;
}

.other-actions button {
  display: grid;
  gap: 8px;
  place-items: center;
  border: 0;
  background: transparent;
  color: #6c778a;
  font-size: 13px;
  cursor: pointer;
}

.other-actions button :deep(.anticon) {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  color: #176fff;
  font-size: 21px;
  box-shadow: 0 10px 26px rgba(40, 85, 140, 0.1);
}

@media (max-height: 720px) and (min-width: 1181px) {
  .brand-side {
    padding: 24px 32px 18px;
  }

  .hero-copy {
    margin-top: 76px;
  }

  .hero-copy h1 {
    font-size: 30px;
    line-height: 1.28;
  }

  .hero-copy p {
    margin-top: 16px;
    line-height: 1.65;
  }

  .capability-list {
    gap: 18px;
    margin-top: 36px;
  }

  .capability-item {
    grid-template-columns: 46px 1fr;
    gap: 12px;
  }

  .capability-icon {
    width: 46px;
    height: 46px;
    font-size: 21px;
  }

  .product-visual {
    right: 4%;
    bottom: 16px;
    width: 330px;
    height: 280px;
  }

  .metrics,
  .auth-footer,
  .other-login {
    display: none;
  }

  .form-side {
    padding-block: 14px;
  }

  .auth-card {
    width: min(100%, 500px);
  }
}

.other-actions button:first-child :deep(.anticon) {
  color: #17b928;
}

.mobile-footer {
  display: none;
}

@media (max-width: 1180px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .brand-side {
    display: none;
  }

  .form-side {
    min-height: 100vh;
    padding: 24px 18px;
    border-left: 0;
  }

  .mobile-brand {
    display: inline-flex;
  }

  .mobile-footer {
    display: block;
    margin-top: 34px;
    text-align: center;
  }

  .mobile-footer nav {
    justify-content: center;
    margin-bottom: 18px;
  }
}

@media (max-width: 560px) {
  .form-side {
    justify-content: flex-start;
    padding-inline: 12px;
  }

  .auth-card {
    width: 100%;
  }

  .card-body {
    padding: 28px 18px 30px;
  }

  .tab {
    height: 64px;
    font-size: 16px;
  }

  .other-actions {
    gap: 28px;
  }
}
</style>
