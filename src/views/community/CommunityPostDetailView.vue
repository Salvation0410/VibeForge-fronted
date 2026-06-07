<template>
  <section class="post-detail-page">
    <a-button class="back-button" @click="router.push('/community')">返回社区</a-button>

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && !post" description="帖子不存在或暂不可见" />

      <article v-else-if="post" class="detail-card">
        <div class="detail-head">
          <div class="meta-row">
            <a-tag v-if="isPinned" color="gold">置顶</a-tag>
            <a-tag v-if="post.tag?.name" color="blue">{{ post.tag.name }}</a-tag>
            <span>{{ formatTime(post.createTime) }}</span>
          </div>

          <h1>{{ post.title }}</h1>

          <div class="author-row" :class="{ clickable: authorClickable }" @click="openAuthorProfile">
            <a-avatar :src="post.user?.avatarUrl" class="avatar">{{ authorName.slice(0, 1) }}</a-avatar>
            <div>
              <strong>{{ authorName }}</strong>
              <span>{{ post.user?.userProfile || '社区创作者' }}</span>
            </div>
          </div>
        </div>

        <div v-if="contentHtml" class="content rich-content" v-html="contentHtml"></div>
        <p v-else class="content-empty">这个帖子还没有正文。</p>

        <div v-if="post.images?.length" class="image-grid">
          <img
            v-for="image in post.images"
            :key="String(image.id || image.imageUrl)"
            :src="image.imageUrl"
            alt="帖子图片"
          />
        </div>

        <div class="detail-actions">
          <a-button
            type="primary"
            ghost
            :loading="likeLoading"
            :class="{ liked: post.liked }"
            @click="handleLike"
          >
            {{ post.liked ? '已点赞' : '点赞' }} {{ post.likeCount || 0 }}
          </a-button>
          <span>评论 {{ post.commentCount || 0 }}</span>

          <div v-if="communityStore.isAdmin" class="admin-actions">
            <a-button @click="handleReview('APPROVED')">通过</a-button>
            <a-button danger @click="handleReview('REJECTED')">驳回</a-button>
            <a-button @click="handlePin(!isPinned)">{{ isPinned ? '取消置顶' : '置顶' }}</a-button>
          </div>
        </div>
      </article>
    </a-spin>

    <CommunityCommentList
      v-if="post?.id"
      :post-id="post.id"
      class="comment-panel"
      @comment-created="refreshPost"
      @require-login="requireLogin('评论')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  getCommunityPostDetail,
  pinCommunityPost,
  reviewCommunityPost,
  toggleCommunityPostLike,
  type CommunityId,
  type CommunityPostVO,
} from '@/api/community'
import CommunityCommentList from '@/components/community/CommunityCommentList.vue'
import { useCommunityStore } from '@/stores/community'
import { isSuccessCode } from '@/utils/appUtils'
import { renderCommunityContent } from '@/utils/communityContent'

const route = useRoute()
const router = useRouter()
const communityStore = useCommunityStore()

const post = ref<CommunityPostVO | null>(null)
const loading = ref(false)
const likeLoading = ref(false)

const postId = computed(() => route.params.id as string)
const isPinned = computed(() => Number(post.value?.isPinned || 0) === 1)
const authorClickable = computed(() => Boolean(post.value?.userId))
const contentHtml = computed(() => renderCommunityContent(post.value?.content))
const authorName = computed(
  () => post.value?.user?.nickname || post.value?.user?.account || `用户 ${post.value?.userId || ''}`.trim(),
)

function openAuthorProfile() {
  if (!post.value?.userId) {
    return
  }
  void router.push(`/profile/${post.value.userId}`)
}

function requireLogin(actionText: string) {
  message.warning(`${actionText}需要先登录`)
}

async function refreshPost() {
  if (!postId.value) {
    return
  }

  loading.value = true
  try {
    const res = await getCommunityPostDetail(postId.value)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '帖子详情加载失败')
    }
    post.value = res.data || null
  } catch (error) {
    message.error(error instanceof Error ? error.message : '帖子详情加载失败')
  } finally {
    loading.value = false
  }
}

