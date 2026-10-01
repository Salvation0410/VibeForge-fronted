import assert from 'node:assert/strict'
import test from 'node:test'
import type { CustomerServiceAnswer, CustomerServiceSource } from '../src/api/customerService.ts'
import {
  CUSTOMER_SERVICE_EXCERPT_LIMIT,
  CUSTOMER_SERVICE_QUESTION_LIMIT,
  CUSTOMER_SERVICE_QUESTION_UTF8_BYTE_LIMIT,
  createCustomerServiceRequestController,
  getCustomerServiceQuestionLength,
  isCustomerServiceRequestCancelled,
  normalizeCustomerServiceState,
  normalizeCustomerServiceSources,
  validateCustomerServiceQuestion,
} from '../src/utils/customerService.ts'

function source(chunkId: string, excerpt: string): CustomerServiceSource {
  return {
    documentId: `document-${chunkId}`,
    documentVersion: 1,
    documentName: `文档 ${chunkId}`,
    chunkId,
    locator: `第 ${chunkId} 节`,
    excerpt,
  }
}

test('来源按 chunkId 去重并且最多保留三条', () => {
  const sources = normalizeCustomerServiceSources([
    source('chunk-1', '第一条'),
    source('chunk-1', '重复内容不应覆盖第一条'),
    source('chunk-2', '第二条'),
    source('chunk-3', '第三条'),
    source('chunk-4', '第四条应被截断'),
  ])

  assert.deepEqual(
    sources.map((item) => item.chunkId),
    ['chunk-1', 'chunk-2', 'chunk-3'],
  )
  assert.equal(sources[0]?.excerpt, '第一条')
})

test('来源摘要会折叠空白并裁剪到有界长度', () => {
  const longExcerpt = `  ${'内容 '.repeat(CUSTOMER_SERVICE_EXCERPT_LIMIT)}  `
  const [result] = normalizeCustomerServiceSources([source('chunk-1', longExcerpt)])

  assert.ok(result)
  assert.equal(result.excerpt.includes('  '), false)
  assert.ok(Array.from(result.excerpt).length <= CUSTOMER_SERVICE_EXCERPT_LIMIT)
  assert.ok(result.excerpt.endsWith('…'))
})

test('来源摘要不会在 astral 字符中间截断', () => {
  const excerpt = `${'a'.repeat(178)}😀后续文本`
  const [result] = normalizeCustomerServiceSources([source('chunk-1', excerpt)])

  assert.ok(result)
  assert.equal(result.excerpt, `${'a'.repeat(178)}😀…`)
  assert.equal(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(result.excerpt),
    false,
  )
  assert.equal(Array.from(result.excerpt).length, CUSTOMER_SERVICE_EXCERPT_LIMIT)
})

test('成功回答归一化为 answered 状态并整理来源', () => {
  const answer: CustomerServiceAnswer = {
    answered: true,
    answer: '  可以在个人中心修改头像。  ',
    sources: [source('chunk-1', '帮助文档内容'), source('chunk-1', '重复来源')],
  }

  assert.deepEqual(normalizeCustomerServiceState({ type: 'success', answer }), {
    status: 'answered',
    answer: '可以在个人中心修改头像。',
    sources: [source('chunk-1', '帮助文档内容')],
  })
})

test('拒答或空回答归一化为 no-answer 状态', () => {
  const answer: CustomerServiceAnswer = {
    answered: false,
    answer: '不应展示的内部拒答说明',
    sources: [source('chunk-1', '不应展示的来源')],
  }

  assert.deepEqual(normalizeCustomerServiceState({ type: 'success', answer }), {
    status: 'no-answer',
  })
})

test('普通请求失败归一化为 service-unavailable 状态', () => {
  assert.deepEqual(normalizeCustomerServiceState({ type: 'failure', cancelled: false }), {
    status: 'service-unavailable',
  })
})

test('用户取消归一化为 cancelled 状态', () => {
  assert.deepEqual(normalizeCustomerServiceState({ type: 'failure', cancelled: true }), {
    status: 'cancelled',
  })
})

test('取消判定优先使用 AbortSignal 状态', () => {
  const controller = new AbortController()
  controller.abort()

  assert.equal(isCustomerServiceRequestCancelled(new Error('任意错误'), controller.signal), true)
  assert.equal(isCustomerServiceRequestCancelled(new Error('cancelled')), false)
})

