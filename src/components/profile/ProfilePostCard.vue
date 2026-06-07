<template>
  <article class="post-card" @click="emit('click', post)">
    <div class="post-main">
      <div class="post-meta">
        <a-tag v-if="post.tag?.name" color="blue">{{ post.tag.name }}</a-tag>
        <a-tag v-if="ownerView" :color="statusColor">{{ statusText }}</a-tag>
        <span>{{ createdText }}</span>
      </div>

      <h3>{{ post.title || '未命名帖子' }}</h3>
      <p class="post-summary">{{ summaryText }}</p>

      <p v-if="ownerView && post.status === 'REJECTED' && post.rejectReason" class="reject-reason">
        驳回原因：{{ post.rejectReason }}
      </p>

      <div class="post-footer">
        <div class="author">
          <a-avatar :src="post.user?.avatarUrl" :size="28">
            {{ authorInitial }}
          </a-avatar>
          <span>{{ authorName }}</span>
        </div>

        <div class="stats">
          <span>点赞 {{ post.likeCount || 0 }}</span>
          <span>评论 {{ post.commentCount || 0 }}</span>
        </div>
      </div>
    </div>

    <div v-if="coverUrl" class="cover-shell">
      <img :src="coverUrl" alt="帖子封面" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CommunityPostVO } from '@/api/community'
import { formatDateTime } from '@/utils/appUtils'

const props = withDefaults(
  defineProps<{
    post: CommunityPostVO
    ownerView?: boolean
  }>(),
  {
    ownerView: false,
  },
)

const emit = defineEmits<{
  click: [post: CommunityPostVO]
}>()

const authorName = computed(
  () => props.post.user?.nickname || props.post.user?.account || `用户 ${props.post.userId || ''}`.trim(),
)
const authorInitial = computed(() => authorName.value.slice(0, 1).toUpperCase())
const createdText = computed(() => formatDateTime(props.post.createTime))
const coverUrl = computed(() => props.post.images?.[0]?.imageUrl?.trim() || '')

const summaryText = computed(() => {
  const raw = (props.post.content || '').replace(/\s+/g, ' ').trim()
  if (!raw) {
    return '这篇帖子还没有正文摘要。'
  }
  return raw.length > 110 ? `${raw.slice(0, 110)}...` : raw
})

const statusText = computed(() => {
  if (props.post.status === 'APPROVED') return '已通过'
  if (props.post.status === 'REJECTED') return '已驳回'
  return '审核中'
})

const statusColor = computed(() => {
  if (props.post.status === 'APPROVED') return 'success'
  if (props.post.status === 'REJECTED') return 'error'
  return 'processing'
})
</script>

<style scoped>
.post-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 176px;
  gap: 20px;
  padding: 24px;
  border: 1px solid rgba(26, 43, 69, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 46px rgba(24, 45, 79, 0.08);
  cursor: pointer;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  border-color: rgba(18, 127, 198, 0.18);
  box-shadow: 0 24px 52px rgba(24, 45, 79, 0.12);
}

.post-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: #74839b;
  font-size: 13px;
}

.post-main h3 {
  margin: 0;
  color: #142137;
  font-size: 22px;
  line-height: 1.3;
}

.post-summary {
  margin: 0;
  color: #607089;
  line-height: 1.8;
}

.reject-reason {
  margin: 0;
  color: #c2410c;
  font-size: 13px;
  line-height: 1.7;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
}

.author,
.stats {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #6f7f96;
  font-size: 13px;
}

.author {
  min-width: 0;
}

.author span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-shell {
  align-self: center;
  width: 176px;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
}

.cover-shell img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

@media (max-width: 860px) {
  .post-card {
    grid-template-columns: 1fr;
  }

  .cover-shell {
    width: 100%;
  }

  .post-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
