<template>
  <section class="docs-page">
    <aside class="docs-sidebar">
      <div class="sidebar-brand">
        <img src="@/assets/logo.png" alt="智创 AI 应用平台" />
        <div>
          <span>使用文档</span>
          <strong>智创 AI 应用平台</strong>
        </div>
      </div>

      <nav class="doc-nav">
        <a
          v-for="item in navItems"
          :key="item.id"
          :href="`#${item.id}`"
          :class="{ active: activeSection === item.id }"
          @click="activeSection = item.id"
        >
          {{ item.title }}
        </a>
      </nav>
    </aside>

    <main class="docs-main">
      <section class="docs-hero" id="intro">
        <span class="eyebrow">Guide</span>
        <h1>智创 AI 应用平台使用文档</h1>
        <p>
          这里整理了从注册登录、创建应用、对话生成、部署下载到社区分享和后台管理的完整流程。
          如果你是第一次使用，可以按顺序读；如果只是查某个功能，直接从左侧目录跳转。
        </p>
        <div class="hero-actions">
          <a-button type="primary" size="large" @click="router.push('/home')">开始创建应用</a-button>
          <a-button size="large" @click="router.push('/community')">查看交流社区</a-button>
        </div>
      </section>

      <section class="doc-section" id="what-is-it">
        <h2>平台能做什么</h2>
        <p>
          智创 AI 应用平台可以把一段自然语言需求转成可预览、可继续编辑的网页或应用原型。
          你只需要描述目标、页面内容和交互，系统会创建应用记录，并进入对话生成页面继续完善。
        </p>
        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.title" class="feature-card">
            <span>{{ feature.index }}</span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </article>
        </div>
      </section>

      <section class="doc-section" id="quick-start">
        <h2>快速开始</h2>
        <ol class="step-list">
          <li>
            <strong>登录或注册账号</strong>
            <p>进入登录页后，可以使用账号密码或邮箱方式登录。注册成功后会回到登录页。</p>
          </li>
          <li>
            <strong>在首页输入需求</strong>
            <p>描述你想做的应用，例如“做一个记账工具，可以记录收支，并按月份统计”。</p>
          </li>
          <li>
            <strong>点击开始生成</strong>
            <p>系统会创建应用，并自动进入生成对话页。首次进入会带上创建模式。</p>
          </li>
          <li>
            <strong>继续对话完善页面</strong>
            <p>你可以要求修改布局、颜色、文案、组件和交互，直到应用符合预期。</p>
          </li>
        </ol>
      </section>

      <section class="doc-section" id="prompt">
        <h2>如何写好创建提示词</h2>
        <p>提示词不需要写得很专业，但要说清楚“给谁用、做什么、页面里有什么”。下面这些写法更容易生成出可用结果。</p>
        <div class="prompt-examples">
          <div>
            <h3>推荐写法</h3>
            <ul>
              <li>做一个适合小型餐厅的点餐页面，包含菜品分类、购物车和下单按钮。</li>
              <li>做一个项目进度看板，可以按待办、进行中、已完成管理任务。</li>
              <li>做一个健身打卡页面，支持记录训练项目、时长和完成日期。</li>
            </ul>
          </div>
          <div>
            <h3>尽量避免</h3>
            <ul>
              <li>只写“做个网站”。</li>
              <li>只写“好看一点”。</li>
              <li>一次塞入太多无关需求，导致页面重点不清楚。</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="doc-section" id="generate">
        <h2>对话生成与继续编辑</h2>
        <p>
          应用创建后会进入生成对话页。你可以把它当成一个会写页面的协作者：先生成第一版，再逐步提出修改。
          每次生成都会保留聊天记录，方便回看需求变化。
        </p>
        <div class="info-panel">
          <h3>常见修改指令</h3>
          <p>“把首页改成深色风格”、“增加一个数据统计卡片”、“把按钮改成蓝色”、“新增一个订单列表区域”。</p>
        </div>
      </section>

      <section class="doc-section" id="manage">
        <h2>管理我的应用</h2>
        <p>
          首页的“我的应用”区域会展示你创建过的应用。你可以继续进入对话页、编辑应用信息，或者删除不再需要的应用。
          管理员还可以在后台管理所有应用，并维护精选展示。
        </p>
      </section>

      <section class="doc-section" id="community">
        <h2>交流社区</h2>
        <p>
          社区用于发布作品、问题和经验。帖子发布后会先进入审核，通过后才会展示在广场。
          用户可以浏览帖子、评论、回复和点赞。管理员可以在后台处理帖子、评论和标签。
        </p>
        <div class="community-flow">
          <span>发布帖子</span>
          <span>管理员审核</span>
          <span>广场展示</span>
          <span>评论互动</span>
        </div>
      </section>

      <section class="doc-section" id="admin">
        <h2>后台管理</h2>
        <p>管理员账号可以进入后台，查看数据报表，并管理用户、应用、对话记录、社区帖子、评论和标签。</p>
        <div class="admin-list">
          <div v-for="item in adminItems" :key="item.title">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </section>

      <section class="doc-section" id="faq">
        <h2>常见问题</h2>
        <a-collapse ghost>
          <a-collapse-panel key="1" header="为什么应用创建后要进入对话页？">
            <p>首页只负责创建应用和保存初始需求，真正的代码生成在对话页完成，方便你边生成边修改。</p>
          </a-collapse-panel>
          <a-collapse-panel key="2" header="为什么我的帖子没有出现在社区广场？">
            <p>新帖子默认需要管理员审核。通过后会展示在广场，未通过时可以在个人主页查看状态。</p>
          </a-collapse-panel>
          <a-collapse-panel key="3" header="评论被驳回后会怎样？">
            <p>被驳回的评论不会再出现在普通用户的评论列表中。如果驳回的是父评论，它下面的回复也会一起隐藏。</p>
          </a-collapse-panel>
        </a-collapse>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeSection = ref('intro')

