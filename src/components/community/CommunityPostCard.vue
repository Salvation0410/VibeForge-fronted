<template>
  <article class="post-row" @click="emit('open', post)">
    <div class="row-meta">
      <div class="author" :class="{ clickable: authorClickable }" @click.stop="openAuthorProfile">
        <a-avatar :src="post.user?.avatarUrl" class="avatar">{{ authorName.slice(0, 1) }}</a-avatar>
        <span class="author-name">{{ authorName }}</span>
        <span class="divider"></span>
        <span>{{ formatTime(post.createTime) }}</span>
        <span class="divider"></span>
        <span>{{ post.tag?.name || '其他' }}</span>
      </div>

      <div class="stats" @click.stop>
        <button class="stat-button" type="button" @click="emit('open', post)">
          <span class="comment-icon"></span>
          {{ post.commentCount || 0 }}
        </button>
        <button
          class="stat-button"
          :class="{ liked: post.liked }"
          type="button"
          :disabled="likeLoading"
          @click="emit('like', post)"
        >
          ❤ {{ post.likeCount || 0 }}
        </button>
      </div>
    </div>

    <div class="row-body">
      <a-tag v-if="isPinned" class="pin-tag">置顶</a-tag>
      <h3>{{ post.title || '未命名帖子' }}</h3>
    </div>

    <p class="summary">{{ summaryText || '这个帖子还没有正文。' }}</p>

    <div v-if="post.images?.length" class="thumb-row">
      <img
        v-for="image in visibleImages"
        :key="String(image.id || image.imageUrl)"
        class="thumb"
        :src="image.imageUrl"
        alt="帖子图片"
        loading="lazy"
      />
    </div>

    <div v-if="showAdminActions" class="admin-actions" @click.stop>
      <a-button size="small" @click="emit('review', post, 'APPROVED')">通过</a-button>
      <a-button size="small" danger @click="emit('review', post, 'REJECTED')">驳回</a-button>
      <a-button size="small" @click="emit('pin', post, !isPinned)">
        {{ isPinned ? '取消置顶' : '置顶' }}
      </a-button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { CommunityPostVO } from '@/api/community'
import { extractCommunityText } from '@/utils/communityContent'

const props = defineProps<{
  post: CommunityPostVO
  isAdmin?: boolean
  likeLoading?: boolean
}>()

const emit = defineEmits<{
  open: [post: CommunityPostVO]
  like: [post: CommunityPostVO]
  review: [post: CommunityPostVO, status: 'APPROVED' | 'REJECTED']
  pin: [post: CommunityPostVO, pinned: boolean]
}>()

const router = useRouter()
const isPinned = computed(() => Number(props.post.isPinned || 0) === 1)
const visibleImages = computed(() => props.post.images?.slice(0, 3) || [])
const showAdminActions = computed(() => Boolean(props.isAdmin))
const authorClickable = computed(() => Boolean(props.post.userId))
const summaryText = computed(() => extractCommunityText(props.post.content))
const authorName = computed(
  () => props.post.user?.nickname || props.post.user?.account || `用户 ${props.post.userId || ''}`.trim() || 'NoCode',
)

function openAuthorProfile() {
  if (!props.post.userId) {
    return
  }
  void router.push(`/profile/${props.post.userId}`)
}

function formatTime(value?: string) {
  if (!value) {
    return '刚刚'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const diff = Date.now() - date.getTime()
  const day = 24 * 60 * 60 * 1000
  const month = 30 * day

  if (diff > month) {
    return `${Math.max(1, Math.round(diff / month))} 个月前`
  }
  if (diff > day) {
    return `${Math.max(1, Math.round(diff / day))} 天前`
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<style scoped>
.post-row {
  display: grid;
  gap: 14px;
  min-height: 190px;
  padding: 0 26px 30px;
  background: #fff;
  cursor: pointer;
}

.post-row + .post-row {
  padding-top: 22px;
}

.row-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 32px;
  color: #8a94a6;
  font-size: 16px;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.author.clickable {
  cursor: pointer;
}

.author.clickable:hover .author-name {
  color: #2563eb;
}

.avatar {
  width: 20px;
  height: 20px;
  background: #22e0b4;
  color: #07111f;
  font-size: 10px;
  font-weight: 900;
}

.author-name {
  max-width: 160px;
  overflow: hidden;
  color: #001329;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.divider {
  width: 1px;
  height: 14px;
  background: #dfe4ea;
}

.stats {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8a94a6;
  cursor: pointer;
  font-size: 17px;
}

.stat-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.stat-button.liked {
  color: #00a6a6;
  font-weight: 800;
}

.comment-icon {
  position: relative;
  width: 16px;
  height: 12px;
  border: 1.6px solid currentColor;
  border-radius: 8px;
}

.comment-icon::after {
  position: absolute;
  bottom: -4px;
  left: 3px;
  width: 5px;
  height: 5px;
  border-bottom: 1.6px solid currentColor;
  border-left: 1.6px solid currentColor;
  content: '';
  transform: rotate(-20deg);
}

.row-body {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.pin-tag {
  flex: 0 0 auto;
  margin: 0;
  border-color: #18d6aa;
  border-radius: 7px;
  background: #f3fffb;
  color: #00b98d;
  font-size: 16px;
  font-weight: 800;
}

.row-body h3 {
  margin: 0;
  overflow: hidden;
  color: #050b16;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 22px;
  line-height: 1.35;
}

.summary {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #001329;
  font-size: 18px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.thumb-row {
  display: grid;
  grid-template-columns: repeat(3, 180px);
  gap: 12px;
}

.thumb {
  width: 180px;
  height: 108px;
  border-radius: 8px;
  object-fit: cover;
  background: #eef3f8;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 720px) {
  .post-row {
    min-height: 0;
    padding: 18px 16px 24px;
  }

  .row-meta {
    align-items: flex-start;
    flex-direction: column;
    font-size: 14px;
  }

  .stats {
    align-self: flex-end;
  }

  .row-body {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .row-body h3 {
    white-space: normal;
  }

  .summary {
    font-size: 16px;
  }

  .thumb-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 5 / 3;
  }
}
</style>
