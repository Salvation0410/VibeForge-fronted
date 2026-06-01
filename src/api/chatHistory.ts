import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { apiTransformResponse } from '@/utils/http'

export interface BaseResponse<T> {
  code: number
  data: T
  message: string
}

export interface PageRequest {
  pageNum?: number
  pageSize?: number
  sortField?: string
  sortOrder?: string
}

export interface PageResult<T> {
  pageNumber?: number
  pageSize?: number
  totalPage?: number
  totalRow?: number
  records: T[]
}

export interface ChatHistory {
  id?: number | string
  message?: string
  messageType?: string
  appId?: number | string
  userId?: number | string
  createTime?: string
  updateTime?: string
  isDelete?: number
}

export interface ChatHistoryQueryRequest extends PageRequest {
  id?: number | string
  message?: string
  messageType?: string
  appId?: number | string
  userId?: number | string
  lastCreateTime?: string
}

export interface ListAppChatHistoryParams {
  pageSize?: number
  lastCreateTime?: string
}

const chatHistoryRequest = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  transformResponse: apiTransformResponse,
})

function unwrapResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
  return response.data
}

function buildDownloadFileNameFromDisposition(disposition?: string) {
  if (!disposition) {
    return ''
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const plainMatch = disposition.match(/filename="?([^"]+)"?/i)
  return plainMatch?.[1] || ''
}

export function listAppChatHistory(
  appId: number | string,
  params?: ListAppChatHistoryParams,
): Promise<BaseResponse<PageResult<ChatHistory>>> {
  return chatHistoryRequest
    .get<BaseResponse<PageResult<ChatHistory>>>(`/chatHistory/app/${appId}`, { params })
    .then(unwrapResponse)
}

export function listAllChatHistoryByPageForAdmin(
  data: ChatHistoryQueryRequest,
): Promise<BaseResponse<PageResult<ChatHistory>>> {
  return chatHistoryRequest
    .post<BaseResponse<PageResult<ChatHistory>>>('/chatHistory/admin/list/page/vo', data)
    .then(unwrapResponse)
}

export async function exportAppChatHistoryMarkdown(appId: number | string) {
  const response = await chatHistoryRequest.get<Blob>(`/chatHistory/app/${appId}/export/markdown`, {
    responseType: 'blob',
  })

  return {
    blob: response.data,
    fileName: buildDownloadFileNameFromDisposition(response.headers['content-disposition']),
  }
}

const chatHistoryApi = {
  listAppChatHistory,
  listAllChatHistoryByPageForAdmin,
  exportAppChatHistoryMarkdown,
}

export default chatHistoryApi
