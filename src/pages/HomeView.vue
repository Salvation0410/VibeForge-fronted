<template>
  <section class="home-page">
    <div class="hero">
      <div class="hero-copy">
        <img class="hero-logo" src="@/assets/logo.png" alt="一句话呈所想" />
        <h1>一句话呈所想</h1>
        <p>与 AI 对话，轻松创建应用和网站</p>
      </div>

      <a-card class="prompt-card" :bordered="false">
        <a-textarea
          v-model:value="promptText"
          :auto-size="{ minRows: 5, maxRows: 7 }"
          :maxlength="1000"
          class="prompt-input"
          placeholder="使用 NoCode 创建一个高效的小工具，帮我计算......"
        />

        <div class="prompt-toolbar">
          <div class="chips">
            <button
              v-for="example in promptExamples"
              :key="example"
              class="prompt-chip"
              type="button"
              @click="fillPrompt(example)"
            >
              {{ example }}
            </button>
          </div>

          <a-button type="primary" size="large" :loading="creating" @click="handleCreateApp">
            开始生成
          </a-button>
        </div>
      </a-card>
    </div>

    <section class="gallery-panel">
      <div class="section-head">
        <div>
          <h2>我的应用</h2>
          <p>查看自己创建的网站和工具，支持继续编辑、删除和进入对话页。</p>
        </div>

        <div class="head-actions">
          <a-input-search
            v-model:value="myQuery.appName"
            placeholder="按应用名称搜索"
            allow-clear
            enter-button="搜索"
            class="search-input"
            @search="handleMySearch"
          />
          <a-button @click="loadMyApps">刷新</a-button>
        </div>
      </div>

      <a-spin :spinning="myLoading">
        <a-empty v-if="!myApps.length" description="你还没有创建应用，试试上方提示词输入框" />
        <div v-else class="card-grid">
          <AppCard v-for="app in myApps" :key="app.id" :app="app" show-actions @click="goToChat(app)">
            <template #actions>
              <a-button type="link" @click="goToChat(app)">继续生成</a-button>
              <a-button type="link" @click="goToEdit(app)">编辑</a-button>
              <a-popconfirm
                title="确认删除这个应用吗？"
                ok-text="删除"
                cancel-text="取消"
                @confirm="handleDeleteMyApp(app)"
              >
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </AppCard>
        </div>
      </a-spin>

      <div class="pagination-row">
        <a-pagination
          v-model:current="myQuery.pageNum"
          v-model:page-size="myQuery.pageSize"
          :total="myTotal"
          :show-size-changer="true"
          :page-size-options="['6', '12', '20']"
          @change="loadMyApps"
        />
      </div>
    </section>

    <section class="gallery-panel">
      <div class="section-head">
        <div>
          <h2>精选应用</h2>
          <p>发现优先展示的精选案例，了解社区里生成效果更完整的作品。</p>
        </div>

        <div class="head-actions">
          <a-input-search
            v-model:value="goodQuery.appName"
            placeholder="按精选应用名称搜索"
            allow-clear
            enter-button="搜索"
            class="search-input"
            @search="handleGoodSearch"
          />
          <a-button @click="loadGoodApps">刷新</a-button>
        </div>
      </div>

      <a-spin :spinning="goodLoading">
        <a-empty v-if="!goodApps.length" description="暂无精选应用，管理员可在应用管理页设置精选" />
        <div v-else class="card-grid">
          <AppCard v-for="app in goodApps" :key="app.id" :app="app" @click="goToChat(app)" />
        </div>
      </a-spin>

      <div class="pagination-row">
        <a-pagination
          v-model:current="goodQuery.pageNum"
          v-model:page-size="goodQuery.pageSize"
          :total="goodTotal"
          :show-size-changer="true"
          :page-size-options="['6', '12', '20']"
          @change="loadGoodApps"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import AppCard from '@/components/AppCard.vue'
import {
  createApp,
  deleteMyApp,
  getGoodAppPage,
  getMyAppPage,
  type AppQueryRequest,
  type AppVO,
} from '@/api/app'
import { buildAppNameFromPrompt, DEFAULT_CODE_GEN_TYPE, isSuccessCode } from '@/utils/appUtils'

const router = useRouter()

const promptExamples = [
  '波普风电商页面',
  '企业网站',
  '电商运营后台',
  '暗黑话题社区',
]

const promptText = ref('')
const creating = ref(false)

const myLoading = ref(false)
const goodLoading = ref(false)
const myApps = ref<AppVO[]>([])
const goodApps = ref<AppVO[]>([])
const myTotal = ref(0)
const goodTotal = ref(0)

const myQuery = reactive<AppQueryRequest>({
  pageNum: 1,
  pageSize: 6,
  appName: '',
})

const goodQuery = reactive<AppQueryRequest>({
  pageNum: 1,
  pageSize: 6,
  appName: '',
})

