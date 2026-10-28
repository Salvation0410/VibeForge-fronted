<template>
  <section class="knowledge-page">
    <header class="knowledge-header">
      <div class="hero-layout">
        <div>
          <span class="section-eyebrow"><span></span> KNOWLEDGE LIBRARY</span>
          <h2>客服知识库</h2>
          <p>把可靠的知识，变成每一次有据可循的回答。</p>
        </div>

        <a-space class="header-actions" wrap>
          <a-button :loading="listLoading" @click="emit('refresh')">
            <template #icon><ReloadOutlined /></template>
            刷新列表
          </a-button>
        </a-space>
      </div>
    </header>

    <div class="health-strip" aria-label="知识库服务健康状态">
      <span class="health-caption"><SafetyCertificateOutlined /> 服务状态</span>
      <div class="health-grid">
        <div v-for="item in healthItems" :key="item.key" class="health-item">
          <span
            class="health-dot"
            :class="`health-dot--${item.color || (item.ready ? 'success' : 'error')}`"
          ></span>
          <span>{{ item.label }}</span>
          <strong
            :class="{ 'health-warning': item.color === 'error' || (!item.color && !item.ready) }"
            >{{ item.status || (item.ready ? '正常' : '不可用') }}</strong
          >
        </div>
      </div>
    </div>

    <a-alert
      v-if="healthError || (healthLoaded && !knowledgeReady)"
      type="warning"
      show-icon
      :message="
        healthError
          ? '暂时无法获取知识库服务状态'
          : !health.enabled
            ? '客服知识库尚未启用'
            : '文档处理服务暂不可用'
      "
    />

    <section class="upload-panel" aria-labelledby="upload-heading">
      <div class="upload-intro">
        <div class="upload-symbol" aria-hidden="true"><FolderOpenOutlined /></div>
        <div>
          <span class="panel-eyebrow">让知识持续生长</span>
          <h3 id="upload-heading">添加一份新知识</h3>
          <p>上传产品说明、常见问题或操作指南，供客服检索参考。</p>
          <div class="format-list" aria-label="支持的文件格式">
            <span>PDF</span><span>DOCX</span><span>MD</span><span>TXT</span>
            <small>单个文件 ≤ 20 MiB</small>
          </div>
        </div>
      </div>
      <div class="upload-controls" :class="{ 'has-selection': selectedFile }">
        <input
          :ref="registerFileInput"
          class="visually-hidden"
          type="file"
          accept=".pdf,.docx,.md,.txt"
          @change="emit('file-change', $event)"
        />
        <div class="selected-file" aria-live="polite">
          <template v-if="selectedFile">
            <FileTextOutlined class="selection-icon" />
            <div class="selection-details">
              <strong>{{ selectedFile.name }}</strong>
              <span>{{ formatFileSize(selectedFile.size) }} · 等待上传</span>
            </div>
            <a-button type="link" size="small" :disabled="uploading" @click="emit('clear-file')">
              移除
            </a-button>
          </template>
          <template v-else>
            <FileAddOutlined class="selection-icon" />
            <div class="selection-details">
              <strong>{{ uploading ? '文档正在上传' : '从一份文档开始' }}</strong>
              <span>{{
                uploading ? '请稍候，上传完成后将进入处理队列' : '选择本地文件，上传后自动排队处理'
              }}</span>
            </div>
          </template>
        </div>
        <div class="upload-actions">
          <a-button :disabled="uploading" @click="emit('choose-file')">
            <template #icon><FileAddOutlined /></template>
            {{ selectedFile ? '重新选择' : '选择文档' }}
          </a-button>
          <a-button
            type="primary"
            :loading="uploading"
            :disabled="!selectedFile || !knowledgeReady"
            @click="emit('upload')"
          >
            <template #icon><UploadOutlined /></template>
            添加到知识库
          </a-button>
        </div>
      </div>
    </section>

    <div class="document-section">
      <div class="document-heading">
        <div>
          <div class="document-title">
            <h3>知识文档</h3>
            <span class="document-count" aria-label="文档总数">{{ pagination.total }}</span>
          </div>
          <p>管理知识来源，查看每份文档的处理状态。</p>
        </div>
        <a-button
          class="rebuild-button"
          :disabled="!knowledgeReady"
          :loading="rebuilding"
          @click="emit('rebuild')"
        >
          <template #icon><SyncOutlined /></template>
          重建全部索引
        </a-button>
      </div>
      <a-alert v-if="listError" type="error" show-icon :message="listError" class="list-error" />
      <a-table
        :columns="columns"
        :data-source="documents"
        :loading="listLoading"
        :pagination="false"
        :row-key="(record: CustomerServiceKnowledgeDocument) => String(record.id)"
        :scroll="{ x: 1020 }"
        :locale="{ emptyText: listError ? '文档列表未加载' : '暂无知识文档' }"
      >
        <template #emptyText>
          <div class="document-empty">
            <ReadOutlined aria-hidden="true" />
            <strong>{{ listError ? '文档列表暂未加载' : '知识库，等待你的第一份文档' }}</strong>
            <p>
              {{ listError ? '请点击上方刷新列表重试。' : '在上方添加文档，让客服回答有据可循。' }}
            </p>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="name-cell">
              <div
                class="file-emblem"
                :data-type="String(record.fileType || '').toLowerCase()"
                aria-hidden="true"
              >
                <FileTextOutlined />
              </div>
              <div class="file-details">
                <strong :title="record.name">{{ record.name || '未命名文档' }}</strong>
                <span
                  ><b>{{ String(record.fileType || '文件').toUpperCase() }}</b
                  ><i>·</i>{{ formatFileSize(record.fileSize) }}</span
                >
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'version'">
            <span class="chunk-count">{{ record.chunkCount ?? 0 }} <small>分片</small></span>
            <span class="version-detail" title="文档版本 / 索引版本">
              版本 {{ formatCustomerServiceLongValue(record.documentVersion, '0') }} /
              {{ formatCustomerServiceLongValue(record.indexedVersion, '0') }}
            </span>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="documentStatus(record.status).color">
              {{ documentStatus(record.status).label }}
            </a-tag>
            <div class="status-detail">{{ documentProgress?.(record) }}</div>
            <code v-if="record.lastErrorCode" class="error-code">{{
              normalizeCustomerServiceErrorCode(record.lastErrorCode)
            }}</code>
          </template>

          <template v-else-if="column.key === 'updateTime'">
            {{ formatDateTime(record.updateTime) }}
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space class="row-actions" :size="2" wrap>
              <a-button
                type="link"
                :loading="isTaskLoading(record.id)"
                :disabled="isTaskLoading(record.id)"
                @click="emit('open-tasks', record)"
              >
                处理记录
              </a-button>
              <a-button
                v-if="canRetryCustomerServiceKnowledgeDocument(record.status)"
                type="link"
                :loading="isOperating(record.id, 'reindex')"
                :disabled="hasDocumentOperation(record.id)"
                @click="emit('document-action', record, 'reindex')"
              >
                重试索引
              </a-button>
              <a-button
                v-if="record.status === 'ACTIVE'"
                type="link"
                :loading="isOperating(record.id, 'disable')"
                :disabled="hasDocumentOperation(record.id)"
                @click="emit('document-action', record, 'disable')"
              >
                停用
              </a-button>
              <a-button
                v-if="record.status === 'DISABLED'"
                type="link"
                :loading="isOperating(record.id, 'enable')"
                :disabled="hasDocumentOperation(record.id)"
                @click="emit('document-action', record, 'enable')"
              >
                启用
              </a-button>
              <a-button
                type="link"
                danger
                :loading="isOperating(record.id, 'delete')"
                :disabled="hasDocumentOperation(record.id)"
                @click="emit('delete-document', record)"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="pagination-row">
        <span class="refresh-status" aria-live="polite">
          {{ lastRefreshed ? `最近更新 ${formatDateTime(lastRefreshed)}` : '' }}
        </span>
        <a-pagination
          :current="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          @change="(page: number, size: number) => emit('page-change', page, size)"
        />
      </div>
    </div>

    <a-drawer
      :open="tasksOpen"
      @update:open="emit('update:tasksOpen', $event)"
      width="min(760px, 100vw)"
      title="文档处理记录"
      destroy-on-close
      @close="emit('close-tasks')"
    >
      <template #title>
        <div class="drawer-heading">
          <span class="panel-eyebrow">DOCUMENT ACTIVITY</span>
          <strong>文档处理记录</strong>
        </div>
      </template>
      <div class="drawer-intro"><HistoryOutlined /> 追踪文档从上传到可检索的处理过程</div>
      <a-spin :spinning="tasksLoading">
        <a-alert v-if="tasksError" type="error" show-icon :message="tasksError" />
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
                <span
                  >文档版本 {{ formatCustomerServiceLongValue(task.documentVersion, '0') }}</span
                >
                <span>ETL 版本 {{ formatCustomerServiceLongValue(task.etlVersion, '0') }}</span>
                <span>重试 {{ task.retryCount ?? 0 }} 次</span>
              </div>
              <div class="status-detail">{{ taskProgress?.(task) }}</div>
              <div v-if="task.status === 'PENDING'" class="task-meta">
                下次调度（UTC）：{{ formatDateTime(task.nextRetryTime) }}
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
import type { ComponentPublicInstance } from 'vue'
import type { TableProps } from 'ant-design-vue'
import {
  FileAddOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  ReadOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import type {
  CustomerServiceKnowledgeDocument,
  CustomerServiceKnowledgeHealth,
  CustomerServiceKnowledgeId,
  CustomerServiceKnowledgeTask,
} from '@/api/customerService'
import { formatDateTime } from '@/utils/appUtils'
import {
  canRetryCustomerServiceKnowledgeDocument,
  formatCustomerServiceFileSize as formatFileSize,
  formatCustomerServiceLongValue,
  getCustomerServiceDocumentStatus as documentStatus,
  getCustomerServiceTaskStatus as taskStatus,
  normalizeCustomerServiceErrorCode,
} from '@/utils/customerService'

type DocumentAction = 'reindex' | 'enable' | 'disable' | 'delete'

// 展示层不发请求、不持有轮询或操作锁，业务状态与确认操作统一由页面负责。
withDefaults(
  defineProps<{
    selectedFile: File | null
    uploading: boolean
    listLoading: boolean
    documents: CustomerServiceKnowledgeDocument[]
    health: CustomerServiceKnowledgeHealth
    healthItems: { key: string; label: string; ready: boolean; color?: string; status?: string }[]
    healthLoaded?: boolean
    healthError?: boolean
    knowledgeReady?: boolean
    listError?: string
    tasksError?: string
    lastRefreshed?: string
    rebuilding: boolean
    pagination: { current: number; pageSize: number; total: number }
    tasksOpen: boolean
    tasksLoading: boolean
    tasks: CustomerServiceKnowledgeTask[]
    isTaskLoading: (id: CustomerServiceKnowledgeId) => boolean
    isOperating: (id: CustomerServiceKnowledgeId, action: DocumentAction) => boolean
    hasDocumentOperation: (id: CustomerServiceKnowledgeId) => boolean
    documentProgress?: (document: CustomerServiceKnowledgeDocument) => string
    taskProgress?: (task: CustomerServiceKnowledgeTask) => string
  }>(),
  {
    healthLoaded: false,
    healthError: false,
    knowledgeReady: true,
    listError: '',
    tasksError: '',
    lastRefreshed: '',
  },
)

const emit = defineEmits<{
  refresh: []
  'file-input': [element: HTMLInputElement | null]
  'file-change': [event: Event]
  'clear-file': []
  'choose-file': []
  upload: []
  rebuild: []
  'open-tasks': [document: CustomerServiceKnowledgeDocument]
  'delete-document': [document: CustomerServiceKnowledgeDocument]
  'document-action': [
    document: CustomerServiceKnowledgeDocument,
    action: Exclude<DocumentAction, 'delete'>,
  ]
  'page-change': [page: number, size: number]
  'update:tasksOpen': [open: boolean]
  'close-tasks': []
}>()

function registerFileInput(element: Element | ComponentPublicInstance | null) {
  emit('file-input', element instanceof HTMLInputElement ? element : null)
}

function operationLabel(operation?: string) {
  const labels: Record<string, string> = { INDEX: '索引', DELETE: '删除索引', REBUILD: '全量重建' }
  return labels[String(operation || '').toUpperCase()] || '未知操作'
}

// 将同一文档的元信息归组，状态和异常就近展示，避免管理表格被次要字段撑宽。
const columns: TableProps['columns'] = [
  { title: '文档', key: 'name', width: 280 },
  { title: '索引状态', key: 'status', width: 210 },
  { title: '内容索引', key: 'version', width: 125 },
  { title: '更新时间', key: 'updateTime', width: 175 },
  { title: '操作', key: 'action', fixed: 'right', width: 230 },
]
</script>

<style scoped>
.knowledge-page {
  --ink: #183b46;
  --muted: #71818a;
  --accent: #087f8c;
  --line: #e4ebed;
  display: grid;
  gap: 22px;
  width: 100%;
  min-width: 0;
  color: var(--ink);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.knowledge-header {
  padding: 10px 2px 0;
}
.hero-layout,
.document-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.section-eyebrow,
.panel-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
  font-size: 10px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: 2px;
}
.section-eyebrow > span {
  width: 16px;
  height: 2px;
  background: currentColor;
}
.hero-layout h2 {
  margin: 10px 0 9px;
  font-size: clamp(27px, 2.6vw, 36px);
  font-weight: 650;
  letter-spacing: -1px;
  line-height: 1.3;
}
.hero-layout p,
.document-heading p,
.upload-intro p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}
.header-actions {
  flex-shrink: 0;
}
.knowledge-page :deep(.ant-btn) {
  height: 36px;
  border-radius: 7px;
  box-shadow: none;
  font-size: 13px;
}
.knowledge-page :deep(.ant-btn-default) {
  border-color: #dbe5e8;
  color: #405b65;
  background: #fff;
}
.knowledge-page :deep(.ant-btn-default:not(:disabled):hover) {
  border-color: var(--accent);
  color: var(--accent);
}
.knowledge-page :deep(.ant-btn-primary:not(:disabled)) {
  background: var(--accent);
}
.knowledge-page :deep(.ant-btn-primary:not(:disabled):hover) {
  background: #066a76;
}
.knowledge-page :deep(.ant-btn:focus-visible) {
  outline: 3px solid #91ccd1;
  outline-offset: 3px;
}
.health-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 26px;
  padding: 14px 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
}
.health-caption {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #536f78;
  font-size: 12px;
  font-weight: 600;
}
.health-caption > .anticon {
  color: var(--accent);
  font-size: 16px;
}
.health-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 28px;
}
.health-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--muted);
}
.health-item strong {
  font-size: 11px;
  font-weight: 500;
  color: #31775f;
}
.health-item .health-warning {
  color: #b65b40;
}
.health-dot {
  flex: 0 0 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a4afb4;
}
.health-dot--success {
  background: #3b9a79;
  box-shadow: 0 0 0 3px #ecf7f1;
}
.health-dot--error {
  background: #cb775a;
  box-shadow: 0 0 0 3px #fcf0eb;
}
.upload-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(290px, 0.9fr);
  align-items: center;
  gap: 28px;
  position: relative;
  overflow: hidden;
  padding: 28px;
  border: 1px solid #dbe8e9;
  border-radius: 12px;
  background: linear-gradient(110deg, #f0f7f7 0%, #f7faf9 65%, #fff 100%);
}
.upload-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: #218b95;
}
.upload-intro {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  min-width: 0;
}
.upload-symbol {
  display: grid;
  place-items: center;
  flex: 0 0 50px;
  width: 50px;
  height: 56px;
  border: 1px solid #c4dfe0;
  border-radius: 10px;
  color: var(--accent);
  background: #fff;
  box-shadow: 3px 4px 0 #dfeded;
  font-size: 25px;
}
.upload-intro .panel-eyebrow {
  font-size: 10px;
  letter-spacing: 1px;
}
.upload-intro h3 {
  margin: 7px 0 8px;
  color: var(--ink);
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.4px;
}
.format-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 15px;
}
.format-list > span {
  padding: 2px 5px;
  border: 1px solid #d8e5e5;
  border-radius: 3px;
  background: #ffffffa8;
  color: #58777c;
  font:
    10px/1.5 Consolas,
    monospace;
}
.format-list small {
  margin-left: 4px;
  font-size: 11px;
  color: var(--muted);
}
.upload-controls {
  min-width: 0;
  padding: 20px;
  background: #ffffffb8;
  border: 1px dashed #c8dadd;
  border-radius: 9px;
}
.upload-controls.has-selection {
  border-style: solid;
  border-color: #9cc8cd;
  background: #fff;
}
.selected-file {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 46px;
}
.selection-icon {
  flex: 0 0 24px;
  color: #72a2ab;
  font-size: 25px;
}
.selection-details {
  display: grid;
  gap: 5px;
  min-width: 0;
  flex: 1;
}
.selection-details strong {
  color: #385965;
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.selection-details span {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}
.upload-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.document-section {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}
.document-heading {
  padding: 23px 24px;
}
.document-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.document-title h3 {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
  font-weight: 650;
}
.document-count {
  min-width: 24px;
  padding: 1px 7px;
  border-radius: 5px;
  background: #eaf3f3;
  color: var(--accent);
  text-align: center;
  font:
    12px/1.7 Consolas,
    monospace;
}
.document-heading p {
  margin-top: 5px;
  font-size: 12px;
}
.knowledge-page .rebuild-button {
  background: #fafcfc;
  color: #607981;
  font-size: 12px;
}
.list-error {
  margin: 0 24px 16px;
}
.document-section :deep(.ant-table) {
  font-size: 12px;
  color: #45606c;
}
.document-section :deep(.ant-table-thead > tr > th) {
  padding: 12px 18px;
  border-block: 1px solid #e8eef0;
  background: #f8fafb;
  color: #7b8d94;
  font-size: 11px;
  font-weight: 500;
}
.document-section :deep(.ant-table-tbody > tr > td) {
  padding: 20px 18px;
  border-bottom: 1px solid #edf1f2;
  vertical-align: top;
}
.document-section :deep(.ant-table-tbody > tr:hover > td) {
  background: #f7fbfb;
}
.document-section :deep(.ant-table-cell::before) {
  display: none;
}
.document-section :deep(.ant-table-cell-fix-right-first::after) {
  box-shadow: -5px 0 8px -6px #b6c9cd;
}
.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.file-emblem {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 42px;
  border: 1px solid #e0e9ee;
  border-radius: 7px;
  background: #f2f7fa;
  color: #5c8a9b;
  font-size: 19px;
}
.file-emblem[data-type='pdf'] {
  color: #bf7865;
  background: #fdf4f0;
  border-color: #f1dfd7;
}
.file-emblem[data-type='md'],
.file-emblem[data-type='txt'] {
  color: #699181;
  background: #f1f7f3;
  border-color: #dfeae3;
}
.file-details {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.file-details strong {
  color: #284a58;
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
  line-height: 1.65;
}
.file-details span {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #8b999f;
  font-size: 10px;
}
.file-details b {
  font-weight: 500;
  letter-spacing: 0.4px;
}
.file-details i {
  font-style: normal;
}
.document-section :deep(.ant-tag) {
  padding: 1px 7px;
  border: 0;
  border-radius: 4px;
  font-size: 11px;
}
.chunk-count {
  display: block;
  font-family: Consolas, 'Microsoft YaHei', monospace;
  font-size: 15px;
  color: #3f5a66;
}
.chunk-count small {
  color: #8b999f;
  font-size: 10px;
}
.version-detail {
  display: block;
  margin-top: 6px;
  color: #8b999f;
  font-size: 10px;
}
.status-detail,
.refresh-status {
  font-size: 11px;
  color: #83939a;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.status-detail {
  margin-top: 7px;
}
.error-code {
  display: block;
  margin-top: 7px;
  color: #b2715b;
  font-size: 10px;
  overflow-wrap: anywhere;
}
.row-actions {
  column-gap: 3px;
}
.row-actions :deep(.ant-btn-link) {
  height: 25px;
  padding: 0 5px;
  font-size: 12px;
  color: var(--accent);
}
.row-actions :deep(.ant-btn-dangerous) {
  color: #bd7e70;
}
.row-actions :deep(.ant-btn:disabled) {
  color: #aebac1;
}
.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  padding: 18px 24px;
  background: #fdfefe;
}
.refresh-status {
  display: flex;
  align-items: center;
  gap: 7px;
}
.refresh-status:not(:empty)::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #8bb1a7;
}
.pagination-row :deep(.ant-pagination) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: auto;
  font-size: 12px;
}
.pagination-row :deep(.ant-pagination-item-active) {
  border-color: var(--accent);
}
.pagination-row :deep(.ant-pagination-item-active a) {
  color: var(--accent);
}
.document-empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 50px 20px;
}
.document-empty > .anticon {
  padding: 16px;
  border: 1px solid #e3eded;
  border-radius: 14px;
  background: #f5f9f9;
  color: #81a7ad;
  font-size: 30px;
  margin-bottom: 6px;
}
.document-empty strong {
  color: #446570;
  font-size: 14px;
  font-weight: 500;
}
.document-empty p {
  margin: 0;
  color: #95a2a7;
  font-size: 12px;
}
.drawer-heading {
  display: grid;
  gap: 6px;
}
.drawer-heading .panel-eyebrow {
  color: #08838f;
  font-size: 9px;
}
.drawer-heading strong {
  color: #183b46;
  font-size: 18px;
}
.drawer-intro {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 28px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f1f7f7;
  color: #64858a;
  font-size: 12px;
}
.task-card {
  display: grid;
  gap: 9px;
  padding: 17px 18px;
  border: 1px solid #e5eded;
  border-radius: 9px;
  background: #fcfefe;
}
.task-heading,
.task-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.task-heading strong {
  color: #294e5a;
  font-size: 14px;
}
.task-meta {
  color: #87999f;
  font-size: 11px;
  line-height: 1.8;
}
.task-meta code {
  color: #b2715b;
  font-size: 10px;
  overflow-wrap: anywhere;
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
.knowledge-header,
.health-strip,
.upload-panel,
.document-section {
  animation: workspace-enter 400ms ease-out both;
}
.health-strip {
  animation-delay: 40ms;
}
.upload-panel {
  animation-delay: 80ms;
}
.document-section {
  animation-delay: 120ms;
}
@keyframes workspace-enter {
  from {
    opacity: 0;
    transform: translateY(7px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 1150px) {
  .upload-panel {
    grid-template-columns: 1fr;
    gap: 22px;
  }
  .upload-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }
  .upload-actions {
    margin: 0;
    flex-shrink: 0;
  }
}
@media (max-width: 600px) {
  /* 窄屏取消操作列吸附，避免固定列覆盖文档名称；完整表格在容器内横向滚动。 */
  .document-section :deep(.ant-table-cell-fix-right) {
    position: static !important;
  }
  .document-section :deep(.ant-table-cell-fix-right-first::after) {
    display: none;
  }
  .knowledge-page {
    gap: 16px;
  }
  .hero-layout {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }
  .hero-layout h2 {
    font-size: 28px;
  }
  .health-strip {
    gap: 14px;
    padding: 15px;
  }
  .health-grid {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 13px;
  }
  .health-item strong {
    margin-left: auto;
  }
  .upload-panel {
    padding: 22px 18px;
  }
  .upload-intro {
    gap: 13px;
  }
  .upload-symbol {
    flex-basis: 38px;
    width: 38px;
    height: 44px;
    font-size: 21px;
  }
  .upload-intro h3 {
    font-size: 19px;
  }
  .upload-intro p {
    font-size: 12px;
  }
  .upload-controls {
    display: block;
    padding: 16px;
  }
  .upload-actions {
    margin-top: 18px;
  }
  .upload-actions > .ant-btn {
    flex: 1;
  }
  .document-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
    padding: 20px 18px;
  }
  .pagination-row {
    padding: 18px;
  }
  .list-error {
    margin-inline: 18px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .knowledge-header,
  .health-strip,
  .upload-panel,
  .document-section {
    animation: none;
  }
}
</style>
