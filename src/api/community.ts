import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { apiTransformResponse } from '@/utils/http'
import type { SysUserVO } from './sysUserApi'

export interface BaseResponse<T> {
  code: number
  data: T
  message: string
}

export type CommunityId = number | string

export interface CursorPage<T> {
  records: T[]
  nextCursor?: string
  hasMore: boolean
}

export interface PageResult<T> {
  pageNumber?: number
  pageSize?: number
  totalPage?: number
  totalRow?: number
  records: T[]
}

export interface CommunityTagVO {
  id?: CommunityId
  name?: string
  description?: string
  sortOrder?: number
  status?: number
}

export interface CommunityPostImageVO {
  id?: CommunityId
  imageUrl?: string
  sortOrder?: number
}

export interface CommunityPostVO {
  id?: CommunityId
  title?: string
  content?: string
  tagId?: CommunityId
  userId?: CommunityId
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  likeCount?: number
  commentCount?: number
  imageCount?: number
  isPinned?: number
  pinnedTime?: string
  rejectReason?: string
  createTime?: string
  updateTime?: string
  tag?: CommunityTagVO
  user?: SysUserVO
  images?: CommunityPostImageVO[]
  liked?: boolean
}

export interface CommunityCommentVO {
  id?: CommunityId
  postId?: CommunityId
  userId?: CommunityId
  parentId?: CommunityId
  rootId?: CommunityId
  replyUserId?: CommunityId
  depth?: number
  path?: string
  content?: string
  status?: 'APPROVED' | 'REJECTED'
  likeCount?: number
  replyCount?: number
  reviewerId?: CommunityId
  reviewTime?: string
  rejectReason?: string
  createTime?: string
  user?: SysUserVO
  replyUser?: SysUserVO
  liked?: boolean
}

export interface CommunityLikeResultVO {
  liked?: boolean
  likeCount?: number
}

export interface CommunityTagSaveRequest {
  id?: CommunityId
  name: string
  description?: string
  sortOrder?: number
  status?: number
}

export interface CommunityPostAddRequest {
  title: string
  content: string
  tagId: CommunityId
}

export interface CommunityPostQueryRequest {
  pageSize?: number
  cursor?: string
  keyword?: string
  tagId?: CommunityId
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  sortType?: 'latest' | 'hot'
}

export interface CommunityPostAdminQueryRequest {
  pageNum?: number
  pageSize?: number
  sortField?: 'createTime' | 'likeCount' | 'commentCount' | 'id' | 'pinnedTime'
  sortOrder?: 'ascend' | 'descend'
  keyword?: string
  tagId?: CommunityId
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  sortType?: 'latest' | 'hot'
}

export interface CommunityPostReviewRequest {
  postId: CommunityId
  status: 'APPROVED' | 'REJECTED'
  rejectReason?: string
}

export interface CommunityPostPinRequest {
  postId: CommunityId
  pinned: boolean
}

export interface CommunityCommentAddRequest {
  postId: CommunityId
  parentId?: CommunityId
  content: string
}

export interface CommunityCommentQueryRequest {
  postId: CommunityId
  parentId?: CommunityId
  pageSize?: number
  cursor?: string
  sortType?: 'latest' | 'hot'
}

export interface CommunityCommentAdminQueryRequest {
  pageNum?: number
  pageSize?: number
  sortField?: 'createTime' | 'likeCount' | 'replyCount' | 'depth' | 'id'
  sortOrder?: 'ascend' | 'descend'
  postId?: CommunityId
  parentId?: CommunityId
  rootId?: CommunityId
  userId?: CommunityId
  status?: 'APPROVED' | 'REJECTED'
  keyword?: string
}

export interface CommunityCommentReviewRequest {
  commentId: CommunityId
  status: 'APPROVED' | 'REJECTED'
  rejectReason?: string
}

const communityRequest = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  transformResponse: apiTransformResponse,
})

function unwrapResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
  return response.data
}

type FormDataValue = string | number | boolean | Blob | File | null | undefined

function buildPostFormData(data: CommunityPostAddRequest, imageFiles?: Array<File | Blob>): FormData {
  const formData = new FormData()
  Object.entries(data as unknown as Record<string, FormDataValue>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (value instanceof Blob) {
        formData.append(key, value)
        return
      }
      formData.append(key, String(value))
    }
  })
  imageFiles?.forEach((file) => {
    if (file) {
      formData.append('imageFiles', file)
    }
  })
  return formData
}

export function getCommunityTagList(): Promise<BaseResponse<CommunityTagVO[]>> {
  return communityRequest.get<BaseResponse<CommunityTagVO[]>>('/community/tags').then(unwrapResponse)
}

export function getAllCommunityTagList(): Promise<BaseResponse<CommunityTagVO[]>> {
  return communityRequest.get<BaseResponse<CommunityTagVO[]>>('/community/tags/admin/all').then(unwrapResponse)
}

export function saveCommunityTag(
  data: CommunityTagSaveRequest,
): Promise<BaseResponse<boolean>> {
  return communityRequest
    .post<BaseResponse<boolean>>('/community/tags/admin/save', data)
    .then(unwrapResponse)
}

export function deleteCommunityTag(id: CommunityId): Promise<BaseResponse<boolean>> {
  return communityRequest
    .delete<BaseResponse<boolean>>(`/community/tags/admin/${id}`)
    .then(unwrapResponse)
}

