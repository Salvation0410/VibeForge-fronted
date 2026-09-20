import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOptimizePrompt } from '../src/utils/optimizePrompt.ts'

test('HTML prompt requires one complete fenced document without scope expansion', () => {
  const prompt = buildOptimizePrompt('HTML')
  assert.match(prompt, /一个闭合的 html 代码块/)
  assert.match(prompt, /CSS 和 JavaScript 必须内联/)
  assert.doesNotMatch(prompt, /补全.*加载.*空状态.*动画/)
})

test('MULTI_FILE prompt preserves the three-file output protocol', () => {
  const prompt = buildOptimizePrompt('multi_file')
  assert.match(prompt, /index\.html、style\.css 和 script\.js/)
  assert.match(prompt, /严格按当前三文件协议输出/)
})

test('VUE_PROJECT prompt limits changes to the existing project', () => {
  const prompt = buildOptimizePrompt('VUE_PROJECT')
  assert.match(prompt, /不要重建工程/)
  assert.match(prompt, /只修改完成本次视觉与体验优化所必需的文件/)
})

test('unknown or missing type uses minimal changes without an invented output protocol', () => {
  for (const type of ['unknown', undefined]) {
    const prompt = buildOptimizePrompt(type)
    assert.match(prompt, /只修改完成本次视觉与体验优化所必需的文件/)
    assert.doesNotMatch(prompt, /闭合的 html 代码块|三文件协议/)
  }
})
