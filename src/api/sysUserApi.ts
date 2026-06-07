import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { apiTransformResponse } from '@/utils/http'

/**
 * 通用接口响应结构
 */
export interface BaseResponse<T> {
  code: number
  data: T
  message: string
}

export type UserId = number | string

/**
 * 通用分页请求参数
 */
export interface PageRequest {
  pageNum?: number
  pageSize?: number
  sortField?: string
  sortOrder?: string
}

/**
 * 通用分页返回结构
 */
export interface PageResult<T> {
  pageNumber?: number
  pageSize?: number
  totalPage?: number
  totalRow?: number
  records: T[]
}

/**
 * 用户完整信息
 */
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

/**
 * 用户脱敏信息
 */
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
  emailVerified?: number
  lastLoginTime?: string
}

/**
 * 登录用户视图
 */
export interface LoginUserVO {
  user?: SysUserVO
}

/**
 * 邮箱验证码发送请求
 */
export interface UserEmailCodeSendRequest {
  email: string
}

/**
 * 用户注册请求
 */
export interface SysUserRegisterRequest {
  account?: string
  email?: string
  password: string
  confirmPassword: string
  nickname?: string
  avatarUrl?: string
  userProfile?: string
  userRole?: string
  emailCode?: string
}

/**
 * 用户登录请求
 */
export interface SysUserLoginRequest {
  account?: string
  email?: string
  password: string
  captchaCode: string
}

/**
 * 用户更新请求
 */
export interface SysUserUpdateRequest {
  account?: string
  email?: string
  nickname?: string
  avatarUrl?: string
  userProfile?: string
  userRole?: string
  status?: number
}

/**
 * 登录图形验证码返回结构
 */
export interface LoginCaptchaVO {
  captchaImage: string
  expireSeconds: number
}

/**
 * 用户模块请求实例
 */
const userRequest = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  transformResponse: apiTransformResponse,
})

/**
 * 解包统一响应
 *
 * @param response Axios 响应
 * @returns 业务响应体
 */
function unwrapResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
  return response.data
}

/**
 * FormData 支持的字段类型
 */
type FormDataValue = string | number | boolean | Blob | File | null | undefined

/**
 * 构造用户模块 multipart/form-data 请求体
 *
 * @param data 表单字段
 * @param avatarFile 头像文件
 * @returns FormData 对象
 */
