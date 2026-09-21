import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOptimizePrompt } from '../src/utils/optimizePrompt.ts'

test('HTML prompt is short and requests one complete runnable file', () => {
  const prompt = buildOptimizePrompt('HTML')
  assert.match(prompt, /完整可运行的 HTML 文件/)
  assert.match(prompt, /不要附带解释/)
  assert.match(prompt, /不要输出残缺代码/)
  assert.ok(prompt.length < 180)
})

test('MULTI_FILE prompt requests all three complete files', () => {
  const prompt = buildOptimizePrompt('multi_file')
  assert.match(prompt, /index\.html、style\.css 和 script\.js/)
  assert.match(prompt, /不要附带解释/)
  assert.match(prompt, /不要输出残缺代码/)
  assert.ok(prompt.length < 180)
})

test('VUE_PROJECT and unknown types limit changes to the existing project', () => {
  for (const type of ['VUE_PROJECT', 'unknown', undefined]) {
    const prompt = buildOptimizePrompt(type)
    assert.match(prompt, /只修改完成这次优化需要的文件/)
    assert.match(prompt, /不要重建项目/)
    assert.match(prompt, /正常运行/)
    assert.ok(prompt.length < 220)
  }
})

test('all optimization prompts preserve content, behavior, and images', () => {
  for (const type of ['HTML', 'MULTI_FILE', 'VUE_PROJECT', undefined]) {
    const prompt = buildOptimizePrompt(type)
    assert.match(prompt, /保留原有功能、文字、图片和操作方式/)
    assert.match(prompt, /不要删除或替换原有图片/)
    assert.match(prompt, /不要添加无关内容/)
    assert.match(prompt, /不要附带解释/)
    assert.match(prompt, /不要输出残缺/)
  }
})

test('prompts avoid wording that ordinary users should not need to understand', () => {
  for (const type of ['HTML', 'MULTI_FILE', 'VUE_PROJECT', undefined]) {
    const prompt = buildOptimizePrompt(type)
    assert.doesNotMatch(prompt, /信息层级|响应式表现|技术栈|输出协议|组件职责|代码块|围栏/)
  }
})
