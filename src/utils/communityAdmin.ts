import type { CommunityCommentVO, CommunityPostVO, CommunityTagVO } from '@/api/community'

export const COMMUNITY_POST_STATUS_OPTIONS = [
  { label: '全部状态', value: 'ALL' },
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已驳回', value: 'REJECTED' },
] as const

export const COMMUNITY_TAG_STATUS_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
] as const

export const COMMUNITY_COMMENT_SORT_OPTIONS = [
  { label: '创建时间', value: 'createTime' },
  { label: '点赞数', value: 'likeCount' },
  { label: '回复数', value: 'replyCount' },
  { label: '层级深度', value: 'depth' },
  { label: 'ID', value: 'id' },
] as const

export function getCommunityPostStatusText(status?: CommunityPostVO['status']) {
  if (status === 'PENDING') {
    return '待审核'
  }
  if (status === 'REJECTED') {
    return '已驳回'
  }
  return '已通过'
}

export function getCommunityPostStatusColor(status?: CommunityPostVO['status']) {
  if (status === 'PENDING') {
    return 'orange'
  }
  if (status === 'REJECTED') {
    return 'red'
  }
  return 'green'
}

export function getCommunityTagStatusText(status?: CommunityTagVO['status']) {
  return Number(status ?? 0) === 1 ? '启用' : '停用'
}

export function getCommunityTagStatusColor(status?: CommunityTagVO['status']) {
  return Number(status ?? 0) === 1 ? 'green' : 'default'
}

export function buildCommunityAuthorName(
  entity?: Pick<CommunityPostVO, 'userId' | 'user'> | Pick<CommunityCommentVO, 'userId' | 'user'>,
) {
  return (
    entity?.user?.nickname ||
    entity?.user?.account ||
    (entity?.userId ? `用户 ${entity.userId}` : '匿名用户')
  )
}
