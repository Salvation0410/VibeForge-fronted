import assert from 'node:assert/strict'
import test from 'node:test'
import type { CustomerServiceAnswer, CustomerServiceSource } from '../src/api/customerService.ts'
import {
  CUSTOMER_SERVICE_EXCERPT_LIMIT,
  isCustomerServiceRequestCancelled,
  normalizeCustomerServiceState,
  normalizeCustomerServiceSources,
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
  assert.ok(result.excerpt.length <= CUSTOMER_SERVICE_EXCERPT_LIMIT)
  assert.ok(result.excerpt.endsWith('…'))
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