test('问题校验允许 4000 字符并拒绝 4001 字符和空白', () => {
  assert.equal(CUSTOMER_SERVICE_QUESTION_LIMIT, 4000)
  assert.deepEqual(validateCustomerServiceQuestion('问'.repeat(4000)), {
    valid: true,
    question: '问'.repeat(4000),
  })
  assert.deepEqual(validateCustomerServiceQuestion('问'.repeat(4001)), {
    valid: false,
    message: '问题不能超过 4000 个字符',
  })
  assert.deepEqual(validateCustomerServiceQuestion(' \n\t '), {
    valid: false,
    message: '请输入问题',
  })
})

test('问题校验遵守 16000 UTF-8 字节保护并覆盖 emoji 边界', () => {
  assert.equal(CUSTOMER_SERVICE_QUESTION_UTF8_BYTE_LIMIT, 16000)
  assert.equal(validateCustomerServiceQuestion('😀'.repeat(2000)).valid, true)
  assert.deepEqual(validateCustomerServiceQuestion('😀'.repeat(4001)), {
    valid: false,
    message: '问题内容过长，请精简后重试',
  })
})

test('问题计数和校验使用 UTF-16 code unit 对齐后端边界', () => {
  const maximumEmojiQuestion = '😀'.repeat(2000)
  const oversizedEmojiQuestion = '😀'.repeat(2001)

  assert.equal(getCustomerServiceQuestionLength(maximumEmojiQuestion), 4000)
  assert.deepEqual(validateCustomerServiceQuestion(maximumEmojiQuestion), {
    valid: true,
    question: maximumEmojiQuestion,
  })
  assert.equal(getCustomerServiceQuestionLength(oversizedEmojiQuestion), 4002)
  assert.deepEqual(validateCustomerServiceQuestion(oversizedEmojiQuestion), {
    valid: false,
    message: '问题不能超过 4000 个字符',
  })
})

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function answeredResponse(answer: string) {
  return {
    code: 0,
    data: {
      answered: true,
      answer,
      sources: [],
    },
  }
}

test('取消后旧响应不能覆盖 cancelled 状态', async () => {
  const pending = deferred<ReturnType<typeof answeredResponse>>()
  const states: string[] = []
  const controller = createCustomerServiceRequestController({
    request: () => pending.promise,
    onStateChange: (state) =>
      states.push(state.uiState?.status ?? (state.loading ? 'loading' : 'idle')),
  })

  const requestPromise = controller.submit('第一个问题')
  assert.equal(controller.cancel(), true)
  pending.resolve(answeredResponse('迟到回答'))
  await requestPromise

  assert.equal(controller.getState().uiState?.status, 'cancelled')
  assert.equal(states.at(-1), 'cancelled')
})

test('取消后可以立即提交新请求且旧响应不能覆盖新回答', async () => {
  const first = deferred<ReturnType<typeof answeredResponse>>()
  const second = deferred<ReturnType<typeof answeredResponse>>()
  const signals: AbortSignal[] = []
  let requestCount = 0
  const controller = createCustomerServiceRequestController({
    request: (_question, signal) => {
      signals.push(signal)
      requestCount += 1
      return requestCount === 1 ? first.promise : second.promise
    },
    onStateChange: () => undefined,
  })

  const firstPromise = controller.submit('第一个问题')
  controller.cancel()
  const secondPromise = controller.submit('第二个问题')
  first.resolve(answeredResponse('旧回答'))
  second.resolve(answeredResponse('新回答'))
  await Promise.all([firstPromise, secondPromise])

  assert.equal(signals[0]?.aborted, true)
  assert.equal(signals[1]?.aborted, false)
  assert.deepEqual(controller.getState().uiState, {
    status: 'answered',
    answer: '新回答',
    sources: [],
  })
})

test('卸载对应的 dispose 后迟到响应不会更新状态', async () => {
  const pending = deferred<ReturnType<typeof answeredResponse>>()
  const states: string[] = []
  const controller = createCustomerServiceRequestController({
    request: () => pending.promise,
    onStateChange: (state) =>
      states.push(state.uiState?.status ?? (state.loading ? 'loading' : 'idle')),
  })

  const requestPromise = controller.submit('即将卸载的问题')
  controller.dispose()
  const updateCountAfterDispose = states.length
  pending.resolve(answeredResponse('卸载后的迟到回答'))
  await requestPromise

  assert.equal(states.length, updateCountAfterDispose)
  assert.equal(states.includes('answered'), false)
})
