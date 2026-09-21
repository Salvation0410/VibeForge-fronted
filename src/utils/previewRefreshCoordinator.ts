export interface PreviewRefreshCoordinator {
  begin: (requestKey: string) => void
  complete: (requestKey: string) => Promise<void>
  fail: (requestKey: string) => void
  dispose: () => void
}

/**
 * 将预览刷新绑定到当前生成轮次的成功终态；重复、过期、失败或已销毁轮次都不会触发刷新。
 * 刷新延迟到微任务执行，使页面切换和组件卸载有机会在网络请求开始前取消待执行工作。
 */
export function createPreviewRefreshCoordinator(
  reload: () => Promise<void> | void,
): PreviewRefreshCoordinator {
  let activeRequestKey: string | null = null
  let generation = 0
  let disposed = false

  return {
    /** 开始新轮次只登记刷新资格，不改动当前 iframe。 */
    begin(requestKey) {
      if (disposed) {
        return
      }
      generation += 1
      activeRequestKey = requestKey
    },
    /** 仅当前轮次第一次成功可消费刷新资格；刷新开始前仍可被新轮次或销毁操作取消。 */
    async complete(requestKey) {
      if (disposed || activeRequestKey !== requestKey) {
        return
      }

      const completedGeneration = generation
      activeRequestKey = null
      await Promise.resolve()
      if (disposed || generation !== completedGeneration) {
        return
      }
      await reload()
    },
    /** 失败或主动取消会撤销当前轮次资格，确保旧预览继续保留。 */
    fail(requestKey) {
      if (disposed || activeRequestKey !== requestKey) {
        return
      }
      generation += 1
      activeRequestKey = null
    },
    /** 页面销毁后永久禁止所有待执行或后续刷新。 */
    dispose() {
      if (disposed) {
        return
      }
      disposed = true
      generation += 1
      activeRequestKey = null
    },
  }
}