async function handleLike() {
  if (!communityStore.isLogin) {
    requireLogin('点赞')
    return
  }
  if (!post.value?.id) {
    return
  }

  likeLoading.value = true
  try {
    const res = await toggleCommunityPostLike(post.value.id)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '点赞失败')
    }
    post.value.liked = Boolean(res.data?.liked)
    post.value.likeCount = Number(res.data?.likeCount || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '点赞失败')
  } finally {
    likeLoading.value = false
  }
}

function handleReview(status: 'APPROVED' | 'REJECTED') {
  if (!post.value?.id) {
    return
  }

  Modal.confirm({
    title: status === 'APPROVED' ? '通过这篇帖子？' : '驳回这篇帖子？',
    content: '这里预留了管理员审核入口，后续可以接入审核理由弹窗。',
    async onOk() {
      const res = await reviewCommunityPost({
        postId: post.value?.id as CommunityId,
        status,
      })
      if (!isSuccessCode(res.code)) {
        throw new Error(res.message || '审核失败')
      }
      message.success('审核状态已更新')
      await refreshPost()
    },
  })
}

async function handlePin(pinned: boolean) {
  if (!post.value?.id) {
    return
  }

  try {
    const res = await pinCommunityPost({
      postId: post.value.id,
      pinned,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '置顶操作失败')
    }
    message.success(pinned ? '已置顶' : '已取消置顶')
    post.value.isPinned = pinned ? 1 : 0
  } catch (error) {
    message.error(error instanceof Error ? error.message : '置顶操作失败')
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
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

watch(
  postId,
  () => {
    void refreshPost()
  },
  { immediate: true },
)
</script>

<style scoped>
.post-detail-page {
  display: grid;
  gap: 20px;
  max-width: 980px;
  margin: 0 auto;
}

.back-button {
  justify-self: start;
}

.detail-card,
.comment-panel {
  border: 1px solid rgba(34, 53, 84, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 64px rgba(28, 48, 78, 0.08);
}

.detail-card {
  display: grid;
  gap: 24px;
  padding: 34px;
}

.detail-head {
  display: grid;
  gap: 16px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8997aa;
}

.detail-head h1 {
  margin: 0;
  color: #142137;
  font-size: clamp(32px, 5vw, 54px);
  line-height: 1.08;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-row.clickable {
  cursor: pointer;
}

.author-row.clickable strong {
  transition: color 0.2s ease;
}

.author-row.clickable:hover strong {
  color: #2563eb;
}

.avatar {
  background: linear-gradient(145deg, #1ca9c6, #3478f6);
}

.author-row strong,
.author-row span {
  display: block;
}

.author-row strong {
  color: #26344d;
}

.author-row span {
  color: #8a98ad;
  font-size: 13px;
}

.content,
.content-empty {
  margin: 0;
  color: #34455f;
  font-size: 17px;
  line-height: 1.9;
}

.content-empty {
  color: #9aa6b6;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.image-grid img {
  width: 100%;
  max-height: 420px;
  border-radius: 18px;
  object-fit: cover;
  background: #eef4f8;
}

.detail-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid rgba(34, 53, 84, 0.08);
}

.liked {
  color: #e35d6a;
  border-color: #e35d6a;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

.comment-panel {
  padding: 26px;
}

.rich-content {
  word-break: break-word;
}

.rich-content :deep(p),
.rich-content :deep(ul),
.rich-content :deep(ol),
.rich-content :deep(blockquote),
.rich-content :deep(pre),
.rich-content :deep(table) {
  margin: 0 0 18px;
}

.rich-content :deep(h1),
.rich-content :deep(h2),
.rich-content :deep(h3),
.rich-content :deep(h4) {
  margin: 28px 0 16px;
  color: #142137;
  line-height: 1.35;
}

.rich-content :deep(blockquote) {
  padding: 14px 18px;
  border-left: 4px solid #d2d9e4;
  border-radius: 0 14px 14px 0;
  background: #f8fafc;
  color: #5b6b80;
}

.rich-content :deep(pre) {
  overflow: auto;
  padding: 16px 18px;
  border-radius: 14px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.7;
}

.rich-content :deep(code) {
  font-family: Consolas, 'Courier New', monospace;
}

.rich-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 12px;
}

.rich-content :deep(th),
.rich-content :deep(td) {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
}

@media (max-width: 760px) {
  .detail-card {
    padding: 24px 18px;
  }

  .image-grid {
    grid-template-columns: 1fr;
  }

  .admin-actions {
    width: 100%;
    margin-left: 0;
  }
}
</style>
