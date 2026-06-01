export interface VisualEditorSelectedElement {
  tagName: string
  selector: string
  text: string
  id?: string
  className?: string
  role?: string
  href?: string
  placeholder?: string
}

interface VisualEditorMessage {
  source: 'yu_ai_visual_editor'
  type: 'element-selected'
  payload: VisualEditorSelectedElement
}

interface CreateVisualEditorOptions {
  onSelect?: (payload: VisualEditorSelectedElement) => void
}

interface BoundFrameContext {
  cleanup: () => void
  iframeWindow: Window
}

const MESSAGE_SOURCE = 'yu_ai_visual_editor'
const HOVER_CLASS = '__yu_ai_visual_editor_hover__'
const SELECTED_CLASS = '__yu_ai_visual_editor_selected__'
const STYLE_ID = '__yu_ai_visual_editor_style__'

function canInspectElement(target: EventTarget | null): target is HTMLElement {
  if (!target || typeof target !== 'object') {
    return false
  }

  const candidate = target as {
    nodeType?: number
    tagName?: string
  }

  return (
    candidate.nodeType === 1 &&
    typeof candidate.tagName === 'string' &&
    !['HTML', 'BODY', 'SCRIPT', 'STYLE', 'LINK', 'META'].includes(candidate.tagName.toUpperCase())
  )
}

