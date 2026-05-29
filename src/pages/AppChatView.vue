<template>
  <section class="chat-page">
    <header class="workspace-topbar">
      <div class="workspace-title">
        <img class="workspace-logo" src="@/assets/logo.png" alt="应用" />
        <div>
          <p class="eyebrow">应用生成工作台</p>
          <h1>{{ appDetail?.appName || '应用生成中' }}</h1>
        </div>
      </div>

      <div class="topbar-actions">
        <a-button @click="router.push('/home')">返回首页</a-button>
        <a-button :disabled="!canOperate" @click="router.push(`/apps/${activeAppId}/edit`)">
          编辑信息
        </a-button>
        <a-button type="primary" :disabled="!canOperate" :loading="deploying" @click="handleDeploy">
          部署应用
        </a-button>
      </div>
    </header>

    <div class="workspace-grid">
      <a-card class="chat-panel" :bordered="false">
        <div class="message-list">
          <div v-if="showHistoryToolbar" class="history-toolbar">
            <a-button
              v-if="hasMoreHistory"
              type="link"
              :loading="historyLoadingMore"
              @click="loadMoreHistory"
            >
              加载更多历史消息
            </a-button>
            <span v-else-if="loadedHistoryCount > 0" class="history-tip">已经展示全部历史消息</span>
          </div>

          <a-empty
            v-if="showEmptyState"
            description="还没有对话记录，发送第一条消息开始生成应用。"
          />

          <div
            v-for="messageItem in messages"
            :key="messageItem.id"
            class="message-row"
            :class="`is-${messageItem.role}`"
          >
            <a-avatar v-if="messageItem.role === 'assistant'" class="message-avatar" :src="logoSrc">
              AI
            </a-avatar>

            <div class="message-bubble">
              <div class="message-meta">
                <span>{{ messageItem.role === 'assistant' ? 'AI 回复' : '你的消息' }}</span>
                <span>{{ formatDateTime(messageItem.createdAt) }}</span>
              </div>
              <pre class="message-content">{{ messageItem.content || ' ' }}</pre>
            </div>
          </div>

          <div v-if="streaming" class="streaming-tip">AI 正在持续生成代码和说明，请稍候...</div>
        </div>

        <div class="composer">
          <a-textarea
            v-model:value="inputMessage"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            :disabled="!canOperate"
            placeholder="描述越详细，页面越具体，可以一步步完善生成效果"
            @pressEnter="handlePressEnter"
          />
          <div class="composer-actions">
            <span class="status-text">{{ statusText }}</span>
            <a-space>
              <a-button :disabled="streaming || !canOperate" @click="useOptimizePrompt">优化提示</a-button>
              <a-button type="primary" :disabled="!canOperate" :loading="streaming" @click="sendMessage()">
                发送消息
              </a-button>
            </a-space>
          </div>
        </div>
      </a-card>

      <a-card class="preview-panel" :bordered="false">
        <div class="preview-header">
          <div>
            <h2>生成后的网站展示</h2>
            <p>
              当应用已经产出可预览内容时，右侧会自动加载本地预览。
              <span v-if="deployedUrl">
                已部署到
                <a :href="deployedUrl" target="_blank" rel="noreferrer">{{ deployedUrl }}</a>
              </span>
            </p>
          </div>
          <a-space>
            <a-button :disabled="!previewUrl" @click="refreshPreview">刷新预览</a-button>
            <a-button v-if="previewUrl" type="link" :href="previewUrl" target="_blank" rel="noreferrer">
              新窗口打开
            </a-button>
          </a-space>
        </div>

        <div class="preview-body">
          <a-empty
            v-if="!showPreview"
            description="当前对话还不足以展示网站，完成至少两条历史消息后会自动显示。"
          />
          <iframe
            v-else
            :key="previewRenderKey"
            class="preview-frame"
            :src="previewUrl"
            title="应用预览"
          />
        </div>
      </a-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  type AppId,
  chatToGenCodeStream,
  deployApp,
  getAppDetail,
  type AppVO,
} from '@/api/app'
import { listAppChatHistory, type ChatHistory } from '@/api/chatHistory'
import { useLoginUserStore } from '@/stores/loginUser'
import { canManageApp, canViewApp } from '@/utils/appAccess'
import { buildLocalPreviewUrl, formatDateTime, isSuccessCode } from '@/utils/appUtils'
import { mapChatHistoryToMessage, sortChatHistoryAsc, type ChatMessage } from '@/utils/chatHistory'

