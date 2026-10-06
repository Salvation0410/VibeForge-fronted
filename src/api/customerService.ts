import type { AxiosResponse } from 'axios'
import request from '@/request'
import type { BaseResponse } from '@/api/app'
import { apiTransformResponse } from '@/utils/http'
import {
  buildCustomerServiceKnowledgeUploadRequest,
  encodeCustomerServiceKnowledgeId,
} from '@/utils/customerService'

export type { BaseResponse } from '@/api/app'

export type LongValue = string | number
export type CustomerServiceKnowledgeId = LongValue

export interface CustomerServicePageResult<T> {
  pageNumber?: LongValue
  pageSize?: LongValue
  totalPage?: LongValue
  totalRow?: LongValue
  records: T[]
}

export interface CustomerServiceAskRequest {
  question: string
}

export interface CustomerServiceSource {
  documentId: LongValue
  documentVersion: LongValue
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
  fileSize: LongValue
  contentHash: string
  documentVersion: LongValue
  indexedVersion: LongValue
  etlVersion: LongValue
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
  documentVersion: LongValue
  etlVersion: LongValue
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
  signal?: AbortSignal,
): Promise<BaseResponse<CustomerServiceKnowledgeDocument>> {
  const uploadRequest = buildCustomerServiceKnowledgeUploadRequest(file, replacementId, signal)
  return request
    .post<BaseResponse<CustomerServiceKnowledgeDocument>>(
      '/admin/customer-service/knowledge/upload',
      uploadRequest.formData,
      {
        ...uploadRequest.config,
        transformResponse: apiTransformResponse,
      },
    )
    .then(unwrapResponse)
}

export function getCustomerServiceKnowledgePage(
  data: CustomerServiceKnowledgePageRequest,
  signal?: AbortSignal,
): Promise<BaseResponse<CustomerServicePageResult<CustomerServiceKnowledgeDocument>>> {
  return request
    .post<BaseResponse<CustomerServicePageResult<CustomerServiceKnowledgeDocument>>>(
      '/admin/customer-service/knowledge/page',
      data,
      {
        signal,
        transformResponse: apiTransformResponse,
      },
    )
    .then(unwrapResponse)
}

export function reindexCustomerServiceKnowledgeDocument(
  id: CustomerServiceKnowledgeId,
): Promise<BaseResponse<CustomerServiceKnowledgeDocument>> {
  const encodedId = encodeCustomerServiceKnowledgeId(id)
  return request
    .post<
      BaseResponse<CustomerServiceKnowledgeDocument>
    >(`/admin/customer-service/knowledge/${encodedId}:reindex`, undefined, { transformResponse: apiTransformResponse })
    .then(unwrapResponse)
}

export function enableCustomerServiceKnowledgeDocument(
  id: CustomerServiceKnowledgeId,
): Promise<BaseResponse<CustomerServiceKnowledgeDocument>> {
  const encodedId = encodeCustomerServiceKnowledgeId(id)
  return request
    .post<
      BaseResponse<CustomerServiceKnowledgeDocument>
    >(`/admin/customer-service/knowledge/${encodedId}:enable`, undefined, { transformResponse: apiTransformResponse })
    .then(unwrapResponse)
}

export function disableCustomerServiceKnowledgeDocument(
  id: CustomerServiceKnowledgeId,
): Promise<BaseResponse<CustomerServiceKnowledgeDocument>> {
  const encodedId = encodeCustomerServiceKnowledgeId(id)
  return request
    .post<
      BaseResponse<CustomerServiceKnowledgeDocument>
    >(`/admin/customer-service/knowledge/${encodedId}:disable`, undefined, { transformResponse: apiTransformResponse })
    .then(unwrapResponse)
}

export function deleteCustomerServiceKnowledgeDocument(
  id: CustomerServiceKnowledgeId,
): Promise<BaseResponse<boolean>> {
  const encodedId = encodeCustomerServiceKnowledgeId(id)
  return request
    .delete<BaseResponse<boolean>>(`/admin/customer-service/knowledge/${encodedId}`, {
      transformResponse: apiTransformResponse,
    })
    .then(unwrapResponse)
}

export function getCustomerServiceKnowledgeTasks(
  id: CustomerServiceKnowledgeId,
  limit = 20,
  signal?: AbortSignal,
): Promise<BaseResponse<CustomerServiceKnowledgeTask[]>> {
  const encodedId = encodeCustomerServiceKnowledgeId(id)
  return request
    .get<BaseResponse<CustomerServiceKnowledgeTask[]>>(
      `/admin/customer-service/knowledge/${encodedId}/tasks`,
      {
        params: { limit },
        signal,
        transformResponse: apiTransformResponse,
      },
    )
    .then(unwrapResponse)
}

export function rebuildCustomerServiceKnowledge(): Promise<BaseResponse<number>> {
  return request
    .post<BaseResponse<number>>('/admin/customer-service/knowledge/rebuild', undefined, {
      transformResponse: apiTransformResponse,
    })
    .then(unwrapResponse)
}

export function getCustomerServiceKnowledgeHealth(
  signal?: AbortSignal,
): Promise<BaseResponse<CustomerServiceKnowledgeHealth>> {
  return request
    .get<BaseResponse<CustomerServiceKnowledgeHealth>>('/admin/customer-service/knowledge/health', {
      signal,
      transformResponse: apiTransformResponse,
    })
    .then(unwrapResponse)
}
