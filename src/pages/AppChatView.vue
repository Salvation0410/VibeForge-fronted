<template>
  <section class="chat-page">
    <header class="workspace-topbar">
      <div class="workspace-title">
        <img class="workspace-logo" src="@/assets/logo.png" alt="应用" />
        <div>
          <p class="eyebrow">应用生成工作台</p>
          <div class="title-heading">
            <h1>{{ appDetail?.appName || '应用生成中' }}</h1>
            <a-tag color="cyan">{{ codeGenTypeLabel }}</a-tag>
          </div>
        </div>
      </div>

      <div class="topbar-actions">
        <a-button @click="router.push('/home')">返回首页</a-button>
        <a-button @click="detailVisible = true">应用详情</a-button>
        <a-button :disabled="!canOperate" @click="router.push(`/apps/${activeAppId}/edit`)">
          编辑信息
        </a-button>
        <a-button
          :disabled="!canOperate || streaming"
          :loading="exporting"
          @click="handleExportMarkdown"
        >
          导出 Markdown
        </a-button>
        <a-button :disabled="!canOperate" :loading="downloadingCode" @click="handleDownloadCode">
          下载代码
        </a-button>
        <a-button type="primary" :disabled="!canOperate" :loading="deploying" @click="handleDeploy">
          部署应用
        </a-button>
      </div>
    </header>

    <div
      ref="workspaceGridRef"
      class="workspace-grid"
      :class="{ 'is-resizing': isResizingPanels }"
      :style="workspaceGridStyle"
    >
      <a-card class="chat-panel" :bordered="false">
        <div ref="messageListRef" class="message-list">
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
          <a-alert
            v-if="selectedElementInfo"
            class="selected-element-alert"
            type="info"
            show-icon
            closable
            :message="`已选中元素：${selectedElementSummary}`"
            @close="clearSelectedElement"
          />
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
              <a-button :disabled="streaming || !canOperate" @click="useOptimizePrompt"
                >优化提示</a-button
              >
              <a-button
                :type="visualEditMode ? 'primary' : 'default'"
                :ghost="visualEditMode"
                :disabled="!canVisualEdit"
                @click="toggleVisualEditMode"
              >
                {{ visualEditMode ? '退出可视化编辑' : '可视化编辑' }}
              </a-button>
              <a-button
                type="primary"
                :disabled="!canOperate"
                :loading="streaming"
                @click="sendMessage()"
              >
                发送消息
              </a-button>
            </a-space>
          </div>
        </div>
      </a-card>

      <div
        v-if="showResizableSplit"
        class="resize-handle"
        role="separator"
        aria-label="调整聊天区和预览区宽度"
        aria-orientation="vertical"
        tabindex="0"
        @pointerdown="startResizePanels"
        @keydown="handleResizeHandleKeydown"
      >
        <span class="resize-handle__line" />
      </div>

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
            <a-button
              v-if="previewUrl"
              type="link"
              :href="previewUrl"
              target="_blank"
              rel="noreferrer"
            >
              新窗口打开
            </a-button>
          </a-space>
        </div>

        <div class="preview-body" :class="{ 'is-streaming': showPreviewGeneratingOverlay }">
          <div v-if="showPreviewGeneratingState" class="preview-state">
            <div class="preview-spinner" />
            <div class="preview-state-copy">
              <h3>{{ previewStateTitle }}</h3>
              <p>{{ previewStateDescription }}</p>
            </div>
          </div>

          <template v-else-if="showPreview">
            <iframe
              ref="previewFrameRef"
              :key="previewRenderKey"
              class="preview-frame"
              :srcdoc="previewSrcDoc"
              title="应用预览"
              @load="handlePreviewLoad"
            />
            <div v-if="showPreviewOverlay" class="preview-overlay">
              <div class="preview-overlay-chip">
                <div class="preview-spinner preview-spinner--small" />
                <div>
                  <strong>{{ previewStateTitle }}</strong>
                  <p>{{ previewStateDescription }}</p>
                </div>
              </div>
            </div>
          </template>

          <a-empty v-else description="发送需求后，右侧将在当前轮生成完成后自动展示网站预览。" />
        </div>
      </a-card>
    </div>

    <a-modal
      v-model:open="detailVisible"
      title="应用详情"
      :footer="null"
      width="720px"
      destroy-on-close
    >
      <a-descriptions bordered :column="1" size="middle">
        <a-descriptions-item label="应用名称">
          {{ appDetail?.appName || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="生成类型">
          {{ codeGenTypeLabel }}
        </a-descriptions-item>
        <a-descriptions-item label="应用 ID">
          {{ appDetail?.id || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ formatDateTime(appDetail?.createTime) }}
        </a-descriptions-item>
        <a-descriptions-item label="更新时间">
          {{ formatDateTime(appDetail?.updateTime) }}
        </a-descriptions-item>
        <a-descriptions-item label="初始提示词">
          <div class="detail-prompt">{{ appDetail?.initPrompt || '-' }}</div>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  type AppId,
  chatToGenCodeStream,
  deployApp,
  downloadAppCode,
  getAppDetail,
  type AppVO,
} from '@/api/app'
import {
  exportAppChatHistoryMarkdown,
  listAppChatHistory,
  type ChatHistory,
} from '@/api/chatHistory'
import { useLoginUserStore } from '@/stores/loginUser'
import { canManageApp, canViewApp } from '@/utils/appAccess'
import { buildLocalPreviewUrl, formatDateTime, isSuccessCode } from '@/utils/appUtils'
import { mapChatHistoryToMessage, sortChatHistoryAsc, type ChatMessage } from '@/utils/chatHistory'
import {
  downloadBlobFile,
  getFileNameFromContentDisposition,
  sanitizeDownloadFileName,
} from '@/utils/download'
import {
  buildVisualEditPrompt,
  createVisualEditor,
  formatSelectedElementInfo,
  type VisualEditorSelectedElement,
} from '@/utils/visualEditor'

const HISTORY_PAGE_SIZE = 10
const DESKTOP_SPLIT_BREAKPOINT = 1200
const RESIZE_HANDLE_WIDTH = 16
const MIN_PANEL_RATIO = 32
const MAX_PANEL_RATIO = 68

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
const workspaceGridRef = ref<HTMLElement | null>(null)
const messageListRef = ref<HTMLElement | null>(null)
const previewFrameRef = ref<HTMLIFrameElement | null>(null)
const streaming = ref(false)
const deploying = ref(false)
const exporting = ref(false)
const downloadingCode = ref(false)
const detailVisible = ref(false)
const visualEditMode = ref(false)
const selectedElementInfo = ref<VisualEditorSelectedElement | null>(null)
const previewUrl = ref('')
const previewSrcDoc = ref('')
const previewRefreshToken = ref(Date.now())
const previewRenderKey = ref(0)
const showPreview = ref(false)
const previewLoading = ref(false)
const deployedUrl = ref('')
const historyCursor = ref<string>()
const hasMoreHistory = ref(false)
const historyLoadingInitial = ref(false)
const historyLoadingMore = ref(false)
const historyInitialized = ref(false)
const loadedHistoryCount = ref(0)
const autoSendingInitPrompt = ref(false)
const windowWidth = ref(window.innerWidth)
const panelLeftRatio = ref(45)
const isResizingPanels = ref(false)
let currentEventSource: EventSource | null = null
let latestPreviewRequest = 0
const pendingPreviewReloadTimers: number[] = []
const visualEditor = createVisualEditor({
  onSelect: (payload) => {
    selectedElementInfo.value = payload
  },
})

const activeAppId = computed(() => String(appDetail.value?.id || routeAppId))
const codeGenTypeLabel = computed(() => (appDetail.value?.codeGenType || 'web').toUpperCase())
const canOperate = computed(() => canManageApp(loginUserStore.loginUser, appDetail.value))
const canVisualEdit = computed(
  () => canOperate.value && showPreview.value && !streaming.value && !previewLoading.value,
)
const hasInitPrompt = computed(() => Boolean(appDetail.value?.initPrompt?.trim()))
const selectedElementSummary = computed(() =>
  selectedElementInfo.value ? formatSelectedElementInfo(selectedElementInfo.value) : '',
)
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
const hasGeneratedPreview = computed(() => showPreview.value && Boolean(previewUrl.value))
const showPreviewGeneratingState = computed(() => streaming.value && !hasGeneratedPreview.value)
const showPreviewGeneratingOverlay = computed(() => streaming.value && hasGeneratedPreview.value)
const showPreviewOverlay = computed(
  () => showPreviewGeneratingOverlay.value || previewLoading.value,
)
const showResizableSplit = computed(() => windowWidth.value > DESKTOP_SPLIT_BREAKPOINT)
const workspaceGridStyle = computed(() => {
  if (!showResizableSplit.value) {
    return undefined
  }

  return {
    '--chat-panel-size': `${panelLeftRatio.value}fr`,
    '--preview-panel-size': `${100 - panelLeftRatio.value}fr`,
  }
})
const previewStateTitle = computed(() =>
  previewLoading.value
    ? '预览资源加载中'
    : autoSendingInitPrompt.value || !hasGeneratedPreview.value
      ? 'AI 正在生成首版页面'
      : 'AI 正在更新当前预览',
)
const previewStateDescription = computed(() =>
  previewLoading.value
    ? '后端正在准备最新的构建产物，加载完成后右侧会自动展示页面预览。'
    : autoSendingInitPrompt.value || !hasGeneratedPreview.value
      ? '正在根据当前需求整理代码与页面结构，等待本轮输出完成后会自动显示右侧预览。'
      : '已保留上一版预览，新的修改正在生成中，当前轮输出完成后会自动刷新为最新结果。',
)

const statusText = computed(() => {
  if (!canOperate.value) {
    return '当前为只读查看模式，可浏览应用历史和预览效果。'
  }
  if (streaming.value) {
    return autoSendingInitPrompt.value
      ? 'AI 正在根据你的需求启动首轮生成'
      : 'AI 正在实时输出生成结果'
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

const scrollMessagesToBottom = async (behavior: ScrollBehavior = 'smooth') => {
  await nextTick()
  const container = messageListRef.value
  if (!container) {
    return
  }

  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  })
}

const clampPanelRatio = (value: number) =>
  Math.min(MAX_PANEL_RATIO, Math.max(MIN_PANEL_RATIO, value))

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const stopResizePanels = () => {
  isResizingPanels.value = false
  window.removeEventListener('pointermove', handleResizePanelsPointerMove)
  window.removeEventListener('pointerup', stopResizePanels)
  document.body.style.removeProperty('cursor')
  document.body.style.removeProperty('user-select')
}

const updatePanelRatioByClientX = (clientX: number) => {
  const gridElement = workspaceGridRef.value
  if (!gridElement || !showResizableSplit.value) {
    return
  }

  const rect = gridElement.getBoundingClientRect()
  const availableWidth = rect.width - RESIZE_HANDLE_WIDTH
  if (availableWidth <= 0) {
    return
  }

  const nextRatio = ((clientX - rect.left - RESIZE_HANDLE_WIDTH / 2) / availableWidth) * 100
  panelLeftRatio.value = clampPanelRatio(nextRatio)
}

function handleResizePanelsPointerMove(event: PointerEvent) {
  if (!isResizingPanels.value) {
    return
  }
  updatePanelRatioByClientX(event.clientX)
}

const startResizePanels = (event: PointerEvent) => {
  if (!showResizableSplit.value) {
    return
  }

  isResizingPanels.value = true
  updatePanelRatioByClientX(event.clientX)
  window.addEventListener('pointermove', handleResizePanelsPointerMove)
  window.addEventListener('pointerup', stopResizePanels)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleResizeHandleKeydown = (event: KeyboardEvent) => {
  if (!showResizableSplit.value) {
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    panelLeftRatio.value = clampPanelRatio(panelLeftRatio.value - 3)
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    panelLeftRatio.value = clampPanelRatio(panelLeftRatio.value + 3)
  }
}

const clearSelectedElement = () => {
  selectedElementInfo.value = null
}

const exitVisualEditMode = () => {
  visualEditMode.value = false
  visualEditor.disable()
  clearSelectedElement()
}

const toggleVisualEditMode = () => {
  if (visualEditMode.value) {
    exitVisualEditMode()
    return
  }

  if (!canVisualEdit.value) {
    message.warning('当前预览尚未准备完成，暂时无法进入可视化编辑')
    return
  }

  visualEditMode.value = true
  clearSelectedElement()
  visualEditor.enable(previewFrameRef.value)
  message.success('已进入可视化编辑模式，请到右侧预览区域选择元素')
}

const appendPreviewCacheParam = (rawUrl: string, baseUrl: string, token: number) => {
  const value = rawUrl.trim()
  if (!value || value.startsWith('#') || /^(data|blob|mailto|tel|javascript):/i.test(value)) {
    return rawUrl
  }

  try {
    const url = new URL(value, baseUrl)
    url.searchParams.set('_preview_t', String(token))
    return url.toString()
  } catch {
    return rawUrl
  }
}

const appendPreviewCacheParamToSrcset = (srcset: string, baseUrl: string, token: number) =>
  srcset
    .split(',')
    .map((item) => {
      const parts = item.trim().split(/\s+/)
      if (!parts[0]) {
        return item
      }
      parts[0] = appendPreviewCacheParam(parts[0], baseUrl, token)
      return parts.join(' ')
    })
    .join(', ')

const buildPreviewSrcDoc = (html: string, baseUrl: string, token: number) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const head = doc.head || doc.documentElement
  const base = doc.createElement('base')
  base.href = baseUrl
  head.prepend(base)

  doc.querySelectorAll<HTMLLinkElement>('link[href]').forEach((element) => {
    element.href = appendPreviewCacheParam(element.getAttribute('href') || '', baseUrl, token)
  })

  doc.querySelectorAll<HTMLScriptElement>('script[src]').forEach((element) => {
    element.src = appendPreviewCacheParam(element.getAttribute('src') || '', baseUrl, token)
  })

  doc
    .querySelectorAll<HTMLImageElement | HTMLSourceElement>('img[src], source[src]')
    .forEach((element) => {
      element.setAttribute(
        'src',
        appendPreviewCacheParam(element.getAttribute('src') || '', baseUrl, token),
      )
    })

  doc
    .querySelectorAll<HTMLImageElement | HTMLSourceElement>('img[srcset], source[srcset]')
    .forEach((element) => {
      element.setAttribute(
        'srcset',
        appendPreviewCacheParamToSrcset(element.getAttribute('srcset') || '', baseUrl, token),
      )
    })

  doc.querySelectorAll<HTMLVideoElement>('video[poster]').forEach((element) => {
    element.poster = appendPreviewCacheParam(element.getAttribute('poster') || '', baseUrl, token)
  })

  return `<!doctype html>\n${doc.documentElement.outerHTML}`
}

const loadPreviewDocument = async () => {
  if (!previewUrl.value) {
    previewSrcDoc.value = ''
    previewLoading.value = false
    return
  }

  if (visualEditMode.value) {
    visualEditor.attachToIframe(null)
  }

  const requestId = ++latestPreviewRequest
  const token = Date.now()
  const sourceUrl = appendPreviewCacheParam(previewUrl.value, window.location.href, token)

  previewRefreshToken.value = token
  previewLoading.value = true

  try {
    const response = await fetch(sourceUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store',
      },
    })

    if (!response.ok) {
      throw new Error(`Preview request failed: ${response.status}`)
    }

    const html = await response.text()
    if (requestId !== latestPreviewRequest) {
      return
    }

    previewSrcDoc.value = buildPreviewSrcDoc(html, previewUrl.value, token)
    previewRenderKey.value += 1
  } catch {
    if (requestId !== latestPreviewRequest) {
      return
    }

    previewSrcDoc.value = `
      <!doctype html>
      <html>
        <head>
          <base href="${previewUrl.value}" />
          <meta http-equiv="refresh" content="0;url=${sourceUrl}" />
        </head>
        <body></body>
      </html>
    `
    previewRenderKey.value += 1
    previewLoading.value = false
  }
}

