export interface GenerationProgressSnapshot {
  receivedCharacters: number
  elapsedMs: number
}

export interface GenerationStreamProgressOptions<TScheduleHandle> {
  intervalMs: number
  schedule: (callback: () => void, delayMs: number) => TScheduleHandle
  cancelSchedule: (handle: TScheduleHandle) => void
  onFlush: (snapshot: GenerationProgressSnapshot) => void
  now?: () => number
}

export interface GenerationStreamProgress {
  push: (chunk: string) => void
  finish: () => void
  dispose: () => void
}

/**
 * 仅累计流式响应的字符数并按固定窗口发布轻量进度；源码分片刻意不拼接、不进入 Vue
 * 响应式状态，避免长文本在每个 token 到达时反复复制和触发整段 DOM 更新。
 */
export function createGenerationStreamProgress<TScheduleHandle>({
  intervalMs,
  schedule,
  cancelSchedule,
  onFlush,
  now = Date.now,
}: GenerationStreamProgressOptions<TScheduleHandle>): GenerationStreamProgress {
  const startedAt = now()
  let receivedCharacters = 0
  let pendingHandle: TScheduleHandle | undefined
  let hasPendingHandle = false
  let dirty = false
  let disposed = false

  const flush = () => {
    hasPendingHandle = false
    pendingHandle = undefined
    if (disposed || !dirty) {
      return
    }

    dirty = false
    onFlush({
      receivedCharacters,
      elapsedMs: Math.max(0, now() - startedAt),
    })
  }

  const clearPending = () => {
    if (!hasPendingHandle) {
      return
    }
    cancelSchedule(pendingHandle as TScheduleHandle)
    hasPendingHandle = false
    pendingHandle = undefined
  }

  return {
    /** 累加字符数；同一批处理窗口内无论收到多少分片都只安排一次 UI 更新。 */
    push(chunk) {
      if (disposed || !chunk) {
        return
      }
      receivedCharacters += chunk.length
      dirty = true
      if (hasPendingHandle) {
        return
      }
      pendingHandle = schedule(flush, intervalMs)
      hasPendingHandle = true
    },
    /** 正常终态会同步提交最后一批进度，保证 UI 不遗漏尚未到期的字符计数。 */
    finish() {
      if (disposed) {
        return
      }
      clearPending()
      flush()
      disposed = true
    },
    /** 取消或异常时丢弃待发布进度，清理计时器且永久禁止后续回调。 */
    dispose() {
      if (disposed) {
        return
      }
      disposed = true
      clearPending()
      dirty = false
    },
  }
}
