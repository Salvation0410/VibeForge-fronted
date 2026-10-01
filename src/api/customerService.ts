import type { AxiosResponse } from 'axios'
import request from '@/request'
import type { BaseResponse } from '@/api/app'
import { apiTransformResponse } from '@/utils/http'

export type { BaseResponse } from '@/api/app'

export type CustomerServiceKnowledgeId = string | number

export interface CustomerServicePageResult<T> {
  pageNumber?: number
  pageSize?: number
  totalPage?: number
  totalRow?: number
  records: T[]
}

export interface CustomerServiceAskRequest {
  question: string
}

export interface CustomerServiceSource {
  documentId: string | number
  documentVersion: number
  documentName: string
  chunkId: string
  locator: string
  excerpt: string
}

export interface CustomerServiceAnswer {
  answered: boolean
  answer: string
  sources: CustomerServiceSource[]
}

export interface CustomerServiceKnowledgeDocument {
  id: CustomerServiceKnowledgeId
  name: string
  fileType: string
  fileSize: number
  contentHash: string
  documentVersion: number
  indexedVersion: number
  etlVersion: number
  chunkCount: number
  status: string
  lastErrorCode?: string | null
  createdBy: CustomerServiceKnowledgeId
  updatedBy: CustomerServiceKnowledgeId
  createTime: string
  updateTime: string
}

export interface CustomerServiceKnowledgeTask {
  id: CustomerServiceKnowledgeId
  documentId: CustomerServiceKnowledgeId
  documentVersion: number
  etlVersion: number
  operation: string
  status: string
  retryCount: number
  lastErrorCode?: string | null
  nextRetryTime: string
  createTime: string
  updateTime: string
}

export interface CustomerServiceKnowledgeHealth {
  enabled: boolean
  coordinator: boolean
  python: boolean
}

export interface CustomerServiceKnowledgePageRequest {
  pageNum: number
  pageSize: number
}

function unwrapResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
  return response.data
}

export function askCustomerService(
  question: string,
  signal?: AbortSignal,
): Promise<BaseResponse<CustomerServiceAnswer>> {
  const data: CustomerServiceAskRequest = { question }
  return request
    .post<BaseResponse<CustomerServiceAnswer>>('/customer-service/ask', data, {
      signal,
      transformResponse: apiTransformResponse,
    })
    .then(unwrapResponse)
}

export function uploadCustomerServiceKnowledgeDocument(
  file: File,
  replacementId?: CustomerServiceKnowledgeId,
): Promise<BaseResponse<CustomerServiceKnowledgeDocument>> {
  const formData = new FormData()
  formData.append('file', file)
  return request
    .post<BaseResponse<CustomerServiceKnowledgeDocument>>(
      '/admin/customer-service/knowledge/upload',
      formData,
      {
        params: replacementId === undefined ? undefined : { replacementId },
        transformResponse: apiTransformResponse,
      },
    )
    .then(unwrapResponse)
}

export function getCustomerServiceKnowledgePage(
  data: CustomerServiceKnowledgePageRequest,
): Promise<BaseResponse<CustomerServicePageResult<CustomerServiceKnowledgeDocument>>> {
  return request
    .post<
      BaseResponse<CustomerServicePageResult<CustomerServiceKnowledgeDocument>>
    >('/admin/customer-service/knowledge/page', data, { transformResponse: apiTransformResponse })
    .then(unwrapResponse)
}

export function reindexCustomerServiceKnowledgeDocument(
  id: CustomerServiceKnowledgeId,
): Promise<BaseResponse<CustomerServiceKnowledgeDocument>> {
  return request
    .post<
      BaseResponse<CustomerServiceKnowledgeDocument>
    >(`/admin/customer-service/knowledge/${id}:reindex`, undefined, { transformResponse: apiTransformResponse })
    .then(unwrapResponse)
}

export function enableCustomerServiceKnowledgeDocument(
  id: CustomerServiceKnowledgeId,
): Promise<BaseResponse<CustomerServiceKnowledgeDocument>> {
  return request
    .post<
      BaseResponse<CustomerServiceKnowledgeDocument>
    >(`/admin/customer-service/knowledge/${id}:enable`, undefined, { transformResponse: apiTransformResponse })
    .then(unwrapResponse)
}

export function disableCustomerServiceKnowledgeDocument(
  id: CustomerServiceKnowledgeId,
): Promise<BaseResponse<CustomerServiceKnowledgeDocument>> {
  return request
    .post<
      BaseResponse<CustomerServiceKnowledgeDocument>
    >(`/admin/customer-service/knowledge/${id}:disable`, undefined, { transformResponse: apiTransformResponse })
    .then(unwrapResponse)
}

export function deleteCustomerServiceKnowledgeDocument(
  id: CustomerServiceKnowledgeId,
): Promise<BaseResponse<boolean>> {
  return request
    .delete<BaseResponse<boolean>>(`/admin/customer-service/knowledge/${id}`, {
      transformResponse: apiTransformResponse,
    })
    .then(unwrapResponse)
}

export function getCustomerServiceKnowledgeTasks(
  id: CustomerServiceKnowledgeId,
  limit = 20,
): Promise<BaseResponse<CustomerServiceKnowledgeTask[]>> {
  return request
    .get<
      BaseResponse<CustomerServiceKnowledgeTask[]>
    >(`/admin/customer-service/knowledge/${id}/tasks`, { params: { limit }, transformResponse: apiTransformResponse })
    .then(unwrapResponse)
}

export function rebuildCustomerServiceKnowledge(): Promise<BaseResponse<number>> {
  return request
    .post<BaseResponse<number>>('/admin/customer-service/knowledge/rebuild', undefined, {
      transformResponse: apiTransformResponse,
    })
    .then(unwrapResponse)
}

export function getCustomerServiceKnowledgeHealth(): Promise<
  BaseResponse<CustomerServiceKnowledgeHealth>
> {
  return request
    .get<BaseResponse<CustomerServiceKnowledgeHealth>>('/admin/customer-service/knowledge/health', {
      transformResponse: apiTransformResponse,
    })
    .then(unwrapResponse)
}