const schedulePreviewReloads = (delays = [600, 1600, 3200, 5200, 8200, 12000]) => {
  pendingPreviewReloadTimers.splice(0).forEach((timer) => window.clearTimeout(timer))
  delays.forEach((delay) => {
    const timer = window.setTimeout(() => {
      if (!streaming.value && showPreview.value) {
        void loadPreviewDocument()
      }
    }, delay)
    pendingPreviewReloadTimers.push(timer)
  })
}

const finalizePreview = () => {
  if (visualEditMode.value) {
    visualEditor.attachToIframe(null)
  }
  previewUrl.value = buildLocalPreviewUrl(appDetail.value?.id, appDetail.value?.codeGenType)
  showPreview.value = Boolean(previewUrl.value) && loadedHistoryCount.value >= 2
  if (showPreview.value) {
    void loadPreviewDocument()
  } else {
    previewSrcDoc.value = ''
    previewLoading.value = false
  }

  if (!showPreview.value && visualEditMode.value) {
    exitVisualEditMode()
  }
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
  const rawContent = (presetContent ?? inputMessage.value).trim()
  if (!rawContent) {
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

  const content = buildVisualEditPrompt(rawContent, selectedElementInfo.value)

  appendMessage('user', rawContent)
  if (!presetContent) {
    inputMessage.value = ''
  }
  exitVisualEditMode()
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
      schedulePreviewReloads()
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
  if (visualEditMode.value) {
    visualEditor.attachToIframe(null)
  }
  void loadPreviewDocument()
}

const handlePreviewLoad = () => {
  previewLoading.value = false
  if (visualEditMode.value) {
    visualEditor.attachToIframe(previewFrameRef.value)
  }
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

const handleDownloadCode = async () => {
  if (!activeAppId.value || !canOperate.value) {
    return
  }

  downloadingCode.value = true
  try {
    const response = await downloadAppCode(activeAppId.value)
    const fileName = getFileNameFromContentDisposition(
      response.headers['content-disposition'],
      sanitizeDownloadFileName(`${appDetail.value?.appName || '应用'}-源码.zip`, '应用-源码.zip'),
    )
    downloadBlobFile(response.data, fileName)
    message.success('代码压缩包已开始下载')
  } catch (error: unknown) {
    const axiosError = error as {
      response?: {
        data?: Blob
      }
      message?: string
    }

    let errorMessage = axiosError?.message || '下载代码失败，请稍后重试'

    if (axiosError?.response?.data instanceof Blob) {
      try {
        const text = await axiosError.response.data.text()
        const parsed = JSON.parse(text) as { message?: string }
        errorMessage = parsed.message || errorMessage
      } catch {
        errorMessage = '下载代码失败，请稍后重试'
      }
    }

    message.error(errorMessage)
  } finally {
    downloadingCode.value = false
  }
}

const handleExportMarkdown = async () => {
  if (!activeAppId.value || !canOperate.value || streaming.value) {
    return
  }

  exporting.value = true
  try {
    const { blob, fileName } = await exportAppChatHistoryMarkdown(activeAppId.value)
    const resolvedName = sanitizeDownloadFileName(
      fileName || `${appDetail.value?.appName || '应用'}-开发对话记录.md`,
      '应用-开发对话记录.md',
    )
    downloadBlobFile(blob, resolvedName)
    message.success('Markdown 已开始下载')
  } catch (error: unknown) {
    const axiosError = error as {
      response?: {
        data?: Blob
      }
      message?: string
    }

    let errorMessage = axiosError?.message || '导出失败，请稍后重试'

    if (axiosError?.response?.data instanceof Blob) {
      try {
        const text = await axiosError.response.data.text()
        const parsed = JSON.parse(text) as { message?: string }
        errorMessage = parsed.message || errorMessage
      } catch {
        errorMessage = '导出失败，请稍后重试'
      }
    }

    message.error(errorMessage)
  } finally {
    exporting.value = false
  }
}

const useOptimizePrompt = () => {
  inputMessage.value =
    '请在保留当前功能的基础上，优化排版层次、突出关键信息，并补全更完整的交互细节。'
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
  window.addEventListener('resize', updateWindowWidth)
  void initializePage()
})

watch(
  () => [
    messages.value.length,
    messages.value[messages.value.length - 1]?.content ?? '',
    streaming.value,
  ],
  async (_, previousValue) => {
    const nextBehavior = previousValue ? 'smooth' : 'auto'
    await scrollMessagesToBottom(nextBehavior)
  },
)

watch(canVisualEdit, (value) => {
  if (!value && visualEditMode.value) {
    exitVisualEditMode()
  }
})

watch(showResizableSplit, (value) => {
  if (!value) {
    stopResizePanels()
  }
})

onBeforeUnmount(() => {
  pendingPreviewReloadTimers.splice(0).forEach((timer) => window.clearTimeout(timer))
  window.removeEventListener('resize', updateWindowWidth)
  stopResizePanels()
  closeStream()
  visualEditor.destroy()
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

.title-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

.detail-prompt {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.75;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workspace-grid {
  display: grid;
  grid-template-columns:
    minmax(420px, var(--chat-panel-size, 0.9fr))
    16px
    minmax(520px, var(--preview-panel-size, 1.1fr));
  gap: 0;
  min-height: calc(100vh - 210px);
}

.chat-panel,
.preview-panel {
  border-radius: 28px;
  box-shadow: 0 20px 56px rgba(24, 45, 79, 0.08);
}

.chat-panel {
  margin-right: 11px;
}

.chat-panel {
  display: flex;
  flex-direction: column;
}

.preview-panel {
  margin-left: 11px;
  min-height: calc(100vh - 210px);
}

.resize-handle {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: center;
  cursor: col-resize;
  touch-action: none;
}

.resize-handle::before {
  content: '';
  position: absolute;
  inset: 0;
}

.resize-handle__line {
  width: 4px;
  margin: 18px 0;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(31, 167, 199, 0.24), rgba(47, 105, 255, 0.38));
  box-shadow: 0 10px 24px rgba(47, 105, 255, 0.12);
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.resize-handle:hover .resize-handle__line,
.resize-handle:focus-visible .resize-handle__line,
.workspace-grid.is-resizing .resize-handle__line {
  transform: scaleX(1.15);
  background: linear-gradient(180deg, rgba(31, 167, 199, 0.48), rgba(47, 105, 255, 0.72));
  box-shadow: 0 16px 30px rgba(47, 105, 255, 0.2);
}

.resize-handle:focus-visible {
  outline: none;
}

.preview-panel {
  min-height: calc(100vh - 210px);
}

.chat-panel :deep(.ant-card-body),
.preview-panel :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.selected-element-alert {
  margin-bottom: 14px;
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
  position: relative;
  flex: 1;
  display: flex;
  min-height: calc(100vh - 340px);
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(88, 179, 255, 0.14), transparent 45%),
    linear-gradient(180deg, #f6f9fd, #ffffff);
  border: 1px solid rgba(26, 43, 69, 0.08);
}

.preview-body.is-streaming::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(244, 249, 255, 0.18), rgba(255, 255, 255, 0.08));
  pointer-events: none;
}

.preview-state {
  display: grid;
  flex: 1;
  place-items: center;
  gap: 22px;
  min-height: calc(100vh - 340px);
  padding: 32px;
  text-align: center;
}

.preview-state-copy {
  max-width: 420px;
}

.preview-state-copy h3 {
  margin: 0 0 12px;
  color: #142137;
  font-size: 28px;
}

.preview-state-copy p {
  margin: 0;
  color: #68809d;
  font-size: 15px;
  line-height: 1.8;
}

.preview-spinner {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: conic-gradient(
    from 180deg,
    rgba(31, 167, 199, 0.08),
    #22b8cf,
    #2f69ff,
    rgba(31, 167, 199, 0.08)
  );
  animation: spin 1.15s linear infinite;
  box-shadow: 0 18px 40px rgba(47, 105, 255, 0.16);
}

.preview-spinner::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
}

.preview-spinner::after {
  content: '';
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: linear-gradient(145deg, #21b7cc, #2f69ff);
  opacity: 0.14;
}

.preview-spinner--small {
  width: 30px;
  height: 30px;
  box-shadow: none;
}

.preview-spinner--small::before {
  inset: 4px;
}

.preview-spinner--small::after {
  inset: 10px;
}

.preview-frame {
  flex: 1;
  display: block;
  width: 100%;
  min-height: calc(100vh - 340px);
  height: 100%;
  border: 0;
  background: white;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, rgba(245, 249, 255, 0.68), rgba(245, 249, 255, 0.12));
  pointer-events: none;
}

.preview-overlay-chip {
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 460px;
  padding: 16px 20px;
  border: 1px solid rgba(46, 110, 255, 0.14);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(29, 61, 112, 0.12);
  backdrop-filter: blur(12px);
}

.preview-overlay-chip strong {
  display: block;
  margin-bottom: 4px;
  color: #142137;
  font-size: 15px;
}

.preview-overlay-chip p {
  margin: 0;
  color: #67809f;
  font-size: 13px;
  line-height: 1.6;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .workspace-grid {
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .chat-panel,
  .preview-panel {
    margin: 0;
  }

  .resize-handle {
    display: none;
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

  .preview-state-copy h3 {
    font-size: 22px;
  }

  .preview-overlay {
    padding: 16px;
  }

  .preview-overlay-chip {
    align-items: flex-start;
  }
}
</style>
