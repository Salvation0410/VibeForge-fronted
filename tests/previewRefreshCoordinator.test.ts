import test from 'node:test'
import assert from 'node:assert/strict'
import { createPreviewRefreshCoordinator } from '../src/utils/previewRefreshCoordinator.ts'

test('begin keeps the current preview mounted without reloading', async () => {
  let reloadCount = 0
  const coordinator = createPreviewRefreshCoordinator(() => {
    reloadCount += 1
  })

  coordinator.begin('request-1')
  await Promise.resolve()

  assert.equal(reloadCount, 0)
})

test('complete reloads exactly once for the active request', async () => {
  let reloadCount = 0
  const coordinator = createPreviewRefreshCoordinator(() => {
    reloadCount += 1
  })

  coordinator.begin('request-1')
  await coordinator.complete('request-1')
  await coordinator.complete('request-1')

  assert.equal(reloadCount, 1)
})

test('stale success cannot reload a newer generation preview', async () => {
  let reloadCount = 0
  const coordinator = createPreviewRefreshCoordinator(() => {
    reloadCount += 1
  })

  coordinator.begin('request-1')
  coordinator.begin('request-2')
  await coordinator.complete('request-1')

  assert.equal(reloadCount, 0)
})

test('failed or cancelled requests never reload the preview', async () => {
  let reloadCount = 0
  const coordinator = createPreviewRefreshCoordinator(() => {
    reloadCount += 1
  })

  coordinator.begin('failed-request')
  coordinator.fail('failed-request')
  await coordinator.complete('failed-request')

  coordinator.begin('cancelled-request')
  coordinator.fail('cancelled-request')
  await coordinator.complete('cancelled-request')

  assert.equal(reloadCount, 0)
})

test('dispose cancels a successful refresh that has not started yet', async () => {
  let reloadCount = 0
  const coordinator = createPreviewRefreshCoordinator(() => {
    reloadCount += 1
  })

  coordinator.begin('request-1')
  const completion = coordinator.complete('request-1')
  coordinator.dispose()
  await completion

  assert.equal(reloadCount, 0)
})
