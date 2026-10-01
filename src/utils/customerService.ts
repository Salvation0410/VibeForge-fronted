import axios from 'axios'
import type {
  BaseResponse,
  CustomerServiceAnswer,
  CustomerServiceSource,
} from '../api/customerService.ts'

export const CUSTOMER_SERVICE_SOURCE_LIMIT = 3
export const CUSTOMER_SERVICE_EXCERPT_LIMIT = 180
export const CUSTOMER_SERVICE_QUESTION_LIMIT = 4000
export const CUSTOMER_SERVICE_QUESTION_UTF8_BYTE_LIMIT = 16000
export const CUSTOMER_SERVICE_KNOWLEDGE_FILE_SIZE_LIMIT = 20 * 1024 * 1024

const CUSTOMER_SERVICE_KNOWLEDGE_EXTENSIONS = new Set(['pdf', 'docx', 'md', 'markdown', 'txt'])

export interface CustomerServiceStatusMeta {
  label: string
  color: string
}

export interface CustomerServiceKnowledgeFileLike {
  name: string
  size: number
}

export type CustomerServiceKnowledgeFileValidation =
  | { valid: true }
  | { valid: false; message: string }

const DOCUMENT_STATUS_META: Record<string, CustomerServiceStatusMeta> = {
  UPLOADED: { label: '已上传', color: 'blue' },
  INDEXING: { label: '索引中', color: 'processing' },
  ACTIVE: { label: '已启用', color: 'success' },
  FAILED: { label: '处理失败', color: 'error' },
  DISABLED: { label: '已停用', color: 'default' },
  DELETING: { label: '删除中', color: 'warning' },
}

const TASK_STATUS_META: Record<string, CustomerServiceStatusMeta> = {
  PENDING: { label: '待处理', color: 'blue' },
  PROCESSING: { label: '处理中', color: 'processing' },
  SUCCEEDED: { label: '已完成', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
  SKIPPED: { label: '已跳过', color: 'default' },
}

const UNKNOWN_STATUS_META: CustomerServiceStatusMeta = { label: '未知状态', color: 'default' }
const STABLE_KNOWLEDGE_ERROR_CODE = /^KNOWLEDGE_[A-Z0-9_]{1,118}$/

export function validateCustomerServiceKnowledgeFile(
  file: CustomerServiceKnowledgeFileLike,
): CustomerServiceKnowledgeFileValidation {
  const extension = file.name.trim().split('.').pop()?.toLowerCase()
  if (!extension || !CUSTOMER_SERVICE_KNOWLEDGE_EXTENSIONS.has(extension)) {
    return { valid: false, message: '仅支持 PDF、DOCX、MD、MARKDOWN、TXT 文件' }
  }
  if (file.size <= 0) {
    return { valid: false, message: '文件不能为空' }
  }
  if (file.size > CUSTOMER_SERVICE_KNOWLEDGE_FILE_SIZE_LIMIT) {
    return { valid: false, message: '文件大小不能超过 20 MiB' }
  }
  return { valid: true }
}

export function getCustomerServiceDocumentStatus(
  status?: string | null,
): CustomerServiceStatusMeta {
  return DOCUMENT_STATUS_META[String(status ?? '').toUpperCase()] ?? UNKNOWN_STATUS_META
}

export function getCustomerServiceTaskStatus(status?: string | null): CustomerServiceStatusMeta {
  return TASK_STATUS_META[String(status ?? '').toUpperCase()] ?? UNKNOWN_STATUS_META
}

export function canRetryCustomerServiceKnowledgeDocument(status?: string | null): boolean {
  return String(status ?? '').toUpperCase() === 'FAILED'
}

export function normalizeCustomerServiceErrorCode(code?: string | null): string {
  if (!code?.trim()) {
    return '—'
  }
  const normalized = code.trim().toUpperCase()
  return STABLE_KNOWLEDGE_ERROR_CODE.test(normalized) ? normalized : 'UNKNOWN_ERROR'
}

export type CustomerServiceQuestionValidation =
  | { valid: true; question: string }
  | { valid: false; message: string }

export type CustomerServiceQuestionInspection =
  | {
      normalizedQuestion: string
      length: number
      byteLength: number
      valid: true
    }
  | {
      normalizedQuestion: string
      length: number
      byteLength: number
      valid: false
      message: string
    }

export type CustomerServiceUiState =
  | { status: 'answered'; answer: string; sources: CustomerServiceSource[] }
  | { status: 'no-answer' }
  | { status: 'service-unavailable' }
  | { status: 'cancelled' }

export type CustomerServiceOutcome =
  | { type: 'success'; answer: CustomerServiceAnswer }
  | { type: 'failure'; cancelled: boolean }

export interface CustomerServiceRequestState {
  loading: boolean
  uiState: CustomerServiceUiState | null
}

export interface CustomerServiceRequestControllerOptions {
  request: (question: string, signal: AbortSignal) => Promise<BaseResponse<CustomerServiceAnswer>>
  onStateChange: (state: CustomerServiceRequestState) => void
}

export function getCustomerServiceQuestionLength(question: string): number {
  return question.trim().length
}

export function inspectCustomerServiceQuestion(
  question: string,
): CustomerServiceQuestionInspection {
  const normalizedQuestion = question.trim()
  const length = normalizedQuestion.length
  const byteLength = new TextEncoder().encode(normalizedQuestion).byteLength
  const details = { normalizedQuestion, length, byteLength }

  if (!normalizedQuestion) {
    return { ...details, valid: false, message: '请输入问题' }
  }

  if (byteLength > CUSTOMER_SERVICE_QUESTION_UTF8_BYTE_LIMIT) {
    return { ...details, valid: false, message: '问题内容过长，请精简后重试' }
  }

  if (length > CUSTOMER_SERVICE_QUESTION_LIMIT) {
    return { ...details, valid: false, message: '问题不能超过 4000 个字符' }
  }

  return { ...details, valid: true }
}

export function validateCustomerServiceQuestion(
  question: string,
): CustomerServiceQuestionValidation {
  const inspection = inspectCustomerServiceQuestion(question)
  if (!inspection.valid) {
    return { valid: false, message: inspection.message }
  }

  return { valid: true, question: inspection.normalizedQuestion }
}

function truncateExcerpt(excerpt: string): string {
  const normalized = excerpt.trim().replace(/\s+/g, ' ')
  const codePoints = Array.from(normalized)
  if (codePoints.length <= CUSTOMER_SERVICE_EXCERPT_LIMIT) {
    return normalized
  }
  return `${codePoints
    .slice(0, CUSTOMER_SERVICE_EXCERPT_LIMIT - 1)
    .join('')
    .trimEnd()}…`
}

export function normalizeCustomerServiceSources(
  sources: CustomerServiceSource[] = [],
): CustomerServiceSource[] {
  const seenChunkIds = new Set<string>()
  const normalizedSources: CustomerServiceSource[] = []

  for (const source of sources) {
    const chunkId = String(source.chunkId ?? '').trim()
    if (!chunkId || seenChunkIds.has(chunkId)) {
      continue
    }

    seenChunkIds.add(chunkId)
    normalizedSources.push({
      ...source,
      chunkId,
      excerpt: truncateExcerpt(source.excerpt ?? ''),
    })

    if (normalizedSources.length >= CUSTOMER_SERVICE_SOURCE_LIMIT) {
      break
    }
  }

  return normalizedSources
}

export function normalizeCustomerServiceState(
  outcome: CustomerServiceOutcome,
): CustomerServiceUiState {
  if (outcome.type === 'failure') {
    return outcome.cancelled ? { status: 'cancelled' } : { status: 'service-unavailable' }
  }

  const answer = outcome.answer.answer?.trim() ?? ''
  if (!outcome.answer.answered || !answer) {
    return { status: 'no-answer' }
  }

  return {
    status: 'answered',
    answer,
    sources: normalizeCustomerServiceSources(outcome.answer.sources),
  }
}

export function isCustomerServiceRequestCancelled(error: unknown, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted || axios.isCancel(error))
}

