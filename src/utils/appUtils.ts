import type { AppVO } from '@/api/app'
import type { SysUserVO } from '@/api/sysUserApi'

export const SUCCESS_CODES = new Set([0, 20000])
export const DEFAULT_CODE_GEN_TYPE = 'multi_file'
export const APP_PREVIEW_BASE_URL = 'http://localhost:8123/api/static'

export function isSuccessCode(code?: number) {
  return SUCCESS_CODES.has(Number(code ?? -1))
}

export function isAdminRole(userRole?: string) {
  return userRole === 'admin'
}

export function buildAppNameFromPrompt(prompt: string) {
  const normalized = prompt.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return '未命名应用'
  }
  return normalized.length > 18 ? `${normalized.slice(0, 18)}...` : normalized
}

export function buildLocalPreviewUrl(appId?: number | string, codeGenType?: string) {
  if (!appId) {
    return ''
  }
  return `${APP_PREVIEW_BASE_URL}/${codeGenType || DEFAULT_CODE_GEN_TYPE}_${appId}/`
}

export function formatDateTime(value?: string) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(value?: string) {
  if (!value) {
    return '刚刚创建'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const diff = date.getTime() - Date.now()
  const absDiff = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (absDiff < hour) {
    return rtf.format(Math.round(diff / minute), 'minute')
  }
  if (absDiff < day) {
    return rtf.format(Math.round(diff / hour), 'hour')
  }
  if (absDiff < week) {
    return rtf.format(Math.round(diff / day), 'day')
  }
  return rtf.format(Math.round(diff / week), 'week')
}

export function getAppOwnerName(app?: AppVO) {
  const user = app?.user as SysUserVO | undefined
  return user?.nickname || user?.account || (app?.userId ? `用户 ${app.userId}` : '匿名作者')
}

export function getAppOwnerAvatar(app?: AppVO) {
  const user = app?.user as SysUserVO | undefined
  return user?.avatarUrl || ''
}

export function getAppTagColor(priority?: number) {
  if ((priority ?? 0) >= 99) {
    return 'gold'
  }
  if ((priority ?? 0) > 0) {
    return 'blue'
  }
  return 'default'
}
