import axios from 'axios'
import type { AxiosResponse } from 'axios'

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

export interface SysUser {
  id?: number
  account?: string
  email?: string
  nickname?: string
  avatarUrl?: string
  userProfile?: string
  userRole?: string
  registerType?: number
  status?: number
  emailVerified?: number
  lastLoginTime?: string
  lastLoginIp?: string
  createTime?: string
  updateTime?: string
}

export interface SysUserVO {
  id?: number
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
  user?: SysUserVO
}

export interface SysUserRegisterRequest {
  account?: string
  email?: string
  password: string
  confirmPassword: string
  nickname?: string
  avatarUrl?: string
  userProfile?: string
  userRole?: string
}

export interface SysUserLoginRequest {
  account?: string
  email?: string
  password: string
}

export interface SysUserUpdateRequest {
  account?: string
  email?: string
  nickname?: string
  avatarUrl?: string
  userProfile?: string
  userRole?: string
  status?: number
}

const userRequest = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
})

function unwrapResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
  return response.data
}

type FormDataValue = string | number | boolean | Blob | File | null | undefined

function buildUserFormData(data: object, avatarFile?: File | Blob): FormData {
  const formData = new FormData()
  Object.entries(data as Record<string, FormDataValue>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof Blob) {
        formData.append(key, value)
        return
      }
      formData.append(key, String(value))
    }
  })
  if (avatarFile) {
    formData.append('avatarFile', avatarFile)
  }
  return formData
}

export function registerUser(data: SysUserRegisterRequest): Promise<BaseResponse<SysUser>> {
  return userRequest.post<BaseResponse<SysUser>>('/users', data).then(unwrapResponse)
}

export function registerUserWithAvatar(
  data: SysUserRegisterRequest,
  avatarFile?: File | Blob,
): Promise<BaseResponse<SysUser>> {
  const formData = buildUserFormData(data, avatarFile)
  return userRequest.post<BaseResponse<SysUser>>('/users', formData).then(unwrapResponse)
}

export function createUserByAdmin(data: SysUserRegisterRequest): Promise<BaseResponse<SysUser>> {
  return userRequest.post<BaseResponse<SysUser>>('/users/admin', data).then(unwrapResponse)
}

export function createUserByAdminWithAvatar(
  data: SysUserRegisterRequest,
  avatarFile?: File | Blob,
): Promise<BaseResponse<SysUser>> {
  const formData = buildUserFormData(data, avatarFile)
  return userRequest.post<BaseResponse<SysUser>>('/users/admin', formData).then(unwrapResponse)
}

export function loginUser(data: SysUserLoginRequest): Promise<BaseResponse<LoginUserVO>> {
  return userRequest.post<BaseResponse<LoginUserVO>>('/users/login', data).then(unwrapResponse)
}

export function getLoginUser(): Promise<BaseResponse<LoginUserVO>> {
  return userRequest.get<BaseResponse<LoginUserVO>>('/users/login').then(unwrapResponse)
}

export function logoutUser(): Promise<BaseResponse<boolean>> {
  return userRequest.delete<BaseResponse<boolean>>('/users/login').then(unwrapResponse)
}

export function getLoginUserDetail(): Promise<BaseResponse<SysUser>> {
  return userRequest.get<BaseResponse<SysUser>>('/users/login/detail').then(unwrapResponse)
}

export function getUserById(id: number): Promise<BaseResponse<SysUser>> {
  return userRequest.get<BaseResponse<SysUser>>(`/users/${id}`).then(unwrapResponse)
}

export function getUserVoById(id: number): Promise<BaseResponse<SysUserVO>> {
  return userRequest.get<BaseResponse<SysUserVO>>(`/users/${id}/vo`).then(unwrapResponse)
}

export function getUserPage(params: PageRequest): Promise<BaseResponse<PageResult<SysUserVO>>> {
  return userRequest
    .get<BaseResponse<PageResult<SysUserVO>>>('/users/page', { params })
    .then(unwrapResponse)
}

export function updateUser(id: number, data: SysUserUpdateRequest): Promise<BaseResponse<boolean>> {
  return userRequest.put<BaseResponse<boolean>>(`/users/${id}`, data).then(unwrapResponse)
}

export function updateUserWithAvatar(
  id: number,
  data: SysUserUpdateRequest,
  avatarFile?: File | Blob,
): Promise<BaseResponse<boolean>> {
  const formData = buildUserFormData(data, avatarFile)
  return userRequest.put<BaseResponse<boolean>>(`/users/${id}`, formData).then(unwrapResponse)
}

export function deleteUser(id: number): Promise<BaseResponse<boolean>> {
  return userRequest.delete<BaseResponse<boolean>>(`/users/${id}`).then(unwrapResponse)
}

const userApi = {
  registerUser,
  registerUserWithAvatar,
  createUserByAdmin,
  createUserByAdminWithAvatar,
  loginUser,
  getLoginUser,
  logoutUser,
  getLoginUserDetail,
  getUserById,
  getUserVoById,
  getUserPage,
  updateUser,
  updateUserWithAvatar,
  deleteUser,
}

export default userApi
