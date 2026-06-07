<template>
  <a-form layout="vertical" class="editor" @submit.prevent>
    <a-form-item label="标题" required>
      <a-input
        v-model:value="form.title"
        :maxlength="80"
        show-count
        placeholder="给你的想法起一个清楚的标题"
      />
    </a-form-item>

    <a-form-item label="正文" required>
      <a-textarea
        v-model:value="form.content"
        :maxlength="4000"
        :auto-size="{ minRows: 7, maxRows: 12 }"
        show-count
        placeholder="分享你的问题、经验、灵感或作品过程..."
      />
    </a-form-item>

    <a-form-item label="标签" required>
      <div class="tag-picker">
        <button
          v-for="tag in availableTags"
          :key="String(tag.id)"
          class="tag-option"
          :class="{ active: String(form.tagId) === String(tag.id) }"
          type="button"
          @click="selectTag(tag.id)"
        >
          {{ tag.name }}
        </button>
      </div>
    </a-form-item>

    <a-form-item label="图片">
      <div class="upload-zone">
        <input
          ref="fileInputRef"
          class="file-input"
          type="file"
          accept="image/*"
          multiple
          @change="handleFileChange"
        />
        <button class="upload-button" type="button" @click="fileInputRef?.click()">
          选择图片
        </button>
        <span class="upload-hint">最多 9 张，提交前仅本地预览</span>
      </div>

      <div v-if="previews.length" class="preview-grid">
        <div v-for="item in previews" :key="item.url" class="preview-item">
          <img :src="item.url" alt="待发布图片" />
          <button type="button" @click="removeImage(item.url)">删除</button>
        </div>
      </div>
    </a-form-item>

    <div class="editor-actions">
      <a-button @click="emit('cancel')">取消</a-button>
      <a-button type="primary" :loading="submitting" @click="submit">提交审核</a-button>
    </div>
  </a-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { CommunityId, CommunityPostAddRequest, CommunityTagVO } from '@/api/community'

const props = defineProps<{
  tags: CommunityTagVO[]
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CommunityPostAddRequest, imageFiles: File[]]
  cancel: []
}>()

interface PreviewFile {
  file: File
  url: string
}

const form = reactive<CommunityPostAddRequest>({
  title: '',
  content: '',
  tagId: '',
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const previews = ref<PreviewFile[]>([])
const availableTags = computed(() => props.tags.filter((tag) => tag.id !== undefined && tag.id !== null))

function selectTag(tagId?: CommunityId) {
  if (tagId !== undefined && tagId !== null) {
    form.tagId = tagId
  }
}

watch(
  availableTags,
  (tags) => {
    if (!form.tagId && tags[0]?.id !== undefined && tags[0]?.id !== null) {
      form.tagId = tags[0].id
    }
  },
  { immediate: true },
)

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''

  const imageFiles = files.filter((file) => file.type.startsWith('image/'))
  if (imageFiles.length !== files.length) {
    message.warning('只能选择图片文件')
  }

  const next = [...previews.value]
  imageFiles.forEach((file) => {
    if (next.length >= 9) {
      return
    }
    next.push({
      file,
      url: URL.createObjectURL(file),
    })
  })
  previews.value = next
}

function removeImage(url: string) {
  const target = previews.value.find((item) => item.url === url)
  if (target) {
    URL.revokeObjectURL(target.url)
  }
  previews.value = previews.value.filter((item) => item.url !== url)
}

function reset() {
  previews.value.forEach((item) => URL.revokeObjectURL(item.url))
  previews.value = []
  form.title = ''
  form.content = ''
  form.tagId = availableTags.value[0]?.id || ''
}

function submit() {
  const title = form.title.trim()
  const content = form.content.trim()
  const tagId = form.tagId as CommunityId

  if (!title) {
    message.warning('请填写帖子标题')
    return
  }
  if (!content) {
    message.warning('请填写帖子正文')
    return
  }
  if (!tagId) {
    message.warning('请选择帖子标签')
    return
  }

  emit(
    'submit',
    {
      title,
      content,
      tagId,
    },
    previews.value.map((item) => item.file),
  )
}

defineExpose({
  reset,
})
</script>

<style scoped>
.editor {
  display: grid;
  gap: 2px;
}

.tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-option {
  min-height: 34px;
  padding: 7px 14px;
  border: 1px solid rgba(34, 53, 84, 0.1);
  border-radius: 999px;
  background: #f7fafc;
  color: #526178;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.tag-option.active {
  border-color: #1aa8c7;
  background: #e9f9fc;
  color: #087f9d;
  font-weight: 700;
}

.upload-zone {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
}

.file-input {
  display: none;
}

.upload-button {
  height: 38px;
  padding: 0 18px;
  border: 1px dashed #25a9c5;
  border-radius: 12px;
  background: #f0fbfd;
  color: #0985a2;
  cursor: pointer;
  font-weight: 700;
}

.upload-hint {
  color: #8b98aa;
  font-size: 13px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.preview-item {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: #eef4f8;
}

.preview-item img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.preview-item button {
  position: absolute;
  right: 8px;
  bottom: 8px;
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(18, 30, 48, 0.78);
  color: #fff;
  cursor: pointer;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .upload-zone {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
