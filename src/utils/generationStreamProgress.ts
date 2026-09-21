export interface GenerationProgressSnapshot {
  receivedCharacters: number
  elapsedMs: number
  visibleContent: string
}

export interface GenerationStreamProgressOptions<TScheduleHandle> {
  intervalMs: number
  maxVisibleCharacters: number
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
 * 在 Vue 响应式状态之外累计流式响应，只按固定间隔发布总字符数和有限长度的文本尾部。
 * 这样用户能实时看到内容，同时避免完整源码在每个分片到达时反复复制和渲染。
 */
export function createGenerationStreamProgress<TScheduleHandle>({
  intervalMs,
  maxVisibleCharacters,
  schedule,
  cancelSchedule,
  onFlush,
  now = Date.now,
}: GenerationStreamProgressOptions<TScheduleHandle>): GenerationStreamProgress {
  const startedAt = now()
  let receivedCharacters = 0
  let visibleContent = ''
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
      visibleContent,
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
    /** 累计总字符数并保留最新文本尾部；同一刷新窗口内收到再多分片也只安排一次 UI 更新。 */
    push(chunk) {
      if (disposed || !chunk) {
        return
      }
      receivedCharacters += chunk.length
      const chunkTail = chunk.slice(-maxVisibleCharacters)
      visibleContent = `${visibleContent}${chunkTail}`.slice(-maxVisibleCharacters)
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
