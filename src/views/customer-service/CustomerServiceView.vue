<template>
  <main ref="chatPage" class="customer-service-page" :style="{ height: chatHeight }">
    <aside class="service-guide" aria-label="客服咨询指南">
      <div class="guide-label">
        <span class="guide-symbol" aria-hidden="true">✳</span>智创 · 服务咨询台
      </div>
      <div class="guide-intro">
        <span class="guide-eyebrow">PRODUCT SUPPORT</span>
        <h2>每一个想法，<br />都值得走得更远。</h2>
        <p>使用平台时遇到疑问？<br />让我们一起找到下一步。</p>
      </div>
      <div class="guide-topics">
        <span class="section-label">我们可以聊聊</span>
        <div class="guide-topic">
          <AppstoreAddOutlined aria-hidden="true" />
          <div><strong>从想法到应用</strong><span>创建应用 · 继续编辑</span></div>
        </div>
        <div class="guide-topic">
          <CloudUploadOutlined aria-hidden="true" />
          <div><strong>让作品被看见</strong><span>预览部署 · 下载分享</span></div>
        </div>
        <div class="guide-topic">
          <SafetyOutlined aria-hidden="true" />
          <div><strong>更顺畅地使用</strong><span>账号资料 · 操作权限</span></div>
        </div>
      </div>
      <router-link to="/docs" class="guide-docs"
        ><ReadOutlined aria-hidden="true" /><span
          ><strong>想系统了解平台？</strong><span>阅读使用文档</span></span
        ><ArrowUpOutlined aria-hidden="true"
      /></router-link>
      <p class="guide-note">回答来自平台知识资料。<br />描述具体场景，有助于找到更合适的答案。</p>
      <span class="guide-footer">让创造，少一点障碍。</span>
    </aside>
    <div class="chat-workspace">
      <header class="chat-header">
        <div class="header-avatar">
          <img class="assistant-avatar" :src="logo" alt="" />
        </div>
        <div class="chat-title">
          <h1>智能客服</h1>
          <span class="chat-status" :class="{ 'is-busy': loading }"
            ><span aria-hidden="true" class="status-dot"></span
            >{{ loading ? '正在查找资料' : '平台使用咨询' }}</span
          >
        </div>
        <a-popconfirm
          title="清空当前聊天记录？"
          ok-text="清空"
          cancel-text="保留"
          @confirm="clearMessages"
        >
          <a-button
            class="clear-button"
            type="text"
            aria-label="清空聊天"
            :disabled="!messages.length"
          >
            <template #icon><DeleteOutlined /></template>
            <span class="clear-label">清空对话</span>
          </a-button>
        </a-popconfirm>
      </header>
      <section
        ref="conversation"
        class="conversation"
        role="log"
        aria-label="客服聊天记录"
        @scroll="trackScroll"
      >
        <CustomerServiceWelcome v-if="!messages.length" @select="selectStarter" />
        <div v-else class="conversation-divider"><span>本次对话</span></div>
        <article v-for="item in messages" :key="item.id" class="message-row" :class="item.role">
          <img v-if="item.role === 'assistant'" class="assistant-avatar" :src="logo" alt="客服" />
          <a-avatar v-else class="user-avatar"
            ><template #icon><UserOutlined /></template
          ></a-avatar>
          <div class="message-body">
            <div class="message-meta">
              <strong>{{ item.role === 'user' ? '我' : '智能客服' }}</strong
              ><time>{{ item.time }}</time>
              <span
                v-if="item.state?.status === 'answered' && item.state.sources.length"
                class="answer-badge"
                ><CheckCircleOutlined aria-hidden="true" />附参考资料</span
              >
            </div>
            <div
              class="bubble"
              :class="{
                'status-bubble': item.role === 'assistant' && item.state?.status !== 'answered',
                'error-bubble': item.state?.status === 'service-unavailable',
              }"
            >
              <div v-if="item.pending" class="pending" role="status">
                <span class="thinking-indicator" aria-hidden="true"><i></i><i></i><i></i></span
                ><span>正在查找资料并整理回答…</span>
              </div>
              <template v-else>
                <span v-if="item.state?.status === 'service-unavailable'" class="reply-state"
                  ><ExclamationCircleOutlined aria-hidden="true" />暂时无法连接服务</span
                >
                <span v-else-if="item.state?.status === 'no-answer'" class="reply-state"
                  ><SearchOutlined aria-hidden="true" />还没有找到合适的资料</span
                >
                <p>{{ item.content }}</p>
              </template>
              <CustomerServiceSources
                v-if="item.state?.status === 'answered' && item.state.sources.length"
                :sources="item.state.sources"
              />
            </div>
            <div v-if="item.role === 'assistant' && !item.pending" class="message-actions">
              <a-tooltip v-if="item.state?.status === 'answered'" title="复制回答">
                <a-button
                  type="text"
                  size="small"
                  aria-label="复制回答"
                  @click="copyAnswer(item.content)"
                  ><template #icon><CopyOutlined /></template>复制</a-button
                >
              </a-tooltip>
              <a-tooltip title="重新提问">
                <a-button
                  type="text"
                  size="small"
                  aria-label="重新提问"
                  :disabled="loading"
                  @click="retryQuestion(item)"
                  ><template #icon><ReloadOutlined /></template>重试</a-button
                >
              </a-tooltip>
            </div>
          </div>
        </article>
      </section>
      <div class="composer-area">
        <form class="composer" @submit.prevent="submitQuestion">
          <label class="composer-label" for="customer-service-question">说说你遇到的问题</label>
          <a-textarea
            id="customer-service-question"
            ref="questionInput"
            v-model:value="question"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            placeholder="例如：应用已经生成，接下来如何部署？"
            aria-label="你的问题"
            :aria-invalid="showQuestionError"
            aria-describedby="question-feedback"
            @keydown="handleKeydown"
          />
          <div class="composer-footer">
            <span class="keyboard-hint"
              >Enter 发送<span aria-hidden="true"> · </span>Shift + Enter 换行</span
            >
            <span
              id="question-feedback"
              class="question-feedback"
              :class="{ error: showQuestionError }"
              aria-live="polite"
            >
              {{
                showQuestionError
                  ? questionErrorMessage
                  : `${questionInspection.length} / ${CUSTOMER_SERVICE_QUESTION_LIMIT}`
              }}
            </span>
            <a-button
              v-if="loading"
              class="cancel-button"
              aria-label="取消回答"
              @click="requestController.cancel()"
              ><template #icon><StopOutlined /></template>取消回答</a-button
            >
            <a-button
              v-else
              type="primary"
              class="send-button"
              aria-label="发送"
              html-type="submit"
              :disabled="!canSubmit"
              >发送<template #icon><ArrowUpOutlined /></template
            ></a-button>
          </div>
        </form>
        <p class="composer-note">智能回答仅供参考，请结合实际操作与参考资料判断。</p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  AppstoreAddOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReadOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SearchOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import logo from '@/assets/logo.png'
