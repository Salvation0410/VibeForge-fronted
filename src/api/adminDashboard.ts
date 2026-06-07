import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { apiTransformResponse } from '@/utils/http'
import type { BaseResponse } from '@/api/app'

export interface DashboardMetricItem {
  label: string
  value: number
  hint?: string
}

export interface DashboardTrendData {
  dates: string[]
  users: number[]
  apps: number[]
  posts: number[]
  comments: number[]
  chats: number[]
}

export interface DashboardChartItem {
  name: string
  value: number
}

export interface AdminDashboardVO {
  metrics: DashboardMetricItem[]
  trend: DashboardTrendData
  postStatusDistribution: DashboardChartItem[]
  appTypeDistribution: DashboardChartItem[]
}

const dashboardRequest = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  transformResponse: apiTransformResponse,
})

function unwrapResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
  return response.data
}

export function getAdminDashboardOverview(): Promise<BaseResponse<AdminDashboardVO>> {
  return dashboardRequest
    .get<BaseResponse<AdminDashboardVO>>('/admin/dashboard/overview')
    .then(unwrapResponse)
}
