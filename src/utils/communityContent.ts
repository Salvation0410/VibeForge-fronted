import DOMPurify from 'dompurify'

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i
const EMPTY_HTML_PATTERN = /^(?:\s|&nbsp;|<p><br><\/p>|<p>\s*<\/p>|<br\s*\/?>)*$/i

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizePlainTextToHtml(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function isEffectivelyEmptyCommunityContent(content?: string) {
  if (!content) {
    return true
  }

  const normalized = content.trim()
  if (!normalized) {
    return true
  }

  if (!HTML_TAG_PATTERN.test(normalized)) {
    return normalized.length === 0
  }

  const sanitized = DOMPurify.sanitize(normalized).trim()
  if (!sanitized || EMPTY_HTML_PATTERN.test(sanitized)) {
    return true
  }

  const container = document.createElement('div')
  container.innerHTML = sanitized
  const text = container.textContent?.replace(/\u00a0/g, ' ').trim() || ''
  const hasMedia = Boolean(container.querySelector('img, video, audio, iframe, table, pre, blockquote'))
  return !text && !hasMedia
}

export function renderCommunityContent(content?: string) {
  if (!content) {
    return ''
  }

  const normalized = content.trim()
  if (!normalized) {
    return ''
  }

  if (!HTML_TAG_PATTERN.test(normalized)) {
    return normalizePlainTextToHtml(normalized)
  }

  return DOMPurify.sanitize(normalized)
}

export function extractCommunityText(content?: string) {
  const html = renderCommunityContent(content)
  if (!html) {
    return ''
  }

  const container = document.createElement('div')
  container.innerHTML = html
  return container.textContent?.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() || ''
}