import CustomerServiceWelcome from '@/components/customer-service/CustomerServiceWelcome.vue'
import CustomerServiceSources from '@/components/customer-service/CustomerServiceSources.vue'
import { askCustomerService } from '@/api/customerService'
import {
  CUSTOMER_SERVICE_QUESTION_LIMIT,
  createCustomerServiceRequestController,
  inspectCustomerServiceQuestion,
  type CustomerServiceUiState,
} from '@/utils/customerService'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  question: string
  time: string
  pending: boolean
  state: CustomerServiceUiState | null
}
const question = ref('')
const loading = ref(false)
const messages = ref<ChatMessage[]>([])
const conversation = ref<HTMLElement | null>(null)
const chatPage = ref<HTMLElement | null>(null)
const chatHeight = ref<string>()
const questionInput = ref<{ focus: () => void } | null>(null)
let headerObserver: ResizeObserver | null = null
let nextId = 0
let activeId: number | null = null
let followBottom = true
let disposed = false

function fitChatViewport() {
  const page = chatPage.value
  if (!page || disposed) return
  // 导航在窄屏会折行，依据实际顶部位置计算可用高度，兼顾移动端键盘变化。
  const top = page.getBoundingClientRect().top + window.scrollY
  const padding = page.parentElement
    ? Number.parseFloat(getComputedStyle(page.parentElement).paddingBottom) || 0
    : 18
  chatHeight.value = `${Math.max(240, (window.visualViewport?.height ?? window.innerHeight) - top - padding)}px`
}

