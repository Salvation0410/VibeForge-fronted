import test from 'node:test'
import assert from 'node:assert/strict'
import { ensureLoginUserBootstrapped } from '../src/bootstrap/loginUser.ts'

test('ensureLoginUserBootstrapped fetches current user when store has not been hydrated', async () => {
  let fetchCount = 0

  await ensureLoginUserBootstrapped({
    hasFetched: false,
    async fetchLoginUser() {
      fetchCount += 1
    },
  })

  assert.equal(fetchCount, 1)
})

test('ensureLoginUserBootstrapped does not re-fetch when store is already hydrated', async () => {
  let fetchCount = 0

  await ensureLoginUserBootstrapped({
    hasFetched: true,
    async fetchLoginUser() {
      fetchCount += 1
    },
  })

  assert.equal(fetchCount, 0)
})
