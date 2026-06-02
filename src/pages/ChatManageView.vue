<template>
  <section class="manage-page">
    <a-card class="toolbar-card">
      <div class="toolbar">
        <div>
          <h2>对话管理</h2>
          <p>按应用、用户和消息内容检索历史对话，支持查看详情并快速进入对应应用工作台。</p>
        </div>

        <a-space wrap>
          <a-input
            v-model:value="query.message"
            placeholder="消息内容"
            style="width: 220px"
            allow-clear
          />
          <a-input
            v-model:value="query.messageType"
            placeholder="消息类型"
            style="width: 140px"
            allow-clear
          />
          <a-input-number v-model:value="query.appId" placeholder="应用 id" style="width: 140px" />
          <a-input-number v-model:value="query.userId" placeholder="用户 id" style="width: 140px" />
          <a-button type="primary" @click="handleSearch">搜索</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-space>
      </div>
    </a-card>

    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="histories"
        :loading="loading"
        :row-key="rowKey"
        :pagination="false"
        :scroll="{ x: 1320 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'messageType'">
            <a-tag :color="record.role === 'user' ? 'blue' : 'cyan'">
              {{ record.messageTypeText }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'message'">
            <div class="message-cell">
              {{ record.message || '-' }}
            </div>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="openDetail(record)">查看内容</a-button>
              <a-button type="link" :disabled="!record.appId" @click="goToApp(record)"
                >进入应用</a-button
              >
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="pagination-row">
        <a-pagination
          v-model:current="query.pageNum"
          v-model:page-size="query.pageSize"
          :total="total"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          @change="loadHistories"
        />
      </div>
    </a-card>

    <a-modal
      v-model:open="detailOpen"
      title="对话消息详情"
      :footer="null"
      :width="720"
      destroy-on-close
    >
      <div class="detail-grid">
        <div class="detail-item">
          <span>消息 ID</span>
          <strong>{{ currentHistory?.id || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span>应用 ID</span>
          <strong>{{ currentHistory?.appId || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span>用户 ID</span>
          <strong>{{ currentHistory?.userId || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span>消息类型</span>
          <strong>{{ currentHistory?.messageTypeText || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span>创建时间</span>
          <strong>{{ currentHistory?.createTime || '-' }}</strong>
        </div>
        <div class="detail-item">
          <span>更新时间</span>
          <strong>{{ currentHistory?.updateTime || '-' }}</strong>
        </div>
      </div>

      <div class="detail-message">
        <div class="detail-message-title">消息内容</div>
        <pre>{{ currentHistory?.message || '-' }}</pre>
      </div>
    </a-modal>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { TableProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import {
  listAllChatHistoryByPageForAdmin,
  type ChatHistory,
  type ChatHistoryQueryRequest,
} from '@/api/chatHistory'
import { formatDateTime, isSuccessCode } from '@/utils/appUtils'
import { getChatMessageTypeText, normalizeChatMessageRole } from '@/utils/chatHistory'

type ChatHistoryRow = ChatHistory & {
  role: 'user' | 'assistant'
  messageTypeText: string
  createTime?: string
  updateTime?: string
}

const router = useRouter()
const loading = ref(false)
const histories = ref<ChatHistoryRow[]>([])
const total = ref(0)
const detailOpen = ref(false)
const currentHistory = ref<ChatHistoryRow | null>(null)

const query = reactive<{
  pageNum: number
  pageSize: number
  message: string
  messageType: string
  appId?: number
  userId?: number
}>({
  pageNum: 1,
  pageSize: 10,
  message: '',
  messageType: '',
  appId: undefined,
  userId: undefined,
})

const columns: TableProps['columns'] = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 110 },
  { title: '应用 ID', dataIndex: 'appId', key: 'appId', width: 120 },
  { title: '用户 ID', dataIndex: 'userId', key: 'userId', width: 120 },
  { title: '消息类型', key: 'messageType', width: 130 },
  { title: '消息内容', key: 'message', width: 420 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 180 },
]

const rowKey = (record: ChatHistoryRow) => record.id || ''

const buildQueryPayload = (): ChatHistoryQueryRequest => {
  const payload: ChatHistoryQueryRequest = {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
  }

  if (query.message.trim()) {
    payload.message = query.message.trim()
  }
  if (query.messageType.trim()) {
    payload.messageType = query.messageType.trim()
  }
  if (query.appId !== undefined && query.appId !== null) {
    payload.appId = query.appId
  }
  if (query.userId !== undefined && query.userId !== null) {
    payload.userId = query.userId
  }

  return payload
}

const loadHistories = async () => {
  loading.value = true
  try {
    const res = await listAllChatHistoryByPageForAdmin(buildQueryPayload())
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '加载对话列表失败')
    }

    const records = Array.isArray(res.data?.records) ? res.data.records : []
    histories.value = records.map((item) => ({
      ...item,
      role: normalizeChatMessageRole(item.messageType),
      messageTypeText: getChatMessageTypeText(item.messageType),
      createTime: formatDateTime(item.createTime),
      updateTime: formatDateTime(item.updateTime),
    }))
    total.value = Number(res.data?.totalRow || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载对话列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  query.pageNum = 1
  await loadHistories()
}

const resetSearch = async () => {
  query.pageNum = 1
  query.pageSize = 10
  query.message = ''
  query.messageType = ''
  query.appId = undefined
  query.userId = undefined
  await loadHistories()
}

const openDetail = (record: ChatHistoryRow) => {
  currentHistory.value = record
  detailOpen.value = true
}

const goToApp = (record: ChatHistoryRow) => {
  if (!record.appId) {
    return
  }
  router.push(`/apps/${record.appId}/chat`)
}

void loadHistories()
</script>

<style scoped>
.manage-page {
  display: grid;
  gap: 20px;
}

.toolbar-card,
.table-card {
  border-radius: 24px;
  box-shadow: 0 18px 50px rgba(23, 42, 74, 0.08);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar h2 {
  margin: 0;
  font-size: 24px;
  color: #132033;
}

.toolbar p {
  margin: 8px 0 0;
  color: #6f7f95;
}

.message-cell {
  display: -webkit-box;
  overflow: hidden;
  color: #425166;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f7fbff;
  border: 1px solid rgba(26, 43, 69, 0.07);
}

.detail-item span {
  color: #72819a;
  font-size: 12px;
}

.detail-item strong {
  color: #18273f;
  font-size: 16px;
}

.detail-message {
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fbfdff 0%, #f6faff 100%);
  border: 1px solid rgba(26, 43, 69, 0.07);
}

.detail-message-title {
  margin-bottom: 12px;
  color: #17253c;
  font-weight: 700;
}

.detail-message pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  color: #425166;
  line-height: 1.8;
}

@media (max-width: 960px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 720px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
