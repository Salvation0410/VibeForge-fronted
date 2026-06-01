export function sanitizeDownloadFileName(fileName: string, fallback = 'download.md') {
  const normalized = fileName.trim().replace(/[\\/:*?"<>|]+/g, '_')
  return normalized || fallback
}

export function getFileNameFromContentDisposition(
  contentDisposition?: string,
  fallback = 'download.zip',
) {
  if (!contentDisposition) {
    return fallback
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return sanitizeDownloadFileName(decodeURIComponent(utf8Match[1]), fallback)
    } catch {
      return sanitizeDownloadFileName(utf8Match[1], fallback)
    }
  }

  const basicMatch = contentDisposition.match(/filename\s*=\s*"?(.*?)"?(?:;|$)/i)
  if (basicMatch?.[1]) {
    return sanitizeDownloadFileName(basicMatch[1], fallback)
  }

  return fallback
}

export function downloadBlobFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