onMounted(() => {
  fitChatViewport()
  const header = chatPage.value?.closest('.app-layout')?.querySelector('.app-header')
  if (header) {
    headerObserver = new ResizeObserver(fitChatViewport)
    headerObserver.observe(header)
  }
  window.addEventListener('resize', fitChatViewport)
  window.visualViewport?.addEventListener('resize', fitChatViewport)
})

function trackScroll() {
  const el = conversation.value
  if (el) followBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}
async function scrollToLatest(force = false) {
  if (!force && !followBottom) return
  await nextTick()
  const el = conversation.value
  if (el && !disposed) el.scrollTop = el.scrollHeight
}
function stateText(state: CustomerServiceUiState): string {
  switch (state.status) {
    case 'answered':
      return state.answer
    case 'no-answer':
      return '暂时没有找到可靠答案，可以换一种更具体的问法再试一次。'
    case 'service-unavailable':
      return '智能客服暂时不可用，请稍后重试。'
    case 'cancelled':
      return '本次提问已取消。'
  }
}
const requestController = createCustomerServiceRequestController({
  request: askCustomerService,
  onStateChange(state) {
    loading.value = state.loading
    const current = messages.value.find((item) => item.id === activeId)
    if (current) {
      current.pending = state.loading && !state.uiState
      current.state = state.uiState
      if (state.uiState) current.content = stateText(state.uiState)
    }
    void scrollToLatest()
  },
})
const questionInspection = computed(() => inspectCustomerServiceQuestion(question.value))
const questionErrorMessage = computed(() =>
  questionInspection.value.valid ? '' : questionInspection.value.message,
)
const showQuestionError = computed(
  () => Boolean(question.value) && Boolean(questionErrorMessage.value),
)
const canSubmit = computed(() => !loading.value && questionInspection.value.valid)

function newMessage(role: ChatMessage['role'], text: string): ChatMessage {
  return {
    id: ++nextId,
    role,
    content: role === 'user' ? text : '',
    question: text,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    pending: role === 'assistant',
    state: null,
  }
}
function submitQuestion() {
  if (!canSubmit.value) return
  const text = question.value.trim()
  const reply = newMessage('assistant', text)
  messages.value.push(newMessage('user', text), reply)
  activeId = reply.id
  question.value = ''
  followBottom = true
  void requestController.submit(text)
  void scrollToLatest(true)
}
async function selectStarter(text: string) {
  question.value = text
  await nextTick()
  questionInput.value?.focus()
}
function retryQuestion(item: ChatMessage) {
  if (loading.value || disposed) return
  activeId = item.id
  item.content = ''
  item.state = null
  item.pending = true
  void requestController.submit(item.question)
}
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault()
    submitQuestion()
  }
}
async function copyAnswer(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('回答已复制')
  } catch {
    message.error('复制失败，请选中回答后复制')
  }
}
function clearMessages() {
  requestController.cancel()
  activeId = null
  messages.value = []
  followBottom = true
}
onBeforeUnmount(() => {
  disposed = true
  headerObserver?.disconnect()
  window.removeEventListener('resize', fitChatViewport)
  window.visualViewport?.removeEventListener('resize', fitChatViewport)
  requestController.dispose()
})
</script>

<style scoped src="./customerServiceDesk.css"></style>
