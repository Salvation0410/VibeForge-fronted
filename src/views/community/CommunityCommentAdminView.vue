<template>
  <section class="admin-page">
    <a-card class="hero-card" :bordered="false">
      <div class="hero-layout">
        <div>
          <span class="eyebrow">Community admin</span>
          <h2>社区评论管理</h2>
          <p>支持按帖子、用户、父评论、根评论和关键字筛选，并可查看详情或执行删除操作。</p>
        </div>

        <div class="hero-metrics">
          <div class="metric-box">
            <span>当前页评论</span>
            <strong>{{ comments.length }}</strong>
          </div>
          <div class="metric-box">
            <span>总记录数</span>
            <strong>{{ pagination.total }}</strong>
          </div>
          <div class="metric-box">
            <span>平均深度</span>
            <strong>{{ averageDepth }}</strong>
          </div>
        </div>
      </div>
    </a-card>

    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" class="filter-form">
        <a-form-item label="帖子 ID">
          <a-input v-model:value="query.postId" allow-clear style="width: 140px" />
        </a-form-item>
        <a-form-item label="用户 ID">
          <a-input v-model:value="query.userId" allow-clear style="width: 140px" />
        </a-form-item>
        <a-form-item label="父评论 ID">
          <a-input v-model:value="query.parentId" allow-clear style="width: 150px" />
        </a-form-item>
        <a-form-item label="根评论 ID">
          <a-input v-model:value="query.rootId" allow-clear style="width: 150px" />
        </a-form-item>
        <a-form-item label="关键词">
          <a-input v-model:value="query.keyword" allow-clear placeholder="评论内容" style="width: 220px" />
        </a-form-item>
        <a-form-item label="排序字段">
          <a-select v-model:value="query.sortField" style="width: 160px">
            <a-select-option
              v-for="option in commentSortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排序方式">
          <a-select v-model:value="query.sortOrder" style="width: 130px">
            <a-select-option value="descend">降序</a-select-option>
            <a-select-option value="ascend">升序</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space wrap>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="resetSearch">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="comments"
        :loading="loading"
        :pagination="false"
        :row-key="(record: CommunityCommentVO) => String(record.id)"
        :scroll="{ x: 1380 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            {{ buildCommunityAuthorName(record) }}
          </template>

          <template v-else-if="column.key === 'content'">
            <div class="content-cell">{{ record.content || '-' }}</div>
          </template>

          <template v-else-if="column.key === 'depth'">
            <a-tag :color="Number(record.depth || 0) > 0 ? 'purple' : 'blue'">
              第 {{ record.depth || 0 }} 层
            </a-tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space wrap>
              <a-button type="link" @click="openDetail(record)">查看详情</a-button>
              <a-popconfirm
                title="确认删除这条评论？"
                description="将一并删除该评论下的所有回复。"
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

      <div class="footer-row">
        <a-pagination
          v-model:current="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          @change="loadComments"
        />
      </div>
    </a-card>

    <a-drawer v-model:open="detailOpen" width="720" title="评论详情">
      <a-spin :spinning="detailLoading">
        <template v-if="detailComment">
          <div class="detail-stack">
            <a-descriptions bordered :column="2" size="small">
              <a-descriptions-item label="评论 ID">{{ detailComment.id || '-' }}</a-descriptions-item>
              <a-descriptions-item label="帖子 ID">{{ detailComment.postId || '-' }}</a-descriptions-item>
              <a-descriptions-item label="用户">{{ buildCommunityAuthorName(detailComment) }}</a-descriptions-item>
              <a-descriptions-item label="用户 ID">{{ detailComment.userId || '-' }}</a-descriptions-item>
              <a-descriptions-item label="父评论 ID">{{ detailComment.parentId || '-' }}</a-descriptions-item>
              <a-descriptions-item label="根评论 ID">{{ detailComment.rootId || '-' }}</a-descriptions-item>
              <a-descriptions-item label="层级">{{ detailComment.depth || 0 }}</a-descriptions-item>
              <a-descriptions-item label="路径">{{ detailComment.path || '-' }}</a-descriptions-item>
              <a-descriptions-item label="点赞数">{{ detailComment.likeCount || 0 }}</a-descriptions-item>
              <a-descriptions-item label="回复数">{{ detailComment.replyCount || 0 }}</a-descriptions-item>
              <a-descriptions-item label="创建时间" :span="2">
                {{ formatDateTime(detailComment.createTime) }}
              </a-descriptions-item>
            </a-descriptions>

            <div class="detail-content-box">
              <div class="detail-content-title">评论内容</div>
              <p>{{ detailComment.content || '-' }}</p>
            </div>
          </div>
        </template>
      </a-spin>
    </a-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { TableProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import {
  deleteCommunityCommentByAdmin,
  getCommunityCommentDetailByAdmin,
  getCommunityCommentPageByAdmin,
  type CommunityCommentAdminQueryRequest,
  type CommunityCommentVO,
} from '@/api/community'
import { formatDateTime, isSuccessCode } from '@/utils/appUtils'
import { COMMUNITY_COMMENT_SORT_OPTIONS, buildCommunityAuthorName } from '@/utils/communityAdmin'

const commentSortOptions = COMMUNITY_COMMENT_SORT_OPTIONS

const columns: TableProps['columns'] = [
  { title: '评论 ID', dataIndex: 'id', key: 'id', width: 110 },
  { title: '帖子 ID', dataIndex: 'postId', key: 'postId', width: 110 },
  { title: '用户', key: 'user', width: 150 },
  { title: '父评论 ID', dataIndex: 'parentId', key: 'parentId', width: 120 },
  { title: '根评论 ID', dataIndex: 'rootId', key: 'rootId', width: 120 },
  { title: '层级', key: 'depth', width: 110 },
  { title: '评论内容', key: 'content', width: 360 },
  { title: '点赞', dataIndex: 'likeCount', key: 'likeCount', width: 90 },
  { title: '回复', dataIndex: 'replyCount', key: 'replyCount', width: 90 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 180 },
]

const loading = ref(false)
const comments = ref<CommunityCommentVO[]>([])
const detailOpen = ref(false)
const detailLoading = ref(false)
const detailComment = ref<CommunityCommentVO | null>(null)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const query = reactive<CommunityCommentAdminQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
  postId: undefined,
  parentId: undefined,
  rootId: undefined,
  userId: undefined,
  keyword: '',
})

