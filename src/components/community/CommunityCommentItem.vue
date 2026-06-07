<template>
  <div class="comment-item" :class="{ reply: isReply }">
    <a-avatar
      :src="comment.user?.avatarUrl"
      class="avatar"
      :class="{ clickable: canComment }"
      @click="replyToAuthor"
    >
      {{ authorName.slice(0, 1) }}
    </a-avatar>

    <div class="comment-body">
      <div class="comment-head" :class="{ clickable: authorClickable }" @click="openAuthorProfile">
        <strong>{{ authorName }}</strong>
        <span>{{ formatTime(comment.createTime) }}</span>
      </div>

      <p class="content">
        <button v-if="isReply && replyUserName" class="reply-target" type="button" @click="openReplyUserProfile">
          回复 @{{ replyUserName }}
        </button>
        {{ comment.content }}
      </p>

      <div class="comment-actions">
        <a-button
          type="text"
          size="small"
          :class="{ liked: comment.liked }"
          :loading="likeLoading"
          @click="emit('like', comment)"
        >
          {{ comment.liked ? '已赞' : '点赞' }} {{ comment.likeCount || 0 }}
        </a-button>
        <a-button type="text" size="small" @click="toggleReplyBox">
          回复 {{ comment.replyCount || '' }}
        </a-button>
        <a-button
          v-if="!isReply && Number(comment.replyCount || 0) > 0"
          type="text"
          size="small"
          @click="replyListVisible = !replyListVisible"
        >
          {{ replyListVisible ? '收起回复' : '查看回复' }}
        </a-button>
      </div>

      <div v-if="replyBoxVisible" class="reply-box">
        <a-textarea
          v-model:value="replyContent"
          :auto-size="{ minRows: 2, maxRows: 5 }"
          :maxlength="800"
          placeholder="写下你的回复"
        />
        <div class="reply-actions">
          <a-button size="small" @click="replyBoxVisible = false">取消</a-button>
          <a-button size="small" type="primary" :loading="replySubmitting" @click="submitReply">
            发布回复
          </a-button>
        </div>
      </div>

      <CommunityCommentList
        v-if="!isReply && replyListVisible"
        :post-id="postId"
        :parent-id="comment.id"
        :is-reply-list="true"
        @require-login="emit('require-login')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  createCommunityComment,
  type CommunityCommentVO,
  type CommunityId,
} from '@/api/community'
import { isSuccessCode } from '@/utils/appUtils'

const CommunityCommentList = defineAsyncComponent(
  () => import('@/components/community/CommunityCommentList.vue'),
)

const props = defineProps<{
  comment: CommunityCommentVO
  postId: CommunityId
  isReply?: boolean
  likeLoading?: boolean
  canComment?: boolean
}>()

const emit = defineEmits<{
  like: [comment: CommunityCommentVO]
  replied: []
  'require-login': []
}>()

const router = useRouter()
const replyBoxVisible = ref(false)
const replyListVisible = ref(false)
const replyContent = ref('')
const replySubmitting = ref(false)

const authorClickable = computed(() => Boolean(props.comment.userId))
const authorName = computed(
  () => props.comment.user?.nickname || props.comment.user?.account || `用户 ${props.comment.userId || ''}`.trim(),
)
const replyUserName = computed(() => props.comment.replyUser?.nickname || props.comment.replyUser?.account || '')

function openAuthorProfile() {
  if (!props.comment.userId) {
    return
  }
  void router.push(`/profile/${props.comment.userId}`)
}

function toggleReplyBox() {
  if (!props.canComment) {
    emit('require-login')
    return
  }
  replyBoxVisible.value = !replyBoxVisible.value
}

function replyToAuthor() {
  if (!props.canComment) {
    emit('require-login')
    return
  }
  replyBoxVisible.value = true
}

function openReplyUserProfile() {
  if (!props.comment.replyUserId) {
    return
  }
  void router.push(`/profile/${props.comment.replyUserId}`)
}

async function submitReply() {
  const content = replyContent.value.trim()
  if (!content) {
    message.warning('请输入回复内容')
    return
  }

  replySubmitting.value = true
  try {
    const res = await createCommunityComment({
      postId: props.postId,
      parentId: props.comment.id || 0,
      content,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '回复发布失败')
    }
    message.success('回复已发布')
    replyContent.value = ''
    replyBoxVisible.value = false
    replyListVisible.value = true
    emit('replied')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '回复发布失败')
  } finally {
    replySubmitting.value = false
  }
}

function formatTime(value?: string) {
  if (!value) {
    return '刚刚'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<style scoped>
.comment-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
}

.comment-item.reply {
  grid-template-columns: 32px minmax(0, 1fr);
}

.avatar {
  background: linear-gradient(145deg, #1ca9c6, #3478f6);
}

.avatar.clickable {
  cursor: pointer;
}

.comment-body {
  min-width: 0;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(33, 51, 80, 0.08);
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-head.clickable {
  cursor: pointer;
}

.comment-head strong {
  color: #23324b;
}

.comment-head.clickable:hover strong {
  color: #2563eb;
}

.comment-head span {
  color: #8d9aab;
  font-size: 12px;
}

.content {
  margin: 8px 0 0;
  color: #40506a;
  line-height: 1.75;
  white-space: pre-wrap;
}

.reply-target {
  display: inline;
  margin: 0 6px 0 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1677ff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.comment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.liked {
  color: #e35d6a;
  font-weight: 700;
}

.reply-box {
  display: grid;
  gap: 10px;
  margin: 10px 0 12px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
