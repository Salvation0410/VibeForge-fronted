import type { AxiosResponse } from 'axios'
import request from '@/request'

export interface BaseResponse<T> {
  code: number
  data: T
  message: string
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

function unwrapResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
  return response.data
}

export function askCustomerService(
  question: string,
  signal?: AbortSignal,
): Promise<BaseResponse<CustomerServiceAnswer>> {
  const data: CustomerServiceAskRequest = { question }
  return request
    .post<BaseResponse<CustomerServiceAnswer>>('/customer-service/ask', data, { signal })
    .then(unwrapResponse)
}
