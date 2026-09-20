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

test('10,000 chunks share one scheduled flush and only accumulate character count', () => {
  const scheduler = createScheduler()
  const updates: Array<{ receivedCharacters: number; elapsedMs: number }> = []
  let now = 1_000
  const progress = createGenerationStreamProgress({
    intervalMs: 80,
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancelSchedule,
    now: () => now,
    onFlush: (snapshot) => updates.push(snapshot),
  })

  for (let index = 0; index < 10_000; index += 1) {
    progress.push('ab')
  }

  assert.equal(scheduler.tasks.length, 1)
  assert.deepEqual(updates, [])

  now = 1_080
  scheduler.runPending()
  assert.deepEqual(updates, [{ receivedCharacters: 20_000, elapsedMs: 80 }])
})

test('finish cancels the timer and synchronously flushes the final snapshot', () => {
  const scheduler = createScheduler()
  const updates: number[] = []
  const progress = createGenerationStreamProgress({
    intervalMs: 80,
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