const HISTORY_PAGE_SIZE = 10

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()
const logoSrc = new URL('@/assets/logo.png', import.meta.url).href
const routeAppId = String(route.params.id || '') as AppId
const enteredFromCreate = ref(route.query.mode === 'create')

const appDetail = ref<AppVO | null>(null)
const inputMessage = ref('')
const messages = ref<ChatMessage[]>([])
const historyRecords = ref<ChatHistory[]>([])
const streaming = ref(false)
const deploying = ref(false)
const previewUrl = ref('')
const previewRenderKey = ref(0)
const showPreview = ref(false)
const deployedUrl = ref('')
const historyCursor = ref<string>()
const hasMoreHistory = ref(false)
const historyLoadingInitial = ref(false)
const historyLoadingMore = ref(false)
const historyInitialized = ref(false)
const loadedHistoryCount = ref(0)
const autoSendingInitPrompt = ref(false)
let currentEventSource: EventSource | null = null

const activeAppId = computed(() => String(appDetail.value?.id || routeAppId))
const canOperate = computed(() => canManageApp(loginUserStore.loginUser, appDetail.value))
const hasInitPrompt = computed(() => Boolean(appDetail.value?.initPrompt?.trim()))
const shouldAutoSendInitPrompt = computed(
  () =>
    enteredFromCreate.value &&
    canOperate.value &&
    hasInitPrompt.value &&
    historyInitialized.value &&
    loadedHistoryCount.value === 0 &&
    !streaming.value,
)
const showHistoryToolbar = computed(() => historyInitialized.value && !enteredFromCreate.value)
const showEmptyState = computed(
  () =>
    historyInitialized.value &&
    !messages.value.length &&
    !historyLoadingInitial.value &&
    !shouldAutoSendInitPrompt.value,
)

const statusText = computed(() => {
  if (!canOperate.value) {
    return '当前为只读查看模式，可浏览应用历史和预览效果。'
  }
  if (streaming.value) {
    return autoSendingInitPrompt.value ? 'AI 正在根据你的需求启动首轮生成' : 'AI 正在实时输出生成结果'
  }
  if (showPreview.value) {
    return '网站预览已经准备好，可以继续微调需求。'
  }
  return '等待你发送新的需求。'
})

const appendMessage = (role: 'user' | 'assistant', content: string) => {
  messages.value.push({
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  })
}

