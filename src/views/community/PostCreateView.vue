<template>
  <section class="post-create-page">
    <header class="create-topbar">
      <button class="brand-block" type="button" @click="goToCommunity">
        <img class="brand-logo" src="@/assets/logo.png" alt="智创 · AI应用平台" />
        <span class="brand-copy">
          <span class="brand-title">智创 · AI应用平台</span>
          <span class="brand-subtitle">交流社区</span>
        </span>
      </button>

      <div class="draft-status">
        <span class="draft-title">草稿</span>
        <span class="draft-meta">{{ draftStatusText }}</span>
      </div>

      <div class="topbar-actions">
        <button class="topbar-link" type="button" @click="togglePreview">
          {{ isPreview ? '继续编辑' : '预览' }}
        </button>
        <button class="outline-button" type="button" @click="saveAndLeave">保存并离开</button>
        <button class="publish-button" type="button" :disabled="isPublishing || !canPublish" @click="publishPost">
          <span>{{ isPublishing ? '发布中...' : '发布' }}</span>
          <span class="publish-arrow"></span>
        </button>
        <div class="profile-avatar">
          <img v-if="loginUser?.avatarUrl" :src="loginUser.avatarUrl" alt="当前用户头像" />
          <span v-else>{{ avatarText }}</span>
        </div>
      </div>
    </header>

    <main class="create-body">
      <section class="editor-canvas">
        <div class="toolbar-shell">
          <Toolbar class="editor-toolbar" :editor="editorRef" :default-config="toolbarConfig" mode="default" />
        </div>

        <div class="toolbar-divider"></div>

        <div v-if="!isPreview" class="editor-pane">
          <input
            v-model="form.title"
            class="title-input"
            type="text"
            maxlength="80"
            placeholder="请输入标题"
          />

          <section class="meta-row">
            <div class="tag-picker">
              <span class="meta-label">标签</span>
              <div class="tag-list">
                <button
                  v-for="tag in tags"
                  :key="String(tag.id)"
                  class="tag-chip"
                  :class="{ active: String(form.tagId ?? '') === String(tag.id ?? '') }"
                  type="button"
                  @click="selectTag(tag.id)"
                >
                  {{ tag.name }}
                </button>
              </div>
            </div>

            <div class="helper-copy">
              <span>{{ tagsLoading ? '正在加载标签...' : '发布后帖子将进入审核队列' }}</span>
            </div>
          </section>

          <section class="upload-panel">
            <div class="upload-head">
              <div>
                <p class="upload-title">插入图片</p>
                <p class="upload-subtitle">支持多图上传，本地预览后再发布</p>
              </div>
              <button class="ghost-button" type="button" @click="triggerImagePicker">选择图片</button>
            </div>

            <input
              ref="fileInputRef"
              class="file-input"
              type="file"
              accept="image/*"
              multiple
              @change="handleImageChange"
            />

            <div v-if="selectedImages.length" class="image-grid">
              <article v-for="item in selectedImages" :key="item.url" class="image-card">
                <img :src="item.url" :alt="item.file.name" />
                <button class="image-remove" type="button" @click="removeImage(item.url)">删除</button>
              </article>
            </div>

            <div v-else class="upload-empty">
              <span class="upload-empty-icon">+</span>
              <span>上传后会在这里显示预览，最多 9 张</span>
            </div>
          </section>

          <div class="content-editor">
            <Editor
              v-model="form.content"
              class="editor-instance"
              :default-config="editorConfig"
              mode="default"
              @on-created="handleEditorCreated"
            />
          </div>
        </div>

        <article v-else class="preview-pane">
          <header class="preview-head">
            <h1 class="preview-title">{{ form.title.trim() || '未命名草稿' }}</h1>
            <div class="preview-meta">
              <span v-if="activeTagName" class="preview-tag">{{ activeTagName }}</span>
              <span>{{ loginUser?.nickname || loginUser?.account || '访客视角' }}</span>
            </div>
          </header>

          <div v-if="selectedImages.length" class="preview-gallery">
            <img v-for="item in selectedImages" :key="item.url" :src="item.url" :alt="item.file.name" />
          </div>

          <div v-if="previewHasContent" class="preview-body rich-content" v-html="previewContentHtml"></div>
          <div v-else class="preview-empty">这里会显示正文预览。</div>
        </article>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'

