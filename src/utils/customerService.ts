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

export type CustomerServiceQuestionValidation =
  | { valid: true; question: string }
  | { valid: false; message: string }

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

export function validateCustomerServiceQuestion(
  question: string,
): CustomerServiceQuestionValidation {
  const normalizedQuestion = question.trim()
  if (!normalizedQuestion) {
    return { valid: false, message: '请输入问题' }
  }

  const utf8ByteLength = new TextEncoder().encode(normalizedQuestion).byteLength
  if (utf8ByteLength > CUSTOMER_SERVICE_QUESTION_UTF8_BYTE_LIMIT) {
    return { valid: false, message: '问题内容过长，请精简后重试' }
  }

  if (normalizedQuestion.length > CUSTOMER_SERVICE_QUESTION_LIMIT) {
    return { valid: false, message: '问题不能超过 4000 个字符' }
  }

  return { valid: true, question: normalizedQuestion }
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
    const validation = validateCustomerServiceQuestion(question)
    if (!validation.valid || state.loading || disposed) {
      return false
    }

    const controller = new AbortController()
    const currentSequence = ++requestSequence
    activeController = controller
    updateState({ loading: true, uiState: null })

    try {
      const response = await request(validation.question, controller.signal)
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
