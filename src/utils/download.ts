export function sanitizeDownloadFileName(fileName: string, fallback = 'download.md') {
  const normalized = fileName.trim().replace(/[\\/:*?"<>|]+/g, '_')
  return normalized || fallback
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