import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import {
  createCommunityPost,
  getCommunityTagList,
  type CommunityId,
  type CommunityTagVO,
} from '@/api/community'
import { useLoginUserStore } from '@/stores/loginUser'
import { isSuccessCode } from '@/utils/appUtils'
import {
  isEffectivelyEmptyCommunityContent,
  renderCommunityContent,
} from '@/utils/communityContent'

interface DraftPayload {
  title: string
  content: string
  tagId?: CommunityId
}

interface SelectedImage {
  file: File
  url: string
}

const router = useRouter()
const loginUserStore = useLoginUserStore()

const DRAFT_STORAGE_KEY = 'community-post-create-draft'
const MAX_IMAGE_COUNT = 9

const editorRef = shallowRef<IDomEditor>()
const tags = ref<CommunityTagVO[]>([])
const tagsLoading = ref(false)
const isPreview = ref(false)
const isPublishing = ref(false)
const saveState = ref<'idle' | 'saving' | 'saved'>('idle')
const selectedImages = ref<SelectedImage[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const form = reactive<DraftPayload>({
  title: '',
  content: '',
  tagId: undefined,
})

const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    'headerSelect',
    'blockquote',
    'bold',
    'underline',
    'italic',
    'through',
    'color',
    'bgColor',
    'lineHeight',
    'bulletedList',
    'numberedList',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    'insertLink',
    'insertTable',
    'codeBlock',
    'divider',
    'undo',
    'redo',
  ],
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入正文...',
  autoFocus: false,
  scroll: false,
}

let saveTimer: number | undefined
let saveIndicatorTimer: number | undefined

const loginUser = computed(() => loginUserStore.loginUser)
const avatarText = computed(() => {
  const text = loginUser.value?.nickname || loginUser.value?.account || 'N'
  return text.slice(0, 1).toUpperCase()
})
const activeTagName = computed(
  () => tags.value.find((tag) => String(tag.id ?? '') === String(form.tagId ?? ''))?.name || '',
)
const previewContentHtml = computed(() => renderCommunityContent(form.content))
const previewHasContent = computed(() => !isEffectivelyEmptyCommunityContent(form.content))
const canPublish = computed(
  () => Boolean(form.title.trim() && form.tagId && !isEffectivelyEmptyCommunityContent(form.content)),
)
const draftStatusText = computed(() => {
  if (saveState.value === 'saving') {
    return '正在保存到本地'
  }
  if (saveState.value === 'saved') {
    return '已保存到本地'
  }
  return '离开可自动保存'
})

function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor
}

function scheduleSavedIndicatorReset() {
  if (saveIndicatorTimer) {
    window.clearTimeout(saveIndicatorTimer)
  }
  saveIndicatorTimer = window.setTimeout(() => {
    saveState.value = 'idle'
  }, 1600)
}

async function loadTags() {
  tagsLoading.value = true
  try {
    const res = await getCommunityTagList()
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '标签加载失败')
    }
    tags.value = res.data || []
    if (!tags.value.length) {
      form.tagId = undefined
      return
    }
    const hasCurrentTag = tags.value.some((tag) => String(tag.id ?? '') === String(form.tagId ?? ''))
    if (!hasCurrentTag) {
      form.tagId = tags.value[0]?.id
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '标签加载失败')
  } finally {
    tagsLoading.value = false
  }
}

function restoreDraft() {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw) as DraftPayload
    form.title = parsed.title || ''
    form.content = parsed.content || ''
    form.tagId = parsed.tagId
    if (form.title || form.content || form.tagId) {
      saveState.value = 'saved'
      scheduleSavedIndicatorReset()
    }
  } catch {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
  }
}

function saveDraftNow() {
  saveState.value = 'saving'
  localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({
      title: form.title,
      content: form.content,
      tagId: form.tagId,
    } satisfies DraftPayload),
  )
  saveState.value = 'saved'
  scheduleSavedIndicatorReset()
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY)
}

