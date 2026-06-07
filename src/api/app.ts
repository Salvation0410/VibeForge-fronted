import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { apiTransformResponse } from '@/utils/http'

export interface BaseResponse<T> {
  code: number
  data: T
  message: string
}

export type AppId = string

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

export interface AppVO {
  id?: AppId
  appName?: string
  cover?: string
  initPrompt?: string
  codeGenType?: string
  deployKey?: string
  deployedTime?: string
  priority?: number
  userId?: AppId
  user?: Record<string, unknown>
  createTime?: string
  updateTime?: string
}

export interface AppAddRequest {
  appName?: string
  cover?: string
  initPrompt: string
  codeGenType?: string
}

export interface AppUpdateRequest {
  id: AppId
  appName?: string
}

export interface AppAdminUpdateRequest {
  id: AppId
  appName?: string
  cover?: string
  priority?: number
}

export interface AppQueryRequest extends PageRequest {
  id?: AppId
  appName?: string
  cover?: string
  initPrompt?: string
  codeGenType?: string
  deployKey?: string
  priority?: number
  userId?: AppId
}

export interface AppDeployRequest {
  appId: AppId
}

export interface DeleteRequest {
  id: AppId
}

export interface ChatGenCodeChunk {
  d: string
}

export interface ChatGenCodeBusinessError {
  error?: boolean
  code?: number
  message?: string
}

export interface ChatToGenCodeStreamOptions {
  appId: AppId
  message: string
  onMessage?: (chunk: string, payload: ChatGenCodeChunk, event: MessageEvent<string>) => void
  onDone?: (event: MessageEvent) => void
  onBusinessError?: (
    error: ChatGenCodeBusinessError,
    event: MessageEvent<string>,
    eventSource: EventSource,
  ) => void
  onError?: (error: Event | SyntaxError, eventSource: EventSource) => void
}

const appRequest = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  transformResponse: apiTransformResponse,
})

function unwrapResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
  return response.data
}

function buildSseUrl(
  path: string,
  params: Record<string, string | number | undefined | null> = {},
): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return `${appRequest.defaults.baseURL}${path}${queryString ? `?${queryString}` : ''}`
}

export function createApp(data: AppAddRequest): Promise<BaseResponse<AppId>> {
  return appRequest.post<BaseResponse<AppId>>('/apps/add', data).then(unwrapResponse)
}

export function updateMyApp(data: AppUpdateRequest): Promise<BaseResponse<boolean>> {
  return appRequest.post<BaseResponse<boolean>>('/apps/update', data).then(unwrapResponse)
}

export function deleteMyApp(id: AppId): Promise<BaseResponse<boolean>> {
  const payload: DeleteRequest = { id }
  return appRequest.post<BaseResponse<boolean>>('/apps/delete', payload).then(unwrapResponse)
}

export function getAppDetail(id: AppId): Promise<BaseResponse<AppVO>> {
  return appRequest
    .get<BaseResponse<AppVO>>('/apps/get/vo', { params: { id } })
    .then(unwrapResponse)
}

export function getMyAppPage(data: AppQueryRequest): Promise<BaseResponse<PageResult<AppVO>>> {
  return appRequest
    .post<BaseResponse<PageResult<AppVO>>>('/apps/my/list/page/vo', data)
    .then(unwrapResponse)
}

export function getGoodAppPage(data: AppQueryRequest): Promise<BaseResponse<PageResult<AppVO>>> {
  return appRequest
    .post<BaseResponse<PageResult<AppVO>>>('/apps/good/list/page/vo', data)
    .then(unwrapResponse)
}

export function getUserPublicAppPage(
  userId: AppId,
  params?: AppQueryRequest,
): Promise<BaseResponse<PageResult<AppVO>>> {
  return appRequest
    .get<BaseResponse<PageResult<AppVO>>>(`/apps/user/${userId}/page`, { params })
    .then(unwrapResponse)
}

export function deleteAppByAdmin(id: AppId): Promise<BaseResponse<boolean>> {
  const payload: DeleteRequest = { id }
  return appRequest.post<BaseResponse<boolean>>('/apps/admin/delete', payload).then(unwrapResponse)
}

export function updateAppByAdmin(data: AppAdminUpdateRequest): Promise<BaseResponse<boolean>> {
  return appRequest.post<BaseResponse<boolean>>('/apps/admin/update', data).then(unwrapResponse)
}

export function getAppPageByAdmin(data: AppQueryRequest): Promise<BaseResponse<PageResult<AppVO>>> {
  return appRequest
    .post<BaseResponse<PageResult<AppVO>>>('/apps/admin/list/page/vo', data)
    .then(unwrapResponse)
}

export function getAppDetailByAdmin(id: AppId): Promise<BaseResponse<AppVO>> {
  return appRequest
    .get<BaseResponse<AppVO>>('/apps/admin/get/vo', { params: { id } })
    .then(unwrapResponse)
}

export function deployApp(appId: AppId): Promise<BaseResponse<string>> {
  const payload: AppDeployRequest = { appId }
  return appRequest.post<BaseResponse<string>>('/apps/deploy', payload).then(unwrapResponse)
}

export function downloadAppCode(appId: AppId): Promise<AxiosResponse<Blob>> {
  return appRequest.get<Blob>(`/apps/download/${appId}`, {
    responseType: 'blob',
  })
}

/**
 * SSE code generation.
 *
 * Note:
 * 1. This endpoint returns text/event-stream, so EventSource is a better browser-side fit than axios.
 * 2. Because the backend uses session-based auth, the frontend should stay same-origin or proxy /api.
 */
export function chatToGenCodeStream({
  appId,
  message,
  onMessage,
  onDone,
  onBusinessError,
  onError,
}: ChatToGenCodeStreamOptions): EventSource {
  const url = buildSseUrl('/apps/chat/gen/code', { appId, message })
  const eventSource = new EventSource(url, { withCredentials: true })
  let streamCompleted = false

  eventSource.onmessage = (event: MessageEvent<string>) => {
    if (streamCompleted) {
      return
    }

    try {
      const payload = JSON.parse(event.data) as ChatGenCodeChunk
      onMessage?.(payload.d ?? '', payload, event)
    } catch (error) {
      if (error instanceof SyntaxError) {
        streamCompleted = true
        onError?.(error, eventSource)
        eventSource.close()
      }
    }
  }

  eventSource.addEventListener('business-error', (event) => {
    if (streamCompleted) {
      return
    }

    streamCompleted = true
    try {
      const messageEvent = event as MessageEvent<string>
      const errorData = JSON.parse(messageEvent.data) as ChatGenCodeBusinessError
      onBusinessError?.(errorData, messageEvent, eventSource)
    } catch (error) {
      if (error instanceof SyntaxError) {
        onError?.(error, eventSource)
      }
    } finally {
      eventSource.close()
    }
  })

  eventSource.addEventListener('done', (event) => {
    if (streamCompleted) {
      return
    }

    streamCompleted = true
    onDone?.(event as MessageEvent)
    eventSource.close()
  })

  eventSource.onerror = (error: Event) => {
    if (streamCompleted) {
      return
    }

    streamCompleted = true
    onError?.(error, eventSource)
    eventSource.close()
  }

  return eventSource
}

const appApi = {
  createApp,
  updateMyApp,
  deleteMyApp,
  getAppDetail,
  getMyAppPage,
  getGoodAppPage,
  getUserPublicAppPage,
  deleteAppByAdmin,
  updateAppByAdmin,
  getAppPageByAdmin,
  getAppDetailByAdmin,
  deployApp,
  downloadAppCode,
  chatToGenCodeStream,
}

export default appApi