function buildUserFormData(data: object, avatarFile?: File | Blob): FormData {
  const formData = new FormData()
  Object.entries(data as Record<string, FormDataValue>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
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

/**
 * 发送邮箱注册验证码
 *
 * @param data 邮箱参数
 * @returns 发送结果
 */
export function sendRegisterEmailCode(
  data: UserEmailCodeSendRequest,
): Promise<BaseResponse<boolean>> {
  return userRequest
    .post<BaseResponse<boolean>>('/users/register/email/code', data)
    .then(unwrapResponse)
}

/**
 * 获取登录图形验证码
 *
 * @returns 验证码图片和有效期
 */
export function getLoginCaptcha(): Promise<BaseResponse<LoginCaptchaVO>> {
  return userRequest.get<BaseResponse<LoginCaptchaVO>>('/users/login/captcha').then(unwrapResponse)
}

/**
 * 普通注册
 *
 * @param data 注册参数
 * @returns 注册后的用户信息
 */
export function registerUser(data: SysUserRegisterRequest): Promise<BaseResponse<SysUser>> {
  return userRequest.post<BaseResponse<SysUser>>('/users', data).then(unwrapResponse)
}

/**
 * 带头像注册
 *
 * 当前后端该接口未正式启用，但保留给表单上传场景使用。
 *
 * @param data 注册参数
 * @param avatarFile 头像文件
 * @returns 注册后的用户信息
 */
export function registerUserWithAvatar(
  data: SysUserRegisterRequest,
  avatarFile?: File | Blob,
): Promise<BaseResponse<SysUser>> {
  const formData = buildUserFormData(data, avatarFile)
  return userRequest.post<BaseResponse<SysUser>>('/users', formData).then(unwrapResponse)
}

/**
 * 管理员创建用户
 *
 * 当前后端管理员创建用户走 multipart 接口，此方法保留兼容旧调用。
 *
 * @param data 创建参数
 * @returns 创建后的用户信息
 */
export function createUserByAdmin(data: SysUserRegisterRequest): Promise<BaseResponse<SysUser>> {
  return userRequest.post<BaseResponse<SysUser>>('/users/admin', data).then(unwrapResponse)
}

/**
 * 管理员创建用户并上传头像
 *
 * @param data 创建参数
 * @param avatarFile 头像文件
 * @returns 创建后的用户信息
 */
export function createUserByAdminWithAvatar(
  data: SysUserRegisterRequest,
  avatarFile?: File | Blob,
): Promise<BaseResponse<SysUser>> {
  const formData = buildUserFormData(data, avatarFile)
  return userRequest.post<BaseResponse<SysUser>>('/users/admin', formData).then(unwrapResponse)
}

/**
 * 用户登录
 *
 * 支持账号登录和邮箱登录，二者都必须带图形验证码。
 *
 * @param data 登录参数
 * @returns 登录用户信息
 */
export function loginUser(data: SysUserLoginRequest): Promise<BaseResponse<LoginUserVO>> {
  return userRequest.post<BaseResponse<LoginUserVO>>('/users/login', data).then(unwrapResponse)
}

/**
 * 获取当前登录用户
 *
 * @returns 当前登录用户的脱敏信息
 */
export function getLoginUser(): Promise<BaseResponse<LoginUserVO>> {
  return userRequest.get<BaseResponse<LoginUserVO>>('/users/login').then(unwrapResponse)
}

/**
 * 用户退出登录
 *
 * @returns 是否退出成功
 */
export function logoutUser(): Promise<BaseResponse<boolean>> {
  return userRequest.delete<BaseResponse<boolean>>('/users/login').then(unwrapResponse)
}

/**
 * 获取当前登录用户完整信息
 *
 * @returns 当前登录用户完整信息
 */
export function getLoginUserDetail(): Promise<BaseResponse<SysUser>> {
  return userRequest.get<BaseResponse<SysUser>>('/users/login/detail').then(unwrapResponse)
}

/**
 * 根据用户 id 获取完整信息
 *
 * @param id 用户 id
 * @returns 用户完整信息
 */
export function getUserById(id: UserId): Promise<BaseResponse<SysUser>> {
  return userRequest.get<BaseResponse<SysUser>>(`/users/${id}`).then(unwrapResponse)
}

/**
 * 根据用户 id 获取脱敏信息
 *
 * @param id 用户 id
 * @returns 用户脱敏信息
 */
export function getUserVoById(id: UserId): Promise<BaseResponse<SysUserVO>> {
  return userRequest.get<BaseResponse<SysUserVO>>(`/users/${id}/vo`).then(unwrapResponse)
}

/**
 * 分页获取用户列表
 *
 * @param params 分页参数
 * @returns 用户分页结果
 */
export function getUserPage(params: PageRequest): Promise<BaseResponse<PageResult<SysUserVO>>> {
  return userRequest
    .get<BaseResponse<PageResult<SysUserVO>>>('/users/page', { params })
    .then(unwrapResponse)
}

/**
 * 管理员更新用户
 *
 * 当前后端更新用户接口使用 multipart/form-data，这个 JSON 版本保留兼容旧调用。
 *
 * @param id 用户 id
 * @param data 更新参数
 * @returns 是否更新成功
 */
export function updateUser(
  id: number,
  data: SysUserUpdateRequest,
): Promise<BaseResponse<boolean>> {
  return userRequest.put<BaseResponse<boolean>>(`/users/${id}`, data).then(unwrapResponse)
}

/**
 * 管理员更新用户并上传头像
 *
 * @param id 用户 id
 * @param data 更新参数
 * @param avatarFile 头像文件
 * @returns 是否更新成功
 */
export function updateUserWithAvatar(
  id: number,
  data: SysUserUpdateRequest,
  avatarFile?: File | Blob,
): Promise<BaseResponse<boolean>> {
  const formData = buildUserFormData(data, avatarFile)
  return userRequest.put<BaseResponse<boolean>>(`/users/${id}`, formData).then(unwrapResponse)
}

export function updateCurrentUserProfileWithAvatar(
  data: SysUserUpdateRequest,
  avatarFile?: File | Blob,
): Promise<BaseResponse<boolean>> {
  const formData = buildUserFormData(data, avatarFile)
  return userRequest.put<BaseResponse<boolean>>('/users/profile', formData).then(unwrapResponse)
}

/**
 * 删除用户
 *
 * @param id 用户 id
 * @returns 是否删除成功
 */
export function deleteUser(id: number): Promise<BaseResponse<boolean>> {
  return userRequest.delete<BaseResponse<boolean>>(`/users/${id}`).then(unwrapResponse)
}

/**
 * 用户模块接口集合
 */
const userApi = {
  sendRegisterEmailCode,
  getLoginCaptcha,
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
  updateCurrentUserProfileWithAvatar,
  deleteUser,
}

export default userApi