function releaseImageUrls() {
  selectedImages.value.forEach((item) => URL.revokeObjectURL(item.url))
}

watch(
  () => [form.title, form.content, form.tagId],
  () => {
    if (saveTimer) {
      window.clearTimeout(saveTimer)
    }
    saveState.value = 'saving'
    saveTimer = window.setTimeout(() => {
      saveDraftNow()
    }, 500)
  },
)

function handleBeforeUnload() {
  if (form.title || form.content || form.tagId) {
    saveDraftNow()
  }
}

function goToCommunity() {
  void router.push('/community')
}

function togglePreview() {
  isPreview.value = !isPreview.value
}

function selectTag(tagId?: CommunityId) {
  if (tagId !== undefined && tagId !== null) {
    form.tagId = tagId
  }
}

function triggerImagePicker() {
  fileInputRef.value?.click()
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''

  const imageFiles = files.filter((file) => file.type.startsWith('image/'))
  if (files.length !== imageFiles.length) {
    message.warning('只能上传图片文件')
  }

  const next = [...selectedImages.value]
  imageFiles.forEach((file) => {
    if (next.length >= MAX_IMAGE_COUNT) {
      return
    }
    next.push({
      file,
      url: URL.createObjectURL(file),
    })
  })

  if (imageFiles.length && next.length === selectedImages.value.length) {
    message.warning(`最多上传 ${MAX_IMAGE_COUNT} 张图片`)
  }

  selectedImages.value = next.slice(0, MAX_IMAGE_COUNT)
}

function removeImage(url: string) {
  const target = selectedImages.value.find((item) => item.url === url)
  if (target) {
    URL.revokeObjectURL(target.url)
  }
  selectedImages.value = selectedImages.value.filter((item) => item.url !== url)
}

function saveAndLeave() {
  saveDraftNow()
  void router.push('/community')
}

async function publishPost() {
  if (!loginUserStore.isLogin) {
    message.warning('请先登录后再发布帖子')
    return
  }
  if (!canPublish.value || !form.tagId) {
    message.warning('请完善标题、正文和标签')
    return
  }

  const content = renderCommunityContent(form.content)
  if (!content) {
    message.warning('请输入正文内容')
    return
  }

  isPublishing.value = true
  try {
    const res = await createCommunityPost(
      {
        title: form.title.trim(),
        content,
        tagId: form.tagId,
      },
      selectedImages.value.map((item) => item.file),
    )
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '帖子发布失败')
    }

    clearDraft()
    releaseImageUrls()
    selectedImages.value = []
    form.title = ''
    form.content = ''
    form.tagId = tags.value[0]?.id
    saveState.value = 'idle'

    message.success('帖子已提交审核')
    void router.push('/community')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '帖子发布失败')
  } finally {
    isPublishing.value = false
  }
}

onMounted(async () => {
  if (!loginUserStore.hasFetched) {
    await loginUserStore.fetchLoginUser()
  }
  restoreDraft()
  await loadTags()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  if (saveTimer) {
    window.clearTimeout(saveTimer)
  }
  if (saveIndicatorTimer) {
    window.clearTimeout(saveIndicatorTimer)
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
  releaseImageUrls()
  editorRef.value?.destroy()
  editorRef.value = undefined
})
</script>

<style scoped>
.post-create-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f8fa 0%, #f4f5f7 100%);
  color: #111827;
}

.create-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  height: 72px;
  padding: 0 28px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
}

.brand-block {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  width: fit-content;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.brand-logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 10px 22px rgba(31, 167, 199, 0.16));
}