const navItems = [
  { id: 'intro', title: '文档首页' },
  { id: 'what-is-it', title: '平台介绍' },
  { id: 'quick-start', title: '快速开始' },
  { id: 'prompt', title: '提示词写法' },
  { id: 'generate', title: '对话生成' },
  { id: 'manage', title: '应用管理' },
  { id: 'community', title: '交流社区' },
  { id: 'admin', title: '后台管理' },
  { id: 'faq', title: '常见问题' },
]

const features = [
  {
    index: '01',
    title: '自然语言创建应用',
    description: '用一句话描述页面目标，系统会创建应用并进入生成流程。',
  },
  {
    index: '02',
    title: '对话式持续修改',
    description: '生成后可以继续要求调整布局、颜色、文案和功能区域。',
  },
  {
    index: '03',
    title: '应用管理与精选',
    description: '用户管理自己的应用，管理员可以维护全站应用和精选展示。',
  },
  {
    index: '04',
    title: '社区分享与审核',
    description: '作品和经验可以发布到社区，通过审核后开放浏览和互动。',
  },
]

const adminItems = [
  { title: '数据报表', description: '查看用户、应用、社区内容等核心数据概览。' },
  { title: '应用管理', description: '维护应用状态、优先级、封面和精选展示。' },
  { title: '社区管理', description: '审核帖子和评论，维护标签，处理违规内容。' },
  { title: '用户管理', description: '创建用户、编辑资料、调整账号启用状态。' },
]
</script>

<style scoped>
.docs-page {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 26px;
  max-width: 1440px;
  margin: 0 auto;
}

.docs-sidebar {
  position: sticky;
  top: 102px;
  align-self: start;
  padding: 18px;
  border: 1px solid rgba(22, 36, 58, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 44px rgba(24, 45, 79, 0.08);
}

.sidebar-brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(22, 36, 58, 0.08);
}

.sidebar-brand img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.sidebar-brand span {
  display: block;
  color: #1683a4;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.sidebar-brand strong {
  color: #152238;
  font-size: 15px;
}

.doc-nav {
  display: grid;
  gap: 6px;
  margin-top: 16px;
}

.doc-nav a {
  padding: 10px 12px;
  border-radius: 6px;
  color: #58677e;
  font-weight: 700;
  text-decoration: none;
}

.doc-nav a:hover,
.doc-nav a.active {
  background: #e6f7fb;
  color: #127f9b;
}

.docs-main {
  display: grid;
  gap: 22px;
  min-width: 0;
}

.docs-hero,
.doc-section {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 22px 56px rgba(24, 45, 79, 0.08);
}

.docs-hero {
  padding: 52px;
  background:
    radial-gradient(circle at 88% 10%, rgba(31, 183, 207, 0.18), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 251, 255, 0.94));
}

.eyebrow {
  color: #1683a4;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.docs-hero h1 {
  max-width: 760px;
  margin: 10px 0 0;
  color: #142137;
  font-size: 48px;
  line-height: 1.1;
}

.docs-hero p,
.doc-section p {
  color: #637189;
  font-size: 16px;
  line-height: 1.8;
}

.docs-hero p {
  max-width: 820px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.doc-section {
  padding: 34px;
  scroll-margin-top: 100px;
}

.doc-section h2 {
  margin: 0 0 14px;
  color: #152238;
  font-size: 30px;
}

.feature-grid,
.admin-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.feature-card,
.admin-list div,
.info-panel,
.prompt-examples > div {
  padding: 18px;
  border: 1px solid rgba(22, 36, 58, 0.08);
  border-radius: 8px;
  background: #fbfdff;
}

.feature-card span {
  color: #1683a4;
  font-weight: 900;
}

.feature-card h3,
.admin-list h3,
.info-panel h3,
.prompt-examples h3 {
  margin: 8px 0;
  color: #17253c;
}

.step-list {
  display: grid;
  gap: 14px;
  padding: 0;
  list-style: none;
}

.step-list li {
  padding: 18px 18px 18px 22px;
  border-left: 4px solid #1fb7cf;
  border-radius: 6px;
  background: #fbfdff;
}

.step-list strong {
  color: #152238;
  font-size: 17px;
}

.prompt-examples {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.prompt-examples ul {
  margin: 0;
  padding-left: 18px;
  color: #5d6b82;
  line-height: 1.8;
}

.community-flow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.community-flow span {
  padding: 14px;
  border-radius: 8px;
  background: #eaf9fc;
  color: #127f9b;
  text-align: center;
  font-weight: 800;
}

@media (max-width: 980px) {
  .docs-page {
    grid-template-columns: 1fr;
  }

  .docs-sidebar {
    position: static;
  }

  .doc-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .docs-hero,
  .doc-section {
    padding: 24px;
  }

  .docs-hero h1 {
    font-size: 36px;
  }

  .feature-grid,
  .admin-list,
  .prompt-examples,
  .community-flow {
    grid-template-columns: 1fr;
  }
}
</style>