export function createCustomerServiceRequestController({
  request,
  onStateChange,
}: CustomerServiceRequestControllerOptions) {
  let state: CustomerServiceRequestState = { loading: false, uiState: null }
  let activeController: AbortController | null = null
  let requestSequence = 0
  let disposed = false

  const updateState = (nextState: CustomerServiceRequestState) => {
    state = nextState
    onStateChange(state)
  }

  const submit = async (question: string): Promise<boolean> => {
    const inspection = inspectCustomerServiceQuestion(question)
    if (!inspection.valid || state.loading || disposed) {
      return false
    }

    const controller = new AbortController()
    const currentSequence = ++requestSequence
    activeController = controller
    updateState({ loading: true, uiState: null })

    try {
      const response = await request(inspection.normalizedQuestion, controller.signal)
      if (disposed || currentSequence !== requestSequence) {
        return false
      }

      const uiState =
        (response.code === 0 || response.code === 20000) && response.data
          ? normalizeCustomerServiceState({ type: 'success', answer: response.data })
          : normalizeCustomerServiceState({ type: 'failure', cancelled: false })
      updateState({ loading: true, uiState })
      return true
    } catch (error) {
      if (disposed || currentSequence !== requestSequence) {
        return false
      }

      updateState({
        loading: true,
        uiState: normalizeCustomerServiceState({
          type: 'failure',
          cancelled: isCustomerServiceRequestCancelled(error, controller.signal),
        }),
      })
      return true
    } finally {
      if (!disposed && currentSequence === requestSequence) {
        activeController = null
        updateState({ ...state, loading: false })
      }
    }
  }

  const cancel = (): boolean => {
    if (!activeController || disposed) {
      return false
    }

    requestSequence += 1
    activeController.abort()
    activeController = null
    updateState({
      loading: false,
      uiState: normalizeCustomerServiceState({ type: 'failure', cancelled: true }),
    })
    return true
  }

  const dispose = () => {
    if (disposed) {
      return
    }

    disposed = true
    requestSequence += 1
    activeController?.abort()
    activeController = null
  }

  return {
    submit,
    cancel,
    dispose,
    getState: () => state,
  }
}
