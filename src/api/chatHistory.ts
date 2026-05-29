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

const chatHistoryApi = {
  listAppChatHistory,
  listAllChatHistoryByPageForAdmin,
}

export default chatHistoryApi
