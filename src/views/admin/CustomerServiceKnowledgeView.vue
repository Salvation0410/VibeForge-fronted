<template>
  <section class="knowledge-page">
    <a-card class="hero-card" :bordered="false">
      <div class="hero-layout">
        <div>
          <span class="eyebrow">Customer service knowledge</span>
          <h2>客服知识库</h2>
          <p>统一管理客服检索文档、索引状态和 ETL 任务。文件只经由业务后端上传与处理。</p>
        </div>

        <a-space wrap>
          <input
            ref="fileInputRef"
            class="visually-hidden"
            type="file"
            accept=".pdf,.docx,.md,.markdown,.txt"
            @change="handleFileChange"
          />
          <a-button :disabled="uploading" @click="chooseFile">选择文件</a-button>
          <a-button
            type="primary"
            :loading="uploading"
            :disabled="!selectedFile"
            @click="handleUpload"
          >
            上传并索引
          </a-button>
          <a-button :loading="listLoading" @click="loadDocuments">刷新列表</a-button>
          <a-button danger :loading="rebuilding" @click="confirmRebuild">全量重建</a-button>
        </a-space>
      </div>

      <div class="selected-file" aria-live="polite">
        <template v-if="selectedFile">
          <strong>{{ selectedFile.name }}</strong>
          <span>{{ formatFileSize(selectedFile.size) }}</span>
          <a-button type="link" size="small" :disabled="uploading" @click="clearSelectedFile">
            取消选择
          </a-button>
        </template>
        <span v-else>支持 PDF、DOCX、MD、MARKDOWN、TXT，单个文件不超过 20 MiB。</span>
      </div>
    </a-card>

    <div class="health-grid" aria-label="知识库服务健康状态">
      <a-card v-for="item in healthItems" :key="item.key" class="health-card" :bordered="false">
        <span>{{ item.label }}</span>
        <a-tag :color="item.ready ? 'success' : 'error'">
          {{ item.ready ? '正常' : '不可用' }}
        </a-tag>
      </a-card>
    </div>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="documents"
        :loading="listLoading"
        :pagination="false"
        :row-key="(record: CustomerServiceKnowledgeDocument) => String(record.id)"
        :scroll="{ x: 1320 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="name-cell">
              <strong>{{ record.name || '未命名文档' }}</strong>
              <span>{{ formatFileSize(record.fileSize) }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'fileType'">
            <a-tag color="blue">{{ String(record.fileType || '-').toUpperCase() }}</a-tag>
          </template>

          <template v-else-if="column.key === 'version'">
            <span>{{ record.documentVersion ?? 0 }} / {{ record.indexedVersion ?? 0 }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="documentStatus(record.status).color">
              {{ documentStatus(record.status).label }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'lastErrorCode'">
            <code class="error-code">{{
              normalizeCustomerServiceErrorCode(record.lastErrorCode)
            }}</code>
          </template>

          <template v-else-if="column.key === 'updateTime'">
            {{ formatDateTime(record.updateTime) }}
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space wrap>
              <a-button type="link" @click="openTasks(record)">ETL 历史</a-button>
              <a-button
                v-if="canRetryCustomerServiceKnowledgeDocument(record.status)"
                type="link"
                :loading="isOperating(record.id, 'reindex')"
                :disabled="hasDocumentOperation(record.id)"
                @click="handleDocumentAction(record, 'reindex')"
              >
                重试索引
              </a-button>
              <a-button
                v-if="record.status === 'ACTIVE'"
                type="link"
                :loading="isOperating(record.id, 'disable')"
                :disabled="hasDocumentOperation(record.id)"
                @click="handleDocumentAction(record, 'disable')"
              >
                停用
              </a-button>
              <a-button
                v-if="record.status === 'DISABLED'"
                type="link"
                :loading="isOperating(record.id, 'enable')"
                :disabled="hasDocumentOperation(record.id)"
                @click="handleDocumentAction(record, 'enable')"
              >
                启用
              </a-button>
              <a-button
                type="link"
                danger
                :loading="isOperating(record.id, 'delete')"
                :disabled="hasDocumentOperation(record.id)"
                @click="confirmDelete(record)"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="pagination-row">
        <a-pagination
          v-model:current="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          @change="loadDocuments"
        />
      </div>
    </a-card>

    <a-drawer v-model:open="tasksOpen" width="760" title="ETL 任务历史" destroy-on-close>
      <a-spin :spinning="tasksLoading">
        <a-empty v-if="!tasksLoading && tasks.length === 0" description="暂无任务记录" />
        <a-timeline v-else>
          <a-timeline-item v-for="task in tasks" :key="String(task.id)">
            <div class="task-card">
              <div class="task-heading">
                <strong>{{ operationLabel(task.operation) }}</strong>
                <a-tag :color="taskStatus(task.status).color">
                  {{ taskStatus(task.status).label }}
                </a-tag>
              </div>
              <div class="task-meta">
                <span>文档版本 {{ task.documentVersion }}</span>
                <span>ETL 版本 {{ task.etlVersion }}</span>
                <span>重试 {{ task.retryCount ?? 0 }} 次</span>
              </div>
              <div class="task-meta">
                <span>{{ formatDateTime(task.updateTime || task.createTime) }}</span>
                <code>{{ normalizeCustomerServiceErrorCode(task.lastErrorCode) }}</code>
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
      </a-spin>
    </a-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import type { TableProps } from 'ant-design-vue'
import { message, Modal } from 'ant-design-vue'
import {
  deleteCustomerServiceKnowledgeDocument,
  disableCustomerServiceKnowledgeDocument,
  enableCustomerServiceKnowledgeDocument,
  getCustomerServiceKnowledgeHealth,
  getCustomerServiceKnowledgePage,
  getCustomerServiceKnowledgeTasks,
  rebuildCustomerServiceKnowledge,
  reindexCustomerServiceKnowledgeDocument,
  uploadCustomerServiceKnowledgeDocument,
  type CustomerServiceKnowledgeDocument,
  type CustomerServiceKnowledgeHealth,
  type CustomerServiceKnowledgeId,
  type CustomerServiceKnowledgeTask,
} from '@/api/customerService'
import { formatDateTime, isSuccessCode } from '@/utils/appUtils'
import {
  canRetryCustomerServiceKnowledgeDocument,
  getCustomerServiceDocumentStatus,
  getCustomerServiceTaskStatus,
  normalizeCustomerServiceErrorCode,
  validateCustomerServiceKnowledgeFile,
} from '@/utils/customerService'

type DocumentAction = 'reindex' | 'enable' | 'disable' | 'delete'

const columns: TableProps['columns'] = [
  { title: '文档名', key: 'name', width: 260 },
  { title: '类型', key: 'fileType', width: 90 },
  { title: '文档 / 索引版本', key: 'version', width: 150 },
  { title: '状态', key: 'status', width: 120 },
  { title: '分片数', dataIndex: 'chunkCount', key: 'chunkCount', width: 90 },
  { title: '最近错误码', key: 'lastErrorCode', width: 250 },
  { title: '更新时间', key: 'updateTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 270 },
]

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const rebuilding = ref(false)
const listLoading = ref(false)
const documents = ref<CustomerServiceKnowledgeDocument[]>([])
const health = ref<CustomerServiceKnowledgeHealth>({
  enabled: false,
  coordinator: false,
  python: false,
})
const operations = ref(new Set<string>())
const tasksOpen = ref(false)
const tasksLoading = ref(false)
const tasks = ref<CustomerServiceKnowledgeTask[]>([])

const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

const healthItems = computed(() => [
  { key: 'enabled', label: '知识库功能', ready: health.value.enabled },
  { key: 'coordinator', label: '任务协调器', ready: health.value.coordinator },
  { key: 'python', label: 'AI ETL 服务', ready: health.value.python },
])

function documentStatus(status?: string | null) {
  return getCustomerServiceDocumentStatus(status)
}

function taskStatus(status?: string | null) {
  return getCustomerServiceTaskStatus(status)
}

function formatFileSize(size?: number) {
  const bytes = Number(size || 0)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`
}

function operationLabel(operation?: string) {
  const labels: Record<string, string> = { INDEX: '索引', DELETE: '删除索引', REBUILD: '全量重建' }
  return labels[String(operation || '').toUpperCase()] || '未知操作'
}

function operationKey(id: CustomerServiceKnowledgeId, action: DocumentAction) {
  return `${id}:${action}`
}

function setOperating(id: CustomerServiceKnowledgeId, action: DocumentAction, active: boolean) {
  const next = new Set(operations.value)
  const key = operationKey(id, action)
  if (active) {
    next.add(key)
  } else {
    next.delete(key)
  }
  operations.value = next
}

function isOperating(id: CustomerServiceKnowledgeId, action: DocumentAction) {
  return operations.value.has(operationKey(id, action))
}

function hasDocumentOperation(id: CustomerServiceKnowledgeId) {
  return Array.from(operations.value).some((key) => key.startsWith(`${id}:`))
}

function chooseFile() {
  fileInputRef.value?.click()
}

function clearSelectedFile() {
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const validation = validateCustomerServiceKnowledgeFile(file)
  if (!validation.valid) {
    message.error(validation.message)
    clearSelectedFile()
    return
  }
  selectedFile.value = file
}

async function loadDocuments() {
  if (listLoading.value) return
  listLoading.value = true
  try {
    const [pageResult, healthResult] = await Promise.allSettled([
      getCustomerServiceKnowledgePage({
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
      }),
      getCustomerServiceKnowledgeHealth(),
    ])
    if (pageResult.status !== 'fulfilled') {
      throw new Error('knowledge page unavailable')
    }
    const pageResponse = pageResult.value
    if (!isSuccessCode(pageResponse.code)) {
      throw new Error(pageResponse.message || '知识文档加载失败')
    }
    documents.value = Array.isArray(pageResponse.data?.records) ? pageResponse.data.records : []
    pagination.total = Number(pageResponse.data?.totalRow || 0)
    if (
      healthResult.status === 'fulfilled' &&
      isSuccessCode(healthResult.value.code) &&
      healthResult.value.data
    ) {
      health.value = healthResult.value.data
    } else {
      health.value = { enabled: false, coordinator: false, python: false }
    }
  } catch {
    message.error('知识库信息加载失败，请稍后重试')
  } finally {
    listLoading.value = false
  }
}

async function handleUpload() {
  const file = selectedFile.value
  if (!file || uploading.value) return
  const validation = validateCustomerServiceKnowledgeFile(file)
  if (!validation.valid) {
    message.error(validation.message)
    clearSelectedFile()
    return
  }

  uploading.value = true
  try {
    const response = await uploadCustomerServiceKnowledgeDocument(file)
    if (!isSuccessCode(response.code)) {
      throw new Error(response.message || '上传失败')
    }
    message.success('文档已上传，索引任务已提交')
    pagination.current = 1
    await loadDocuments()
  } catch {
    message.error('文档上传失败，请检查文件后重试')
  } finally {
    uploading.value = false
    clearSelectedFile()
  }
}

async function handleDocumentAction(
  document: CustomerServiceKnowledgeDocument,
  action: Exclude<DocumentAction, 'delete'>,
) {
  if (hasDocumentOperation(document.id)) return
  setOperating(document.id, action, true)
  try {
    const actionMap = {
      reindex: reindexCustomerServiceKnowledgeDocument,
      enable: enableCustomerServiceKnowledgeDocument,
      disable: disableCustomerServiceKnowledgeDocument,
    }
    const response = await actionMap[action](document.id)
    if (!isSuccessCode(response.code)) throw new Error(response.message || '操作失败')
    message.success(
      action === 'disable' ? '文档已停用' : action === 'enable' ? '文档已启用' : '重试任务已提交',
    )
    await loadDocuments()
  } catch {
    message.error('操作失败，请稍后重试')
  } finally {
    setOperating(document.id, action, false)
  }
}

function confirmDelete(document: CustomerServiceKnowledgeDocument) {
  if (hasDocumentOperation(document.id)) return
  Modal.confirm({
    title: '确认删除该知识文档？',
    content: `“${document.name || '未命名文档'}”删除后无法恢复，并会异步清理对应索引。`,
    okText: '确认删除',
    cancelText: '取消',
    okType: 'danger',
    async onOk() {
      setOperating(document.id, 'delete', true)
      try {
        const response = await deleteCustomerServiceKnowledgeDocument(document.id)
        if (!isSuccessCode(response.code)) throw new Error(response.message || '删除失败')
        message.success('文档删除任务已提交')
        await loadDocuments()
      } catch {
        message.error('删除失败，请稍后重试')
        throw new Error('delete failed')
      } finally {
        setOperating(document.id, 'delete', false)
      }
    },
  })
}

async function openTasks(document: CustomerServiceKnowledgeDocument) {
  tasksOpen.value = true
  tasksLoading.value = true
  tasks.value = []
  try {
    const response = await getCustomerServiceKnowledgeTasks(document.id, 20)
    if (!isSuccessCode(response.code)) throw new Error(response.message || '任务历史加载失败')
    tasks.value = Array.isArray(response.data) ? response.data : []
  } catch {
    message.error('ETL 历史加载失败，请稍后重试')
  } finally {
    tasksLoading.value = false
  }
}

function confirmRebuild() {
  if (rebuilding.value) return
  Modal.confirm({
    title: '确认全量重建客服知识库？',
    content: '该操作会创建全量重建任务，期间检索结果可能短暂延迟更新。',
    okText: '确认重建',
    cancelText: '取消',
    okType: 'danger',
    async onOk() {
      rebuilding.value = true
      try {
        const response = await rebuildCustomerServiceKnowledge()
        if (!isSuccessCode(response.code)) throw new Error(response.message || '重建提交失败')
        message.success('全量重建任务已提交')
        await loadDocuments()
      } catch {
        message.error('全量重建提交失败，请稍后重试')
        throw new Error('rebuild failed')
      } finally {
        rebuilding.value = false
      }
    },
  })
}

onBeforeUnmount(clearSelectedFile)
void loadDocuments()
</script>

<style scoped>
.knowledge-page {
  display: grid;
  gap: 20px;
}

.hero-card,
.table-card,
.health-card {
  border-radius: 20px;
  box-shadow: 0 18px 50px rgba(23, 42, 74, 0.08);
}

.hero-card {
  background: linear-gradient(135deg, #f7fcff 0%, #ffffff 58%, #f3f8ff 100%);
}

.hero-layout {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  color: #1683a4;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-layout h2 {
  margin: 6px 0 8px;
  color: #152238;
  font-size: 32px;
}

.hero-layout p,
.selected-file,
.name-cell span,
.task-meta {
  color: #6b7b91;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  margin-top: 18px;
}

.selected-file strong {
  color: #26364d;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.health-card :deep(.ant-card-body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name-cell,
.task-card {
  display: grid;
  gap: 6px;
}

.error-code,
.task-meta code {
  color: #5b687d;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.task-card {
  padding: 12px 14px;
  border: 1px solid #edf1f6;
  border-radius: 12px;
  background: #fafcff;
}

.task-heading,
.task-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .hero-layout {
    flex-direction: column;
  }

  .health-grid {
    grid-template-columns: 1fr;
  }
}
</style>