const averageDepth = computed(() => {
  if (!comments.value.length) {
    return '0'
  }
  const totalDepth = comments.value.reduce((sum, item) => sum + Number(item.depth || 0), 0)
  return (totalDepth / comments.value.length).toFixed(1)
})

function buildPayload(): CommunityCommentAdminQueryRequest {
  return {
    ...query,
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    postId: query.postId || undefined,
    parentId: query.parentId || undefined,
    rootId: query.rootId || undefined,
    userId: query.userId || undefined,
    keyword: query.keyword?.trim() || undefined,
  }
}

async function loadComments() {
  loading.value = true
  try {
    const res = await getCommunityCommentPageByAdmin(buildPayload())
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '评论列表加载失败')
    }
    comments.value = res.data?.records || []
    pagination.total = Number(res.data?.totalRow || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '评论列表加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  void loadComments()
}

function resetSearch() {
  pagination.current = 1
  pagination.pageSize = 10
  query.postId = undefined
  query.parentId = undefined
  query.rootId = undefined
  query.userId = undefined
  query.keyword = ''
  query.sortField = 'createTime'
  query.sortOrder = 'descend'
  void loadComments()
}

async function openDetail(record: CommunityCommentVO) {
  if (!record.id) {
    return
  }
  detailOpen.value = true
  detailLoading.value = true
  try {
    const res = await getCommunityCommentDetailByAdmin(record.id)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '评论详情加载失败')
    }
    detailComment.value = res.data || null
  } catch (error) {
    message.error(error instanceof Error ? error.message : '评论详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function handleDelete(record: CommunityCommentVO) {
  if (!record.id) {
    return
  }
  try {
    const res = await deleteCommunityCommentByAdmin(record.id)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '评论删除失败')
    }
    message.success('评论已删除')
    await loadComments()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '评论删除失败')
  }
}

void loadComments()
</script>

<style scoped>
.admin-page {
  display: grid;
  gap: 18px;
}

.hero-card,
.filter-card,
.table-card {
  border-radius: 24px;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
}

.hero-layout {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: #0891b2;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-layout h2 {
  margin: 0;
  color: #0f172a;
  font-size: 34px;
}

.hero-layout p {
  margin: 10px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.hero-metrics {
  display: flex;
  gap: 12px;
}

.metric-box {
  min-width: 112px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f8fc 100%);
  text-align: center;
}

.metric-box span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.metric-box strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 24px;
}

.filter-form {
  row-gap: 14px;
}

.content-cell {
  display: -webkit-box;
  overflow: hidden;
  color: #475569;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.footer-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.detail-stack {
  display: grid;
  gap: 18px;
}

.detail-content-box {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fbfdff 0%, #f6faff 100%);
}

.detail-content-title {
  margin-bottom: 12px;
  color: #17253c;
  font-weight: 700;
}

.detail-content-box p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
  white-space: pre-wrap;
}

@media (max-width: 960px) {
  .hero-layout {
    flex-direction: column;
  }
}
</style>
