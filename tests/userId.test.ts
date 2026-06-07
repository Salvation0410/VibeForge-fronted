import test from 'node:test'
import assert from 'node:assert/strict'
import { isSameUserId, normalizeUserId } from '../src/utils/userId.ts'

test('normalizeUserId keeps long numeric ids exact as strings', () => {
  const rawUserId = '414949884627984384'

  assert.equal(normalizeUserId(rawUserId), rawUserId)
  assert.notEqual(String(Number(rawUserId)), rawUserId)
})

test('isSameUserId compares owner ids without numeric precision loss', () => {
  const routeUserId = '414949884627984384'
  const loginUserId = '414949884627984384'

  assert.equal(isSameUserId(routeUserId, loginUserId), true)
  assert.equal(isSameUserId(routeUserId, Number(routeUserId)), false)
})
