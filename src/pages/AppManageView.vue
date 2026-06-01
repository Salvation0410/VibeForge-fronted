<template>
  <section class="manage-page">
    <a-card class="toolbar-card">
      <div class="toolbar">
        <div>
          <h2>应用管理</h2>
          <p>仅管理员可见，支持按任意字段查询、查看详情、编辑、删除和设置精选。</p>
        </div>

        <a-space wrap>
          <a-input
            v-model:value="query.appName"
            placeholder="应用名称"
            style="width: 180px"
            allow-clear
          />
          <a-input
            v-model:value="query.codeGenType"
            placeholder="代码类型"
            style="width: 160px"
            allow-clear
          />
          <a-input-number v-model:value="query.userId" placeholder="用户 id" style="width: 140px" />
          <a-input-number v-model:value="query.priority" placeholder="优先级" style="width: 140px" />
          <a-button type="primary" @click="handleSearch">搜索</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-space>
      </div>
    </a-card>

    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="apps"
        :loading="loading"
        :row-key="rowKey"
        :pagination="false"
        :scroll="{ x: 1300 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cover'">
            <a-image
              :src="getAppCoverUrl(record)"
              :width="92"
              :height="56"
              style="object-fit: cover; border-radius: 12px"
            />
          </template>

          <template v-else-if="column.key === 'priority'">
            <a-tag :color="Number(record.priority || 0) >= 99 ? 'gold' : 'blue'">
              {{ Number(record.priority || 0) >= 99 ? '精选' : record.priority || 0 }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'owner'">
            {{ getAppOwnerName(record) }}
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="goToEdit(record)">编辑</a-button>
              <a-button type="link" @click="goToChat(record)">查看详情</a-button>
              <a-button type="link" @click="handleFeature(record)">精选</a-button>
              <a-popconfirm
                title="确认删除这个应用吗？"
                ok-text="删除"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
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
          @change="loadApps"
        />
      </div>
    </a-card>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { TableProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import {
  deleteAppByAdmin,
  getAppPageByAdmin,
  updateAppByAdmin,
  type AppQueryRequest,
  type AppVO,
} from '@/api/app'
import { formatDateTime, getAppCoverUrl, getAppOwnerName, isSuccessCode } from '@/utils/appUtils'

const router = useRouter()
const loading = ref(false)
const apps = ref<AppVO[]>([])
const total = ref(0)

const query = reactive<{
  pageNum: number
  pageSize: number
  appName: string
  codeGenType: string
  userId?: number
  priority?: number
}>({
  pageNum: 1,
  pageSize: 10,
  appName: '',
  codeGenType: '',
  userId: undefined,
  priority: undefined,
})

const columns: TableProps['columns'] = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 110 },
  { title: '应用名称', dataIndex: 'appName', key: 'appName', width: 220 },
  { title: '封面', key: 'cover', width: 120 },
  { title: '代码类型', dataIndex: 'codeGenType', key: 'codeGenType', width: 130 },
  { title: '优先级', key: 'priority', width: 110 },
  { title: '创建者', key: 'owner', width: 160 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 280 },
]

const rowKey = (record: AppVO) => record.id || ''

const buildQueryPayload = (): AppQueryRequest => {
  const payload: AppQueryRequest = {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
  }

  if (query.appName.trim()) {
    payload.appName = query.appName.trim()
  }
  if (query.codeGenType.trim()) {
    payload.codeGenType = query.codeGenType.trim()
  }
  if (query.userId !== undefined && query.userId !== null && String(query.userId) !== '') {
    payload.userId = String(query.userId)
  }
  if (query.priority !== undefined && query.priority !== null) {
    payload.priority = query.priority
  }

  return payload
}

const loadApps = async () => {
  loading.value = true
  try {
    const payload = buildQueryPayload()
    const res = await getAppPageByAdmin(payload)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '加载应用列表失败')
    }

    const records = Array.isArray(res.data?.records) ? res.data.records : []
    apps.value = records.map((item) => ({
      ...item,
      createTime: formatDateTime(item.createTime),
      updateTime: formatDateTime(item.updateTime),
    }))
    total.value = Number(res.data?.totalRow || 0)

    if (import.meta.env.DEV) {
      console.debug('app-manage payload', payload)
      console.debug('app-manage response', res)
      console.debug('app-manage records', records)
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载应用列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  query.pageNum = 1
  await loadApps()
}

const resetSearch = async () => {
  query.pageNum = 1
  query.pageSize = 10
  query.appName = ''
  query.codeGenType = ''
  query.userId = undefined
  query.priority = undefined
  await loadApps()
}

const goToEdit = (record: AppVO) => {
  router.push(`/apps/${record.id}/edit`)
}

const goToChat = (record: AppVO) => {
  router.push(`/apps/${record.id}/chat`)
}

const handleFeature = async (record: AppVO) => {
  try {
    const res = await updateAppByAdmin({
      id: String(record.id || ''),
      appName: record.appName,
      cover: record.cover,
      priority: 99,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '设置精选失败')
    }
    message.success('已设置为精选应用')
    await loadApps()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '设置精选失败')
  }
}

const handleDelete = async (record: AppVO) => {
  try {
    const res = await deleteAppByAdmin(String(record.id || ''))
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '删除应用失败')
    }
    message.success('应用已删除')
    await loadApps()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除应用失败')
  }
}

void loadApps()
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

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 960px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
