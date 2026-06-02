import type { ChatHistory } from '@/api/chatHistory'

export type ChatMessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  createdAt?: string
}

const USER_MESSAGE_TYPES = new Set(['user', 'human', 'question', 'ask', 'input', '1'])
const ASSISTANT_MESSAGE_TYPES = new Set([
  'assistant',
  'ai',
  'bot',
  'system',
  'answer',
  'reply',
  'output',
  '2',
])

export function normalizeChatMessageRole(messageType?: string): ChatMessageRole {
  const normalized = String(messageType || '')
    .trim()
    .toLowerCase()

  if (USER_MESSAGE_TYPES.has(normalized)) {
    return 'user'
  }
  if (ASSISTANT_MESSAGE_TYPES.has(normalized)) {
    return 'assistant'
  }
  if (
    normalized.includes('user') ||
    normalized.includes('human') ||
    normalized.includes('question')
  ) {
    return 'user'
  }
  if (
    normalized.includes('assistant') ||
    normalized.includes('ai') ||
    normalized.includes('bot') ||
    normalized.includes('answer')
  ) {
    return 'assistant'
  }
  return 'assistant'
}

export function getChatMessageTypeText(messageType?: string) {
  return normalizeChatMessageRole(messageType) === 'user' ? '用户消息' : 'AI 回复'
}

export function mapChatHistoryToMessage(item: ChatHistory): ChatMessage {
  return {
    id: String(item.id || `${item.messageType || 'message'}-${item.createTime || Date.now()}`),
    role: normalizeChatMessageRole(item.messageType),
    content: item.message || '',
    createdAt: item.createTime,
  }
}

export function sortChatHistoryAsc<T extends { createTime?: string; id?: number | string }>(
  records: T[],
) {
  return [...records].sort((a, b) => {
    const aTime = a.createTime ? new Date(a.createTime).getTime() : 0
    const bTime = b.createTime ? new Date(b.createTime).getTime() : 0

    if (aTime !== bTime) {
      return aTime - bTime
    }

    return String(a.id || '').localeCompare(String(b.id || ''))
  })
}