const loadMyApps = async () => {
  myLoading.value = true
  try {
    const res = await getMyAppPage({ ...myQuery })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '加载我的应用失败')
    }
    myApps.value = res.data?.records || []
    myTotal.value = Number(res.data?.totalRow || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载我的应用失败')
  } finally {
    myLoading.value = false
  }
}

const loadGoodApps = async () => {
  goodLoading.value = true
  try {
    const res = await getGoodAppPage({ ...goodQuery })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '加载精选应用失败')
    }
    goodApps.value = res.data?.records || []
    goodTotal.value = Number(res.data?.totalRow || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载精选应用失败')
  } finally {
    goodLoading.value = false
  }
}

const fillPrompt = (value: string) => {
  promptText.value = value
}

const handleMySearch = async () => {
  myQuery.pageNum = 1
  await loadMyApps()
}

const handleGoodSearch = async () => {
  goodQuery.pageNum = 1
  await loadGoodApps()
}

const handleCreateApp = async () => {
  const prompt = promptText.value.trim()
  if (!prompt) {
    message.warning('请先输入应用提示词')
    return
  }

  creating.value = true
  try {
    const res = await createApp({
      appName: buildAppNameFromPrompt(prompt),
      initPrompt: prompt,
      codeGenType: DEFAULT_CODE_GEN_TYPE,
    })
    if (!isSuccessCode(res.code) || !res.data) {
      throw new Error(res.message || '创建应用失败')
    }
    message.success('应用创建成功，正在进入生成页面')
    promptText.value = ''
    await router.push(`/apps/${String(res.data)}/chat?autoStart=1`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '创建应用失败')
  } finally {
    creating.value = false
  }
}

const goToChat = (app: AppVO) => {
  router.push(`/apps/${app.id}/chat`)
}

const goToEdit = (app: AppVO) => {
  router.push(`/apps/${app.id}/edit`)
}

const handleDeleteMyApp = async (app: AppVO) => {
  if (!app.id) {
    return
  }
  try {
    const res = await deleteMyApp(String(app.id))
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '删除应用失败')
    }
    message.success('应用已删除')
    await loadMyApps()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除应用失败')
  }
}

void Promise.all([loadMyApps(), loadGoodApps()])
</script>

<style scoped>
.home-page {
  display: grid;
  gap: 30px;
}

.hero {
  padding: 34px 24px 0;
  border-radius: 36px;
  background:
    radial-gradient(circle at 90% 82%, rgba(62, 220, 229, 0.22), transparent 22%),
    radial-gradient(circle at 12% 15%, rgba(92, 143, 255, 0.14), transparent 18%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 251, 255, 0.92));
  box-shadow: 0 30px 80px rgba(26, 45, 79, 0.08);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-logo {
  width: 76px;
  height: 76px;
  margin-bottom: 14px;
  object-fit: contain;
}

.hero-copy h1 {
  margin: 0;
  color: #142137;
  font-size: clamp(40px, 5vw, 72px);
  font-weight: 900;
  letter-spacing: -0.06em;
}

.hero-copy p {
  margin: 18px 0 0;
  color: #6e7f96;
  font-size: 20px;
}

.prompt-card {
  max-width: 1180px;
  margin: 36px auto 0;
  border-radius: 32px;
  box-shadow: 0 22px 56px rgba(24, 45, 79, 0.08);
}

.prompt-input {
  font-size: 20px;
}

:deep(.prompt-input textarea) {
  border: 0;
  box-shadow: none;
  resize: none;
  padding: 6px 2px;
  color: #1b273b;
  font-size: 20px;
  line-height: 1.8;
}

:deep(.prompt-input textarea::placeholder) {
  color: #b4bccb;
}

.prompt-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-top: 26px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.prompt-chip {
  padding: 10px 18px;
  border: 1px solid rgba(26, 43, 69, 0.08);
  border-radius: 999px;
  background: rgba(247, 250, 253, 0.95);
  color: #56657d;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.prompt-chip:hover {
  transform: translateY(-2px);
  border-color: rgba(31, 167, 199, 0.22);
  box-shadow: 0 12px 24px rgba(24, 45, 79, 0.08);
}

.gallery-panel {
  padding: 36px;
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 64px rgba(24, 45, 79, 0.08);
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.section-head h2 {
  margin: 0;
  color: #132033;
  font-size: 42px;
  line-height: 1.1;
}

.section-head p {
  margin: 10px 0 0;
  color: #6b7a92;
  line-height: 1.7;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 320px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 28px;
}

@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hero {
    padding: 22px 18px 0;
  }

  .prompt-toolbar,
  .section-head {
    flex-direction: column;
    align-items: stretch;
  }

  .head-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .gallery-panel {
    padding: 24px 18px;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
