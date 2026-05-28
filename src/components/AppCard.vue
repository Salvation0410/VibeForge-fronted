<template>
  <article class="app-card" @click="handleCardClick">
    <div class="preview-shell">
      <img v-if="app.cover" class="preview-image" :src="app.cover" :alt="app.appName || '应用封面'" />
      <div v-else class="preview-fallback">
        <span class="preview-badge">{{ previewBadge }}</span>
        <strong>{{ app.appName || '未命名应用' }}</strong>
        <p>{{ app.initPrompt || '等待更多描述，生成更完整的网站效果。' }}</p>
      </div>
    </div>

    <div class="card-body">
      <div class="title-row">
        <h3>{{ app.appName || '未命名应用' }}</h3>
        <a-tag :color="tagColor">{{ tagText }}</a-tag>
      </div>

      <p class="prompt">{{ app.initPrompt || '暂无初始提示词' }}</p>

      <div class="meta-row">
        <div class="author">
          <a-avatar :src="ownerAvatar">{{ ownerInitial }}</a-avatar>
          <span>{{ ownerName }}</span>
        </div>
        <span>{{ createdText }}</span>
      </div>

      <div v-if="showActions" class="actions" @click.stop>
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppVO } from '@/api/app'
import {
  formatRelativeTime,
  getAppOwnerAvatar,
  getAppOwnerName,
  getAppTagColor,
} from '@/utils/appUtils'

const props = withDefaults(
  defineProps<{
    app: AppVO
    showActions?: boolean
  }>(),
  {
    showActions: false,
  },
)

const emit = defineEmits<{
  click: [app: AppVO]
}>()

const ownerName = computed(() => getAppOwnerName(props.app))
const ownerAvatar = computed(() => getAppOwnerAvatar(props.app))
const ownerInitial = computed(() => ownerName.value.slice(0, 1).toUpperCase())
const createdText = computed(() => `创建于 ${formatRelativeTime(props.app.createTime)}`)
const tagColor = computed(() => getAppTagColor(props.app.priority))
const tagText = computed(() => ((props.app.priority ?? 0) >= 99 ? '精选' : '应用'))
const previewBadge = computed(() => (props.app.codeGenType || 'web').toUpperCase())

const handleCardClick = () => {
  emit('click', props.app)
}
</script>

<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 28px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(41, 68, 104, 0.08);
  box-shadow: 0 18px 48px rgba(24, 45, 79, 0.08);
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
}

.app-card:hover {
  transform: translateY(-6px);
  border-color: rgba(25, 149, 196, 0.18);
  box-shadow: 0 26px 58px rgba(24, 45, 79, 0.14);
}

.preview-shell {
  position: relative;
  aspect-ratio: 16 / 10;
  background:
    linear-gradient(135deg, rgba(238, 248, 255, 0.98), rgba(250, 252, 255, 0.94)),
    radial-gradient(circle at top right, rgba(44, 198, 214, 0.2), transparent 36%);
}

.preview-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.preview-fallback {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: 26px;
  background:
    radial-gradient(circle at 85% 10%, rgba(44, 198, 214, 0.2), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(236, 244, 252, 0.9));
}

.preview-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 6px 12px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #1484b1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.preview-fallback strong {
  color: #16233a;
  font-size: 28px;
  line-height: 1.2;
}

.preview-fallback p {
  margin: 12px 0 0;
  color: #5f6f88;
  line-height: 1.7;
}

.card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  padding: 22px 22px 20px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title-row h3 {
  margin: 0;
  color: #132033;
  font-size: 24px;
  line-height: 1.25;
}

.prompt {
  min-height: 48px;
  margin: 0;
  color: #62738d;
  line-height: 1.7;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: auto;
  color: #74839b;
  font-size: 13px;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.author span {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 6px;
}
</style>
