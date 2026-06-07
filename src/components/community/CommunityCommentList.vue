<template>
  <section class="comment-list" :class="{ replies: isReplyList }">
    <div v-if="!isReplyList" class="comment-header">
      <div>
        <h2>评论</h2>
        <p>把补充、建议和问题留在这里。</p>
      </div>
      <a-segmented v-model:value="sortType" :options="sortOptions" @change="reload" />
    </div>

    <div v-if="!isReplyList" class="comment-editor">
      <a-textarea
        v-model:value="commentContent"
        :auto-size="{ minRows: 3, maxRows: 7 }"
        :maxlength="1000"
        placeholder="写下你的评论"
        @focus="handleEditorFocus"
      />
      <div class="editor-actions">
        <a-button type="primary" :loading="submitting" @click="submitComment">发表评论</a-button>
      </div>
    </div>

    <a-spin :spinning="loading && !comments.length">
      <a-empty
        v-if="!loading && !comments.length"
        :description="isReplyList ? '暂无回复' : '还没有评论，来开个头吧'"
      />

      <div v-else class="items">
        <CommunityCommentItem
          v-for="comment in comments"
          :key="String(comment.id)"
          :comment="comment"
          :post-id="postId"
          :is-reply="isReplyList"
          :can-comment="communityStore.isLogin"
          :like-loading="likingIds.has(String(comment.id))"
          @like="handleLike"
          @replied="reload"
          @require-login="emitRequireLogin"
        />
      </div>
    </a-spin>

    <div v-if="hasMore" class="load-row">
      <a-button :loading="loading" @click="loadMore">加载更多</a-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  createCommunityComment,
  getCommunityCommentPage,
  toggleCommunityCommentLike,
  type CommunityCommentVO,
  type CommunityId,
} from '@/api/community'
import CommunityCommentItem from '@/components/community/CommunityCommentItem.vue'
import { useCommunityStore } from '@/stores/community'
import { isSuccessCode } from '@/utils/appUtils'

const props = withDefaults(
  defineProps<{
    postId: CommunityId
    parentId?: CommunityId
    isReplyList?: boolean
  }>(),
  {
    parentId: 0,
    isReplyList: false,
  },
)

const emit = defineEmits<{
  'comment-created': []
  'require-login': []
}>()

const communityStore = useCommunityStore()

const sortOptions = [
  { label: '最新', value: 'latest' },
  { label: '最热', value: 'hot' },
]

const sortType = ref<'latest' | 'hot'>('latest')
const commentContent = ref('')
const comments = ref<CommunityCommentVO[]>([])
const nextCursor = ref<string | undefined>()
const hasMore = ref(false)
const loading = ref(false)
const submitting = ref(false)
const likingIds = ref(new Set<string>())

function emitRequireLogin() {
  emit('require-login')
}

async function loadMore() {
  if (loading.value) {
    return
  }

  loading.value = true
  try {
    const res = await getCommunityCommentPage({
      postId: props.postId,
      parentId: props.parentId || 0,
      pageSize: props.isReplyList ? 5 : 10,
      cursor: nextCursor.value,
      sortType: sortType.value,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '评论加载失败')
    }
    const page = res.data
    comments.value = [...comments.value, ...(page?.records || [])]
    nextCursor.value = page?.nextCursor
    hasMore.value = Boolean(page?.hasMore)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '评论加载失败')
  } finally {
    loading.value = false
  }
}

async function reload() {
  comments.value = []
  nextCursor.value = undefined
  hasMore.value = false
  await loadMore()
}

function handleEditorFocus() {
  if (!communityStore.isLogin) {
    emitRequireLogin()
  }
}

async function submitComment() {
  if (!communityStore.isLogin) {
    emitRequireLogin()
    return
  }
  const content = commentContent.value.trim()
  if (!content) {
    message.warning('请输入评论内容')
    return
  }

  submitting.value = true
  try {
    const res = await createCommunityComment({
      postId: props.postId,
      parentId: 0,
      content,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '评论发布失败')
    }
    message.success('评论已发布')
    commentContent.value = ''
    emit('comment-created')
    await reload()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '评论发布失败')
  } finally {
    submitting.value = false
  }
}

async function handleLike(comment: CommunityCommentVO) {
  if (!communityStore.isLogin) {
    emitRequireLogin()
    return
  }
  if (!comment.id) {
    return
  }

  const id = String(comment.id)
  likingIds.value = new Set(likingIds.value).add(id)
  try {
    const res = await toggleCommunityCommentLike(comment.id)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '点赞失败')
    }
    comment.liked = Boolean(res.data?.liked)
    comment.likeCount = Number(res.data?.likeCount || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '点赞失败')
  } finally {
    const next = new Set(likingIds.value)
    next.delete(id)
    likingIds.value = next
  }
}

watch(
  () => [props.postId, props.parentId],
  () => {
    void reload()
  },
)

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.comment-list {
  display: grid;
  gap: 18px;
}

.comment-list.replies {
  gap: 12px;
  margin-top: 12px;
  padding: 14px;
  border-radius: 16px;
  background: #f7fafc;
}

.comment-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.comment-header h2 {
  margin: 0;
  color: #142137;
  font-size: 28px;
}

.comment-header p {
  margin: 6px 0 0;
  color: #7a889b;
}

.comment-editor {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(34, 53, 84, 0.08);
  border-radius: 18px;
  background: #fff;
}

.editor-actions,
.load-row {
  display: flex;
  justify-content: flex-end;
}

.items {
  display: grid;
  gap: 16px;
}

@media (max-width: 640px) {
  .comment-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