.brand-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.brand-title {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.brand-subtitle {
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.2;
}

.draft-status {
  justify-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.draft-title {
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.draft-meta {
  color: #9ca3af;
  font-size: 12px;
}

.topbar-actions {
  justify-self: end;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.topbar-link,
.outline-button,
.publish-button,
.ghost-button,
.tag-chip,
.image-remove {
  font: inherit;
}

.topbar-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.outline-button {
  height: 40px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.publish-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: #111111;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.publish-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.publish-arrow {
  width: 0;
  height: 0;
  border-top: 5px solid #fff;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}

.profile-avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.create-body {
  padding: 32px 24px 48px;
}

.editor-canvas {
  width: min(1080px, 100%);
  margin: 0 auto;
  border: 1px solid #eceff3;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
}

.toolbar-shell {
  padding: 10px 16px 6px;
}

.toolbar-divider {
  height: 1px;
  background: #eef1f4;
}

.editor-pane,
.preview-pane {
  padding: 28px 48px 48px;
}

.title-input {
  width: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #111827;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.25;
}

.title-input::placeholder {
  color: #c4cad4;
}

.meta-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 0 18px;
}

.meta-label,
.upload-title {
  color: #111827;
  font-size: 13px;
  font-weight: 600;
}

.tag-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-chip {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.tag-chip.active {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

.helper-copy {
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.6;
}

.upload-panel {
  margin-bottom: 24px;
  padding: 22px 24px;
  border: 1px solid #eef1f4;
  border-radius: 16px;
  background: #fbfbfc;
}

.upload-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.upload-title,
.upload-subtitle {
  margin: 0;
}

.upload-subtitle {
  margin-top: 6px;
  color: #9ca3af;
  font-size: 13px;
}

.ghost-button {
  height: 36px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.file-input {
  display: none;
}

.upload-empty {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 18px;
  border: 1px dashed #d7dce4;
  border-radius: 14px;
  color: #9ca3af;
  font-size: 13px;
}

.upload-empty-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  color: #6b7280;
  font-size: 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.image-card {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: #eef2f7;
}

.image-card img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  right: 10px;
  bottom: 10px;
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.78);
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}

.content-editor {
  min-height: 520px;
}

.preview-head {
  padding-bottom: 28px;
}

.preview-title {
  margin: 0;
  color: #111827;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.25;
}

.preview-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  color: #9ca3af;
  font-size: 14px;
}

.preview-tag {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #111827;
}

.preview-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 28px;
}

.preview-gallery img {
  width: 100%;
  border-radius: 16px;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

.preview-body {
  color: #374151;
  font-size: 17px;
  line-height: 1.95;
}

.preview-empty {
  color: #b1bac7;
  font-size: 16px;
  line-height: 1.9;
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
  color: #111827;
  line-height: 1.35;
}

.rich-content :deep(blockquote) {
  padding: 14px 18px;
  border-left: 4px solid #d1d5db;
  border-radius: 0 12px 12px 0;
  background: #f8fafc;
  color: #4b5563;
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

:deep(.editor-toolbar) {
  border: 0 !important;
  background: transparent !important;
}

:deep(.editor-toolbar .w-e-bar) {
  flex-wrap: wrap;
  gap: 4px 2px;
  background: transparent;
}

:deep(.editor-toolbar .w-e-bar-item) {
  height: 34px;
  margin: 0;
  border-radius: 8px;
}

:deep(.editor-toolbar .w-e-bar-divider) {
  margin: 8px 6px;
}

:deep(.editor-instance) {
  border: 0 !important;
  background: transparent !important;
}

:deep(.editor-instance .w-e-text-container) {
  background: transparent !important;
}

:deep(.editor-instance .w-e-scroll) {
  min-height: 520px;
}

:deep(.editor-instance [data-slate-editor]) {
  min-height: 520px;
  padding: 0 !important;
  color: #374151;
  font-size: 16px;
  line-height: 1.9;
}

:deep(.editor-instance [data-slate-placeholder]) {
  color: #c4cad4 !important;
}

:deep(.editor-instance .w-e-text-placeholder) {
  top: 0 !important;
}

@media (max-width: 780px) {
  .create-topbar {
    grid-template-columns: 1fr;
    height: auto;
    padding: 16px 18px;
  }

  .draft-status {
    align-items: flex-start;
  }

  .topbar-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .create-body {
    padding: 20px 14px 36px;
  }

  .editor-pane,
  .preview-pane {
    padding: 22px 20px 28px;
  }

  .title-input,
  .preview-title {
    font-size: 30px;
  }

  .meta-row,
  .upload-head {
    flex-direction: column;
  }

  .image-grid,
  .preview-gallery {
    grid-template-columns: 1fr;
  }
}
</style>