const appendAssistantPlaceholder = () => {
  const nextMessage: ChatMessage = {
    id: `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'assistant',
    content: '',
    createdAt: new Date().toISOString(),
  }
  messages.value.push(nextMessage)
  return nextMessage.id
}

const updateMessageContent = (messageId: string, updater: (current: string) => string) => {
  const target = messages.value.find((item) => item.id === messageId)
  if (!target) {
    return
  }
  target.content = updater(target.content)
}

const finalizePreview = () => {
  previewUrl.value = buildLocalPreviewUrl(appDetail.value?.id, appDetail.value?.codeGenType)
  showPreview.value =
    Boolean(previewUrl.value) &&
    (loadedHistoryCount.value >= 2 || (!streaming.value && messages.value.length >= 2))
  previewRenderKey.value += 1
}

const resetHistoryState = () => {
  historyRecords.value = []
  messages.value = []
  loadedHistoryCount.value = 0
  historyCursor.value = undefined
  hasMoreHistory.value = false
  finalizePreview()
}

const rebuildMessagesFromHistory = (records: ChatHistory[]) => {
  historyRecords.value = sortChatHistoryAsc(records)
  messages.value = historyRecords.value.map(mapChatHistoryToMessage)
  loadedHistoryCount.value = historyRecords.value.length
  finalizePreview()
}

const mergeHistoryRecords = (currentRecords: ChatHistory[], nextRecords: ChatHistory[]) => {
  const merged = new Map<string, ChatHistory>()
  ;[...currentRecords, ...nextRecords].forEach((item) => {
    merged.set(String(item.id || `${item.messageType || 'message'}-${item.createTime || ''}`), item)
  })
  return sortChatHistoryAsc(Array.from(merged.values()))
}

const closeStream = () => {
  currentEventSource?.close()
  currentEventSource = null
}

const loadAppDetail = async () => {
  if (!routeAppId) {
    message.error('应用 id 无效')
    await router.replace('/home')
    return false
  }

  try {
    const res = await getAppDetail(routeAppId)
    if (!isSuccessCode(res.code) || !res.data) {
      throw new Error(res.message || '获取应用详情失败')
    }
    if (!canViewApp(loginUserStore.loginUser, res.data)) {
      message.warning('当前无权查看该应用')
      await router.replace('/home')
      return false
    }

    appDetail.value = res.data
    previewUrl.value = buildLocalPreviewUrl(appDetail.value.id, appDetail.value.codeGenType)
    return true
  } catch (error) {
    message.error(error instanceof Error ? error.message : '获取应用详情失败')
    await router.replace('/home')
    return false
  }
}

const loadHistoryPage = async (loadMore = false) => {
  if (!appDetail.value?.id) {
    return
  }

  if (loadMore) {
    historyLoadingMore.value = true
  } else {
    historyLoadingInitial.value = true
  }

  try {
    const res = await listAppChatHistory(String(appDetail.value.id), {
      pageSize: HISTORY_PAGE_SIZE,
      lastCreateTime: loadMore ? historyCursor.value : undefined,
    })

    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '加载对话历史失败')
    }

    const pageRecords = Array.isArray(res.data?.records) ? res.data.records : []
    const orderedPage = sortChatHistoryAsc(pageRecords)

    if (loadMore) {
      rebuildMessagesFromHistory(mergeHistoryRecords(historyRecords.value, orderedPage))
    } else {
      rebuildMessagesFromHistory(orderedPage)
    }

    historyCursor.value = orderedPage[0]?.createTime
    hasMoreHistory.value = pageRecords.length >= HISTORY_PAGE_SIZE && Boolean(historyCursor.value)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '加载对话历史失败'

    if (!loadMore && enteredFromCreate.value && loadedHistoryCount.value === 0) {
      resetHistoryState()
      return
    }

    message.error(errorMessage)
  } finally {
    if (!loadMore) {
      historyInitialized.value = true
    }
    historyLoadingInitial.value = false
    historyLoadingMore.value = false
  }
}

const loadMoreHistory = async () => {
  if (!hasMoreHistory.value || historyLoadingMore.value) {
    return
  }
  await loadHistoryPage(true)
}

interface SendMessageOptions {
  isAutoInit?: boolean
  silentSuccess?: boolean
}

const sendMessage = async (presetContent?: string, options: SendMessageOptions = {}) => {
  const content = (presetContent ?? inputMessage.value).trim()
  if (!content) {
    message.warning('请输入消息内容')
    return
  }
  if (!canOperate.value) {
    message.warning('当前应用仅支持查看，无法继续生成')
    return
  }
  if (streaming.value) {
    return
  }

  appendMessage('user', content)
  if (!presetContent) {
    inputMessage.value = ''
  }
  streaming.value = true
  autoSendingInitPrompt.value = Boolean(options.isAutoInit)
  finalizePreview()

  const assistantMessageId = appendAssistantPlaceholder()

  closeStream()

  currentEventSource = chatToGenCodeStream({
    appId: activeAppId.value,
    message: content,
    onMessage: (chunk) => {
      updateMessageContent(assistantMessageId, (current) => current + chunk)
    },
    onDone: async () => {
      streaming.value = false
      autoSendingInitPrompt.value = false
      await loadAppDetail()
      await loadHistoryPage(false)
      finalizePreview()
      if (!options.silentSuccess) {
        message.success('本轮生成完成，右侧预览已更新')
      }
    },
    onError: () => {
      streaming.value = false
      autoSendingInitPrompt.value = false
      const targetMessage = messages.value.find((item) => item.id === assistantMessageId)
      if (!targetMessage?.content.trim()) {
        updateMessageContent(
          assistantMessageId,
          () => '生成过程被中断，请稍后重试，或补充更明确的描述。',
        )
      }

      if (options.isAutoInit) {
        message.warning('首轮自动生成未完成，你可以继续在当前页面发送更具体的需求。')
      } else {
        message.error('生成过程异常中断')
      }
    },
  })
}

const handlePressEnter = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    event.preventDefault()
    void sendMessage()
  }
}

const refreshPreview = () => {
  if (!previewUrl.value) {
    return
  }
  previewRenderKey.value += 1
}

const handleDeploy = async () => {
  if (!activeAppId.value) {
    return
  }
  if (!canOperate.value) {
    message.warning('当前应用仅支持查看，无法部署')
    return
  }
  deploying.value = true
  try {
    const res = await deployApp(activeAppId.value)
    if (!isSuccessCode(res.code) || !res.data) {
      throw new Error(res.message || '部署失败')
    }
    deployedUrl.value = res.data
    message.success('部署成功，已生成可访问链接')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '部署失败')
  } finally {
    deploying.value = false
  }
}

const useOptimizePrompt = () => {
  inputMessage.value = '请在保留当前功能的基础上，优化排版层次、突出关键信息，并补全更完整的交互细节。'
}

const tryAutoSendInitPrompt = async () => {
  if (!shouldAutoSendInitPrompt.value) {
    return
  }

  await sendMessage(appDetail.value?.initPrompt?.trim(), {
    isAutoInit: true,
    silentSuccess: true,
  })
}

const initializePage = async () => {
  const loaded = await loadAppDetail()
  if (!loaded) {
    return
  }

  await loadHistoryPage(false)
  await tryAutoSendInitPrompt()
  finalizePreview()

  if (route.query.mode === 'create') {
    await router.replace(`/apps/${routeAppId}/chat`)
  }
}

onMounted(() => {
  void initializePage()
})

onBeforeUnmount(() => {
  closeStream()
})
</script>

<style scoped>
.chat-page {
  display: grid;
  gap: 22px;
}

.workspace-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 26px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 48px rgba(24, 45, 79, 0.08);
}

.workspace-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.workspace-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.eyebrow {
  margin: 0 0 8px;
  color: #1a9dc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.workspace-title h1 {
  margin: 0;
  color: #132033;
  font-size: 32px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(420px, 0.9fr) minmax(520px, 1.1fr);
  gap: 22px;
  min-height: calc(100vh - 210px);
}

.chat-panel,
.preview-panel {
  border-radius: 28px;
  box-shadow: 0 20px 56px rgba(24, 45, 79, 0.08);
}

.chat-panel {
  display: flex;
  flex-direction: column;
}

.message-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 18px;
  min-height: 420px;
  max-height: calc(100vh - 390px);
  padding-right: 8px;
  overflow: auto;
}

.history-toolbar {
  display: flex;
  justify-content: center;
  min-height: 32px;
}

.history-tip {
  color: #7a8aa2;
  font-size: 13px;
}

.message-row {
  display: flex;
  gap: 12px;
}

.message-row.is-user {
  justify-content: flex-end;
}

.message-row.is-user .message-bubble {
  background: linear-gradient(145deg, #1eb7cc, #1992d7);
  color: white;
}

.message-row.is-user .message-meta,
.message-row.is-user .message-content {
  color: inherit;
}

.message-avatar {
  flex: 0 0 auto;
  background: rgba(31, 167, 199, 0.14);
}

.message-bubble {
  width: min(100%, 520px);
  padding: 18px 18px 16px;
  border-radius: 22px;
  background: rgba(244, 248, 253, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.message-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #6c7b92;
  font-size: 12px;
}

.message-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  color: #1d2b43;
  line-height: 1.75;
}

.streaming-tip {
  color: #1484b1;
  font-size: 13px;
}

.composer {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(26, 43, 69, 0.08);
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
}

.status-text {
  color: #6d7c93;
  font-size: 13px;
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.preview-header h2 {
  margin: 0;
  color: #142137;
}

.preview-header p {
  margin: 10px 0 0;
  color: #6c7b92;
  line-height: 1.7;
}

.preview-body {
  min-height: calc(100vh - 340px);
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #f6f9fd, #ffffff);
  border: 1px solid rgba(26, 43, 69, 0.08);
}

.preview-frame {
  width: 100%;
  min-height: calc(100vh - 340px);
  border: 0;
  background: white;
}

@media (max-width: 1200px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .workspace-topbar,
  .composer-actions,
  .preview-header {
    flex-direction: column;
    align-items: stretch;
  }

  .workspace-title h1 {
    font-size: 26px;
  }

  .message-meta {
    flex-direction: column;
  }
}
</style>
