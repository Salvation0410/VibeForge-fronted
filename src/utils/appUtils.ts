import type { AppVO } from '@/api/app'
import type { SysUserVO } from '@/api/sysUserApi'

export const SUCCESS_CODES = new Set([0, 20000])
export const DEFAULT_CODE_GEN_TYPE = 'multi_file'
export const APP_PREVIEW_BASE_URL = '/api/static'
export const VUE_PROJECT_CODE_GEN_TYPE = 'vue_project'

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
  const resolvedCodeGenType = codeGenType || DEFAULT_CODE_GEN_TYPE
  const baseUrl = `${APP_PREVIEW_BASE_URL}/${resolvedCodeGenType}_${appId}/`

  if (resolvedCodeGenType.toLowerCase() === VUE_PROJECT_CODE_GEN_TYPE) {
    return `${baseUrl}dist/index.html`
  }

  return baseUrl
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

function encodeSvgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function getCoverTitle(app?: AppVO) {
  const name = app?.appName?.trim()
  if (!name) {
    return 'AI App'
  }
  return name.length > 24 ? `${name.slice(0, 24)}...` : name
}

function getCoverType(app?: AppVO) {
  return (app?.codeGenType || DEFAULT_CODE_GEN_TYPE).replace(/_/g, ' ').toUpperCase()
}

export function getAppCoverUrl(app?: AppVO) {
  const cover = app?.cover?.trim()
  if (cover) {
    return cover
  }

  const title = getCoverTitle(app)
  const type = getCoverType(app)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff8ff" />
          <stop offset="55%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#e7f5ff" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#22b8cf" />
          <stop offset="100%" stop-color="#2f69ff" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" rx="48" fill="url(#bg)" />
      <circle cx="1310" cy="190" r="210" fill="#d9f4ff" />
      <circle cx="180" cy="860" r="240" fill="#edf4ff" />
      <rect x="118" y="118" width="248" height="52" rx="26" fill="#ffffff" opacity="0.9" />
      <text x="242" y="152" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#1484b1">${type}</text>
      <text x="118" y="700" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#132033">${title}</text>
      <text x="118" y="782" font-family="Arial, sans-serif" font-size="34" fill="#5f6f88">Deploy later, preview now.</text>
      <rect x="118" y="840" width="460" height="16" rx="8" fill="url(#accent)" opacity="0.92" />
      <rect x="1180" y="620" width="250" height="250" rx="56" fill="url(#accent)" opacity="0.18" />
      <rect x="1100" y="540" width="250" height="250" rx="56" fill="#ffffff" opacity="0.72" />
      <rect x="1020" y="460" width="250" height="250" rx="56" fill="url(#accent)" opacity="0.12" />
    </svg>
  `

  return encodeSvgDataUri(svg)
}
