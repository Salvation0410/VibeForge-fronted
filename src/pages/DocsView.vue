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
          <a-button type="primary" size="large" @click="router.push('/home')"
            >开始创建应用</a-button
          >
          <a-button size="large" @click="openCommunity">查看交流社区</a-button>
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
            <p>
              系统会创建应用，并自动进入对话页开始生成第一版。等待生成完成后，在右侧预览检查结果。
            </p>
          </li>
          <li>
            <strong>继续对话完善页面</strong>
            <p>你可以要求修改布局、颜色、文案、组件和交互，直到应用符合预期。</p>
          </li>
        </ol>
      </section>

      <section class="doc-section" id="account">
        <h2>账号、登录与个人资料</h2>
        <div class="info-panel">
          <h3>注册与登录</h3>
          <p>
            注册页支持账号注册和邮箱注册，两种方式都需要填写昵称、密码及确认密码。页面要求密码至少 6
            位，两次密码一致。邮箱注册还需要先发送并填写 6
            位邮箱验证码，发送后需等待倒计时结束才能再次发送。
          </p>
          <p>
            注册成功后进入登录页，选择账号密码或邮箱密码登录。登录成功后进入首页。注册页不会提供管理员角色选择。
          </p>
          <h3>编辑自己的资料</h3>
          <p>
            在个人主页打开编辑资料，可修改昵称、邮箱、个人简介和头像；邮箱不是必填项。头像支持上传图片或填写头像地址，上传图片不能超过
            5MB。
          </p>
          <p>只有本人查看自己的主页时能编辑资料。其他用户的公开主页用于查看公开应用和社区文章。</p>
        </div>
      </section>

      <section class="doc-section" id="prompt">
        <h2>如何写好创建提示词</h2>
        <p>
          提示词不需要写得很专业，但要说清楚“给谁用、做什么、页面里有什么”。下面这些写法更容易生成出可用结果。
        </p>
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
        <div class="info-panel">
          <h3>建议的需求模板</h3>
          <p>
            下面是组织需求的建议，不是平台强制要求的格式：目标用户是谁；要解决什么问题；需要哪些页面与内容；按钮点击后做什么；希望的颜色和布局；哪些已有文字、图片和功能必须保留。
          </p>
          <p>
            例如：“给小型餐厅做一个点餐页面。包含菜单分类、菜品图片、购物车、数量增减和订单确认。使用暖色风格，手机上方便操作。保留我提供的菜品名称和图片。”
          </p>
          <h3>系统自动选择生成类型</h3>
          <p>
            系统会根据初始需求选择单文件网页（HTML）、多文件网页（MULTI_FILE）或 Vue
            应用项目（VUE_PROJECT）。当前创建流程由系统选择类型，无需手动切换。描述页面、交互和复杂度比指定技术名词更有帮助。
          </p>
          <p>
            生成的网页或应用原型需要实际检查。页面出现登录、支付或数据表单，并不代表已接入真实账号、支付服务或业务数据库。
          </p>
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
          <p>
            “把首页改成深色风格”、“增加一个数据统计卡片”、“把按钮改成蓝色”、“新增一个订单列表区域”。
          </p>
          <h3>逐步修改与优化提示</h3>
          <p>
            每轮说明要修改的区域、预期效果，以及需要保留的内容。例如：“只调整顶部导航和按钮颜色，保留其他功能、文字、图片和操作方式。”修改要求输入后需要点击发送，才会开始本轮生成。
          </p>
          <p>
            点击“优化提示”只会把建议填入待发送输入框，不会立即生成。可先检查或补充，再发送。建议会按当前应用类型要求完整可运行的结果，并要求保留原有功能、文字、图片与操作方式，不删除或替换原有图片。
          </p>
          <h3>等待生成与停止</h3>
          <p>
            生成期间可查看输出进度和累计字符数，屏幕上的实时文字只展示最近一段；完成后会重新读取已保存的完整聊天记录。请等待本轮结束后再发送下一条需求。
          </p>
          <p>
            点击“停止生成”后，页面会显示“正在停止”。必须等待后台确认任务结束，才能继续发送。生成期间保留上一版预览，本轮成功后才刷新；失败或停止不会用未完成内容覆盖旧预览。
          </p>
          <p>
            如果停止时结果已经进入最后保存阶段，以页面最终状态为准。首次生成失败时可能还没有可预览版本，可根据错误提示调整需求后重试。
          </p>
        </div>
      </section>

      <section class="doc-section" id="delivery">
        <h2>预览、部署、下载与导出</h2>
        <ol class="step-list">
          <li>
            <strong>先检查预览</strong>
            <p>
              生成完成后检查布局、文字、图片和关键按钮，尝试主要操作，并在电脑和手机尺寸下确认显示效果。发现问题时，把具体位置与预期结果写入下一轮需求。
            </p>
          </li>
          <li>
            <strong>部署应用</strong>
            <p>
              应用创建者可点击“部署应用”，成功后得到可访问链接。先确认生成已成功且主要功能可用，再分享链接；部署失败时查看页面提示，修复后重试。
            </p>
          </li>
          <li>
            <strong>下载代码</strong>
            <p>
              点击“下载代码”获取代码压缩包，适合本地继续开发或备份。代码下载不等于已部署，下载后运行仍需满足项目自身的运行条件。
            </p>
          </li>
          <li>
            <strong>导出 Markdown</strong>
            <p>
              点击“导出
              Markdown”下载该应用的聊天记录，用于保存需求和生成过程。它与代码压缩包是两种不同的下载内容。
            </p>
          </li>
        </ol>
      </section>

      <section class="doc-section" id="manage">
        <h2>管理我的应用</h2>
        <p>
          首页的“我的应用”区域会展示你创建过的应用。你可以继续进入对话页、编辑应用信息，或者删除不再需要的应用。
          管理员还可以在后台管理所有应用，并维护精选展示。
        </p>
        <div class="info-panel">
          <h3>查看与操作权限</h3>
          <p>
            应用创建者管理自己的应用；管理员可以管理全站应用。精选应用允许公开查看，但能查看不代表能编辑、下载代码或导出聊天记录。
          </p>
          <p>
            代码下载和部署仅允许应用创建者，管理员身份不会自动获得下载或部署他人应用的权限。聊天记录导出允许创建者或管理员操作。没有权限时，请使用自己的应用或联系相应管理人员。
          </p>
          <p>
            编辑应用信息用于维护应用资料；修改页面内容和功能应回到生成对话页。删除前确认应用是否仍需使用，并先备份所需代码与聊天记录。
          </p>
        </div>
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
        <div class="info-panel">
          <h3>搜索、筛选与发布</h3>
          <p>
            在社区广场可按关键词搜索、按标签筛选，并切换最新或热门排序。未登录用户可以浏览，发帖、点赞和评论需要先登录。
          </p>
          <p>
            发帖时填写标题、正文并选择标签，使用富文本编辑内容；可上传并预览图片，最多 9
            张，发布前可以删除不需要的图片。新帖提交后进入待审核状态，不会立即出现在广场，可在个人主页查看帖子状态。
          </p>
          <h3>评论、回复与点赞</h3>
          <p>
            已审核通过的帖子可以评论。评论默认通过，与帖子待审核不同；管理员仍可处理违规评论。评论以两级展示：顶层评论及其回复，回复某条回复时仍展示在对应顶层评论下面。
          </p>
          <p>
            帖子与评论的点赞可再次点击取消，以页面更新后的数量为准。被驳回的评论不在普通列表显示，父评论被驳回时其下回复也会隐藏。
          </p>
        </div>
      </section>

      <section class="doc-section" id="admin">
        <h2>后台管理</h2>
        <p>
          管理员账号可以进入后台，查看数据报表，并管理用户、应用、对话记录、社区帖子、评论和标签。
        </p>
        <div class="admin-list">
          <div v-for="item in adminItems" :key="item.title">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>
        <div class="info-panel">
          <h3>客服知识库</h3>
          <p>
            管理员可在客服知识库页面上传 PDF、DOCX、MD 或 TXT，单个文件不超过 20
            MiB。上传成功表示文件已保存并排队处理，不表示已经可以被客服检索。
          </p>
          <p>
            关注文档状态、文档与索引版本以及处理记录：“等待索引”表示文件已上传等待处理，“索引中”表示处理或等待重试，“已启用”表示可用于客服检索。失败时查看处理记录与错误提示，排除原因后使用“重试索引”。
          </p>
          <p>
            “重建全部文档索引”会提交后台重建任务，期间检索结果可能延迟更新，需要继续检查任务状态。删除文档也会异步清理索引，删除后无法恢复，请在确认前核对文档名称。
          </p>
          <p>
            建议按“当前使用说明”和“推荐产品使用规范”组织同一个知识库中的文档内容，注明适用功能、更新日期和操作边界。避免上传密码、密钥、个人隐私或未经核实的规划功能。
          </p>
        </div>
      </section>

      <section class="doc-section" id="customer-service">
        <h2>智能客服</h2>
        <p>
          智能客服用于咨询平台使用方法，例如注册、创建应用、部署、社区和权限规则。输入具体问题后发送；支持复制回答、重新提问、取消当前提问及清空当前聊天记录。
        </p>
        <div class="info-panel">
          <h3>查看参考来源</h3>
          <p>
            回答附有资料时，可展开“参考来源”，查看文档名、位置和摘要，核对答案依据。参考来源不是私人数据查询入口，客服不能查询你的密码、私人应用、私人聊天记录或他人的账号资料。
          </p>
          <p>
            提示没有可靠答案时，补充你所在页面、点击的按钮和报错文字，再换一种具体问法。服务暂时不可用时稍后重试，不要把这类提示当作操作已完成。
          </p>
        </div>
      </section>

      <section class="doc-section" id="recommended-practices">
        <h2>推荐产品使用规范</h2>
        <p>以下是推荐做法，帮助减少重复生成和分享前的遗漏，不是平台强制要求的流程。</p>
        <ol class="step-list">
          <li>
            <strong>先做最小可用版本</strong>
            <p>
              先描述核心页面与主要操作，确认第一版可用后再增加功能。每轮只处理一组相关问题，明确哪些现有内容必须保留。
            </p>
          </li>
          <li>
            <strong>用具体反馈代替笼统评价</strong>
            <p>
              写明出现问题的页面、操作步骤、当前结果和预期结果。例如：“手机上导航遮住了标题，请让导航换行，保留现有链接。”
            </p>
          </li>
          <li>
            <strong>检查后再分享</strong>
            <p>
              检查按钮、表单、图片和手机布局，区分演示数据与真实业务能力。重要修改前下载代码备份，部署后再打开访问链接确认效果。
            </p>
          </li>
          <li>
            <strong>保护资料并尊重社区规则</strong>
            <p>
              需求、截图和社区帖子中避免包含密码、密钥与他人隐私。分享作品时说明适用场景和已知限制，遇到审核问题查看状态，不重复提交相同帖子。
            </p>
          </li>
        </ol>
      </section>

      <section class="doc-section" id="faq">
        <h2>常见问题</h2>
        <a-collapse ghost>
          <a-collapse-panel key="1" header="为什么应用创建后要进入对话页？">
            <p>
              首页只负责创建应用和保存初始需求，真正的代码生成在对话页完成，方便你边生成边修改。
            </p>
          </a-collapse-panel>
          <a-collapse-panel key="2" header="为什么我的帖子没有出现在社区广场？">
            <p>新帖子默认需要管理员审核。通过后会展示在广场，未通过时可以在个人主页查看状态。</p>
          </a-collapse-panel>
          <a-collapse-panel key="3" header="评论被驳回后会怎样？">
            <p>
              被驳回的评论不会再出现在普通用户的评论列表中。如果驳回的是父评论，它下面的回复也会一起隐藏。
            </p>
          </a-collapse-panel>
          <a-collapse-panel key="4" header="点击优化提示后为什么没有开始生成？">
            <p>它只填入待发送输入框。检查或补充要求后点击发送，才会开始生成。</p>
          </a-collapse-panel>
          <a-collapse-panel key="5" header="为什么生成过程中预览没有变化？">
            <p>
              平台保留上一版预览，当前生成成功后才刷新。失败或停止不会刷新旧预览；首次生成还没有成功版本时，需要先完成一次生成。
            </p>
          </a-collapse-panel>
          <a-collapse-panel key="6" header="点击停止后为什么还不能继续发送？">
            <p>停止需要等待后台确认任务结束。“正在停止”期间请继续等待，以最终状态为准。</p>
          </a-collapse-panel>
          <a-collapse-panel key="7" header="管理员为什么不能部署某些应用？">
            <p>
              部署仅限应用创建者。管理员可管理应用和导出记录，但不能仅凭管理员身份部署或下载他人应用代码。
            </p>
          </a-collapse-panel>
          <a-collapse-panel key="8" header="为什么客服找不到刚上传的文档？">
            <p>
              上传后还需后台处理并建立索引。管理员应查看文档是否已经生效、索引版本和处理记录，失败时排除原因后重试。
            </p>
          </a-collapse-panel>
          <a-collapse-panel key="9" header="下载代码和导出 Markdown 有什么区别？">
            <p>
              下载代码保存应用代码压缩包，仅限应用创建者；导出 Markdown
              保存应用聊天记录，允许创建者或管理员操作。公开查看权限并不足够。
            </p>
          </a-collapse-panel>
          <a-collapse-panel key="10" header="邮箱验证码没收到或注册失败怎么办？">
            <p>
              先核对邮箱地址并检查垃圾邮件，等待发送倒计时结束后再尝试。确认昵称已填、密码至少 6
              位且两次一致，再根据页面错误提示处理；持续失败时向管理人员提供报错文字，不提供密码或验证码。
            </p>
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

const openCommunity = () => {
  window.open('/community', '_blank', 'noopener')
}

const navItems = [
  { id: 'intro', title: '文档首页' },
  { id: 'what-is-it', title: '平台介绍' },
  { id: 'quick-start', title: '快速开始' },
  { id: 'account', title: '账号与个人资料' },
  { id: 'prompt', title: '提示词写法' },
  { id: 'generate', title: '对话生成' },
  { id: 'delivery', title: '预览与交付' },
  { id: 'manage', title: '应用管理' },
  { id: 'community', title: '交流社区' },
  { id: 'admin', title: '后台管理' },
  { id: 'customer-service', title: '智能客服' },
  { id: 'recommended-practices', title: '推荐使用规范' },
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
