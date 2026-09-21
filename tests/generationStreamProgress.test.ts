import test from 'node:test'
import assert from 'node:assert/strict'
import { createGenerationStreamProgress } from '../src/utils/generationStreamProgress.ts'

type ScheduledTask = {
  callback: () => void
  cancelled: boolean
}

const createScheduler = () => {
  const tasks: ScheduledTask[] = []
  const allTasks: ScheduledTask[] = []
  return {
    tasks,
    allTasks,
    schedule(callback: () => void) {
      const task = { callback, cancelled: false }
      tasks.push(task)
      allTasks.push(task)
      return task
    },
    cancelSchedule(task: ScheduledTask) {
      task.cancelled = true
    },
    runPending() {
      tasks.splice(0).forEach((task) => {
        if (!task.cancelled) {
          task.callback()
        }
      })
    },
  }
}

test('10,000 chunks share one scheduled flush and retain only the latest 2,000 characters', () => {
  const scheduler = createScheduler()
  const updates: Array<{
    receivedCharacters: number
    elapsedMs: number
    visibleContent: string
  }> = []
  let now = 1_000
  const progress = createGenerationStreamProgress({
    intervalMs: 80,
    maxVisibleCharacters: 2_000,
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancelSchedule,
    now: () => now,
    onFlush: (snapshot) => updates.push(snapshot),
  })

  for (let index = 0; index < 10_000; index += 1) {
    progress.push(String(index % 10))
  }

  assert.equal(scheduler.tasks.length, 1)
  assert.deepEqual(updates, [])

  now = 1_080
  scheduler.runPending()
  assert.equal(updates.length, 1)
  assert.equal(updates[0]?.receivedCharacters, 10_000)
  assert.equal(updates[0]?.elapsedMs, 80)
  assert.equal(updates[0]?.visibleContent.length, 2_000)
  assert.equal(updates[0]?.visibleContent, '0123456789'.repeat(200))
})

test('visible content keeps the output tail when a single chunk exceeds the limit', () => {
  const scheduler = createScheduler()
  const updates: Array<{ receivedCharacters: number; visibleContent: string }> = []
  const progress = createGenerationStreamProgress({
    intervalMs: 80,
    maxVisibleCharacters: 5,
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancelSchedule,
    onFlush: ({ receivedCharacters, visibleContent }) =>
      updates.push({ receivedCharacters, visibleContent }),
  })

  progress.push('abcdefgh')
  scheduler.runPending()

  assert.deepEqual(updates, [{ receivedCharacters: 8, visibleContent: 'defgh' }])
})

test('finish cancels the timer and synchronously flushes the final snapshot', () => {
  const scheduler = createScheduler()
  const updates: number[] = []
  const progress = createGenerationStreamProgress({
    intervalMs: 80,
    maxVisibleCharacters: 2_000,
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancelSchedule,
    onFlush: ({ receivedCharacters }) => updates.push(receivedCharacters),
  })

  progress.push('first')
  progress.finish()
  scheduler.runPending()

  assert.deepEqual(updates, [5])
  assert.equal(scheduler.allTasks[0]?.cancelled, true)
})

test('dispose cancels pending work and suppresses later pushes and callbacks', () => {
  const scheduler = createScheduler()
  const updates: number[] = []
  const progress = createGenerationStreamProgress({
    intervalMs: 80,
    maxVisibleCharacters: 2_000,
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancelSchedule,
    onFlush: ({ receivedCharacters }) => updates.push(receivedCharacters),
  })

  progress.push('discarded')
  progress.dispose()
  progress.push('ignored')
  progress.finish()
  scheduler.runPending()

  assert.deepEqual(updates, [])
  assert.equal(scheduler.allTasks[0]?.cancelled, true)
  assert.equal(scheduler.allTasks.length, 1)
})