export function createCommunityPost(
  data: CommunityPostAddRequest,
  imageFiles?: Array<File | Blob>,
): Promise<BaseResponse<CommunityId>> {
  const formData = buildPostFormData(data, imageFiles)
  return communityRequest
    .post<BaseResponse<CommunityId>>('/community/posts/add', formData)
    .then(unwrapResponse)
}

export function getCommunityPostPage(
  params?: CommunityPostQueryRequest,
): Promise<BaseResponse<CursorPage<CommunityPostVO>>> {
  return communityRequest
    .get<BaseResponse<CursorPage<CommunityPostVO>>>('/community/posts/page', { params })
    .then(unwrapResponse)
}

export function getCommunityPostDetail(
  id: CommunityId,
): Promise<BaseResponse<CommunityPostVO>> {
  return communityRequest
    .get<BaseResponse<CommunityPostVO>>(`/community/posts/${id}`)
    .then(unwrapResponse)
}

export function getMyCommunityPostPage(
  params?: CommunityPostQueryRequest,
): Promise<BaseResponse<CursorPage<CommunityPostVO>>> {
  return communityRequest
    .get<BaseResponse<CursorPage<CommunityPostVO>>>('/community/posts/my/page', { params })
    .then(unwrapResponse)
}

export function getUserCommunityPostPage(
  userId: CommunityId,
  params?: CommunityPostQueryRequest,
): Promise<BaseResponse<CursorPage<CommunityPostVO>>> {
  return communityRequest
    .get<BaseResponse<CursorPage<CommunityPostVO>>>(`/community/posts/user/${userId}/page`, { params })
    .then(unwrapResponse)
}

export function getCommunityPostPageByAdmin(
  data: CommunityPostAdminQueryRequest,
): Promise<BaseResponse<PageResult<CommunityPostVO>>> {
  return communityRequest
    .post<BaseResponse<PageResult<CommunityPostVO>>>('/community/posts/admin/list/page/vo', data)
    .then(unwrapResponse)
}

export function toggleCommunityPostLike(
  id: CommunityId,
): Promise<BaseResponse<CommunityLikeResultVO>> {
  return communityRequest
    .post<BaseResponse<CommunityLikeResultVO>>(`/community/posts/${id}/like`)
    .then(unwrapResponse)
}

export function reviewCommunityPost(
  data: CommunityPostReviewRequest,
): Promise<BaseResponse<boolean>> {
  return communityRequest
    .post<BaseResponse<boolean>>('/community/posts/admin/review', data)
    .then(unwrapResponse)
}

export function pinCommunityPost(
  data: CommunityPostPinRequest,
): Promise<BaseResponse<boolean>> {
  return communityRequest
    .post<BaseResponse<boolean>>('/community/posts/admin/pin', data)
    .then(unwrapResponse)
}

export function createCommunityComment(
  data: CommunityCommentAddRequest,
): Promise<BaseResponse<CommunityId>> {
  return communityRequest
    .post<BaseResponse<CommunityId>>('/community/comments/add', data)
    .then(unwrapResponse)
}

export function getCommunityCommentPage(
  params: CommunityCommentQueryRequest,
): Promise<BaseResponse<CursorPage<CommunityCommentVO>>> {
  return communityRequest
    .get<BaseResponse<CursorPage<CommunityCommentVO>>>('/community/comments/page', { params })
    .then(unwrapResponse)
}

export function toggleCommunityCommentLike(
  id: CommunityId,
): Promise<BaseResponse<CommunityLikeResultVO>> {
  return communityRequest
    .post<BaseResponse<CommunityLikeResultVO>>(`/community/comments/${id}/like`)
    .then(unwrapResponse)
}

export function getCommunityCommentPageByAdmin(
  data: CommunityCommentAdminQueryRequest,
): Promise<BaseResponse<PageResult<CommunityCommentVO>>> {
  return communityRequest
    .post<BaseResponse<PageResult<CommunityCommentVO>>>('/community/comments/admin/list/page/vo', data)
    .then(unwrapResponse)
}

export function getCommunityCommentDetailByAdmin(
  id: CommunityId,
): Promise<BaseResponse<CommunityCommentVO>> {
  return communityRequest
    .get<BaseResponse<CommunityCommentVO>>(`/community/comments/admin/${id}`)
    .then(unwrapResponse)
}

export function deleteCommunityCommentByAdmin(
  id: CommunityId,
): Promise<BaseResponse<boolean>> {
  return communityRequest
    .delete<BaseResponse<boolean>>(`/community/comments/admin/${id}`)
    .then(unwrapResponse)
}

export function reviewCommunityComment(
  data: CommunityCommentReviewRequest,
): Promise<BaseResponse<boolean>> {
  return communityRequest
    .post<BaseResponse<boolean>>('/community/comments/admin/review', data)
    .then(unwrapResponse)
}

const communityApi = {
  getCommunityTagList,
  getAllCommunityTagList,
  saveCommunityTag,
  deleteCommunityTag,
  createCommunityPost,
  getCommunityPostPage,
  getMyCommunityPostPage,
  getUserCommunityPostPage,
  getCommunityPostPageByAdmin,
  getCommunityPostDetail,
  toggleCommunityPostLike,
  reviewCommunityPost,
  pinCommunityPost,
  createCommunityComment,
  getCommunityCommentPage,
  toggleCommunityCommentLike,
  getCommunityCommentPageByAdmin,
  getCommunityCommentDetailByAdmin,
  deleteCommunityCommentByAdmin,
  reviewCommunityComment,
}

export default communityApi
