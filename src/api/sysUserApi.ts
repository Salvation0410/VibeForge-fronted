import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import request from '@/request'

export const userApiClient: AxiosInstance = request

export interface BaseResponse<T> {
  code: number
  data: T
  message: string
}

export interface PageResult<T> {
  pageNumber: number
  pageSize: number
  totalPage: number
  totalRow: number
  records: T[]
}

export interface PageRequest {
  pageNum?: number
  pageSize?: number
  sortField?: string
  sortOrder?: string
}

export type SnowflakeId = string
export type RequestId = string | number

export interface SysUserRegisterRequest {
  account?: string
  email?: string
  password: string
  confirmPassword: string
  nickname?: string
  userProfile?: string
  userRole?: string
}

export interface SysUserLoginRequest {
  account?: string
  email?: string
  password: string
}

export interface SysUser {
  id?: SnowflakeId
  account?: string
  email?: string
  passwordHash?: string
  passwordSalt?: string
  nickname?: string
  avatarUrl?: string
  userProfile?: string
  userRole?: string
  registerType?: number
  status?: number
  emailVerified?: number
  lastLoginTime?: string
  lastLoginIp?: string
  deleted?: number
  createTime?: string
  updateTime?: string
}

export interface SysUserVO {
  id: SnowflakeId
  account?: string
  email?: string
  nickname?: string
  avatarUrl?: string
  userProfile?: string
  userRole?: string
  registerType?: number
  status?: number
  lastLoginTime?: string
}

export interface LoginUserVO {
  user: SysUserVO
}

export function adminCreateUser(
  data: SysUserRegisterRequest,
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.post<BaseResponse<SysUser>>('/users/admin', data, config)
}

export function registerUser(
  data: SysUserRegisterRequest,
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.post<BaseResponse<SysUser>>('/users', data, config)
}

export function loginUser(
  data: SysUserLoginRequest,
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.post<BaseResponse<LoginUserVO>>('/users/login', data, config)
}

export function getLoginUser(
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.get<BaseResponse<LoginUserVO>>('/users/login', config)
}

export function logoutUser(
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.delete<BaseResponse<boolean>>('/users/login', config)
}

export function adminGetUserById(
  id: RequestId,
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.get<BaseResponse<SysUser>>(`/users/${id}`, config)
}

export function getUserVoById(
  id: RequestId,
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.get<BaseResponse<SysUserVO>>(`/users/${id}/vo`, config)
}

export function pageUsers(
  params?: PageRequest,
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.get<BaseResponse<PageResult<SysUserVO>>>('/users/page', {
    ...config,
    params,
  })
}

export function updateUser(
  id: RequestId,
  data: Partial<SysUser>,
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.put<BaseResponse<boolean>>(`/users/${id}`, data, config)
}

export function deleteUser(
  id: RequestId,
  config?: AxiosRequestConfig,
  client: AxiosInstance = userApiClient,
) {
  return client.delete<BaseResponse<boolean>>(`/users/${id}`, config)
}

export const sysUserApi = {
  adminCreateUser,
  registerUser,
  loginUser,
  getLoginUser,
  logoutUser,
  adminGetUserById,
  getUserVoById,
  pageUsers,
  updateUser,
  deleteUser,
}

export default sysUserApi