function normalizeText(text?: string, maxLength = 120) {
  const normalized = text?.replace(/\s+/g, ' ').trim() || ''
  if (!normalized) {
    return ''
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized
}

function buildSelector(element: HTMLElement) {
  const tagName = element.tagName.toLowerCase()
  const id = element.id?.trim()
  if (id) {
    return `${tagName}#${id}`
  }

  const classNames = Array.from(element.classList).filter(Boolean).slice(0, 3)
  if (classNames.length) {
    return `${tagName}.${classNames.join('.')}`
  }

  const role = element.getAttribute('role')?.trim()
  if (role) {
    return `${tagName}[role="${role}"]`
  }

  return tagName
}

function extractSelectedElement(element: HTMLElement): VisualEditorSelectedElement {
  return {
    tagName: element.tagName.toLowerCase(),
    selector: buildSelector(element),
    text: normalizeText(
      element.innerText ||
        element.textContent ||
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        '',
    ),
    id: element.id?.trim() || undefined,
    className: normalizeText(element.className, 80) || undefined,
    role: element.getAttribute('role')?.trim() || undefined,
    href: element.getAttribute('href')?.trim() || undefined,
    placeholder: element.getAttribute('placeholder')?.trim() || undefined,
  }
}

function injectStyle(doc: Document) {
  if (doc.getElementById(STYLE_ID)) {
    return
  }

  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .${HOVER_CLASS} {
      outline: 2px solid rgba(24, 144, 255, 0.78) !important;
      outline-offset: 1px !important;
      cursor: crosshair !important;
    }

    .${SELECTED_CLASS} {
      outline: 3px solid rgba(9, 109, 217, 0.96) !important;
      outline-offset: 1px !important;
      box-shadow: 0 0 0 4px rgba(9, 109, 217, 0.16) !important;
    }
  `
  doc.head.appendChild(style)
}

function removeHighlight(element?: HTMLElement | null) {
  element?.classList.remove(HOVER_CLASS, SELECTED_CLASS)
}

export function formatSelectedElementInfo(selectedElement: VisualEditorSelectedElement) {
  const parts = [`元素：${selectedElement.selector}`]

  if (selectedElement.text) {
    parts.push(`内容：${selectedElement.text}`)
  }
  if (selectedElement.placeholder) {
    parts.push(`占位提示：${selectedElement.placeholder}`)
  }
  if (selectedElement.href) {
    parts.push(`链接：${selectedElement.href}`)
  }

  return parts.join(' | ')
}

export function buildVisualEditPrompt(
  prompt: string,
  selectedElement?: VisualEditorSelectedElement | null,
) {
  const normalizedPrompt = prompt.trim()
  if (!selectedElement) {
    return normalizedPrompt
  }

  const lines = [
    normalizedPrompt,
    '',
    '[可视化编辑选中元素]',
    `- 标签：${selectedElement.tagName}`,
    `- 定位：${selectedElement.selector}`,
  ]

  if (selectedElement.text) {
    lines.push(`- 文本：${selectedElement.text}`)
  }
  if (selectedElement.id) {
    lines.push(`- ID：${selectedElement.id}`)
  }
  if (selectedElement.className) {
    lines.push(`- 类名：${selectedElement.className}`)
  }
  if (selectedElement.role) {
    lines.push(`- 角色：${selectedElement.role}`)
  }
  if (selectedElement.placeholder) {
    lines.push(`- 占位提示：${selectedElement.placeholder}`)
  }
  if (selectedElement.href) {
    lines.push(`- 链接：${selectedElement.href}`)
  }
  lines.push('- 请优先围绕这个选中元素及其关联区域进行修改，并保持页面其余部分风格一致。')

  return lines.join('\n')
}

export function createVisualEditor(options: CreateVisualEditorOptions = {}) {
  let enabled = false
  let boundFrame: BoundFrameContext | null = null
  let selectedElement: HTMLElement | null = null
  let hoveredElement: HTMLElement | null = null

  const handleMessage = (event: MessageEvent<VisualEditorMessage>) => {
    if (event.origin !== window.location.origin) {
      return
    }
    if (event.data?.source !== MESSAGE_SOURCE || event.data?.type !== 'element-selected') {
      return
    }
    options.onSelect?.(event.data.payload)
  }

  window.addEventListener('message', handleMessage)

  const detachFrame = () => {
    boundFrame?.cleanup()
    boundFrame = null
    selectedElement = null
    hoveredElement = null
  }

  const bindToIframe = (iframe: HTMLIFrameElement | null) => {
    detachFrame()

    if (!enabled || !iframe?.contentWindow) {
      return
    }

    const iframeWindow = iframe.contentWindow
    let doc: Document
    try {
      doc = iframeWindow.document
    } catch {
      return
    }

    if (!doc?.documentElement) {
      return
    }

    injectStyle(doc)

    const clearHoverState = () => {
      if (hoveredElement && hoveredElement !== selectedElement) {
        hoveredElement.classList.remove(HOVER_CLASS)
      }
      hoveredElement = null
    }

    const handleMouseOver = (event: Event) => {
      const target = event.target
      if (!canInspectElement(target)) {
        return
      }

      if (hoveredElement && hoveredElement !== target && hoveredElement !== selectedElement) {
        hoveredElement.classList.remove(HOVER_CLASS)
      }

      hoveredElement = target
      if (hoveredElement !== selectedElement) {
        hoveredElement.classList.add(HOVER_CLASS)
      }
    }

    const handleMouseOut = (event: Event) => {
      const target = event.target
      if (!canInspectElement(target)) {
        return
      }

      const relatedTarget = (event as MouseEvent).relatedTarget
      if (relatedTarget instanceof Node && target.contains(relatedTarget)) {
        return
      }

      if (target !== selectedElement) {
        target.classList.remove(HOVER_CLASS)
      }

      if (hoveredElement === target) {
        hoveredElement = null
      }
    }

    const handleClick = (event: Event) => {
      const target = event.target
      if (!canInspectElement(target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      if ('stopImmediatePropagation' in event) {
        event.stopImmediatePropagation()
      }

      removeHighlight(selectedElement)
      selectedElement = target
      selectedElement.classList.remove(HOVER_CLASS)
      selectedElement.classList.add(SELECTED_CLASS)

      const payload = extractSelectedElement(selectedElement)
      iframeWindow.parent.postMessage(
        {
          source: MESSAGE_SOURCE,
          type: 'element-selected',
          payload,
        } satisfies VisualEditorMessage,
        window.location.origin,
      )
    }

    doc.addEventListener('mouseover', handleMouseOver, true)
    doc.addEventListener('mouseout', handleMouseOut, true)
    doc.addEventListener('click', handleClick, true)

    boundFrame = {
      iframeWindow,
      cleanup: () => {
        doc.removeEventListener('mouseover', handleMouseOver, true)
        doc.removeEventListener('mouseout', handleMouseOut, true)
        doc.removeEventListener('click', handleClick, true)
        removeHighlight(selectedElement)
        clearHoverState()
        const style = doc.getElementById(STYLE_ID)
        style?.remove()
      },
    }
  }

  return {
    isEnabled: () => enabled,
    enable(iframe: HTMLIFrameElement | null) {
      enabled = true
      bindToIframe(iframe)
    },
    disable() {
      enabled = false
      detachFrame()
    },
    attachToIframe(iframe: HTMLIFrameElement | null) {
      bindToIframe(iframe)
    },
    destroy() {
      enabled = false
      detachFrame()
      window.removeEventListener('message', handleMessage)
    },
  }
}
