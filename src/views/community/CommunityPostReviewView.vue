<template>
  <section class="admin-page">
    <a-card class="hero-card" :bordered="false">
      <div class="hero-layout">
        <div>
          <span class="eyebrow">Community admin</span>
          <h2>社区帖子审核</h2>
          <p>支持按关键词、标签、状态和排序筛选帖子，并可统一执行查看详情、审核通过、驳回和置顶操作。</p>
        </div>

        <div class="hero-metrics">
          <div class="metric-box">
            <span>当前页数</span>
            <strong>{{ posts.length }}</strong>
          </div>
          <div class="metric-box">
            <span>待审核</span>
            <strong>{{ pendingCount }}</strong>
          </div>
          <div class="metric-box">
            <span>帖子总数</span>
            <strong>{{ pagination.total }}</strong>
          </div>
        </div>
      </div>
    </a-card>

    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" class="filter-form">
        <a-form-item label="关键词">
          <a-input v-model:value="filters.keyword" allow-clear placeholder="标题 / 正文" style="width: 220px" />
        </a-form-item>
        <a-form-item label="标签">
          <a-select v-model:value="filters.tagId" allow-clear placeholder="全部标签" style="width: 180px">
            <a-select-option v-for="tag in communityStore.tags" :key="String(tag.id)" :value="tag.id">
              {{ tag.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="filters.status" style="width: 150px">
            <a-select-option v-for="option in postStatusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排序">
          <a-select v-model:value="filters.sortType" style="width: 140px">
            <a-select-option value="latest">最新</a-select-option>
            <a-select-option value="hot">最热</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space wrap>
            <a-button type="primary" @click="applyFilters">查询</a-button>
            <a-button @click="resetFilters">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="posts"
        :loading="loading"
        :pagination="false"
        :row-key="(record: CommunityPostVO) => String(record.id)"
        :scroll="{ x: 1260 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="title-cell">
              <strong>{{ record.title || '未命名帖子' }}</strong>
              <span>{{ record.content || '暂无正文' }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'tag'">
            <a-tag color="blue">{{ record.tag?.name || '未分类' }}</a-tag>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="getCommunityPostStatusColor(record.status)">
              {{ getCommunityPostStatusText(record.status) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'author'">
            {{ buildCommunityAuthorName(record) }}
          </template>

          <template v-else-if="column.key === 'isPinned'">
            <a-tag :color="Number(record.isPinned || 0) === 1 ? 'gold' : 'default'">
              {{ Number(record.isPinned || 0) === 1 ? '已置顶' : '未置顶' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space wrap>
              <a-button type="link" @click="openDetail(record)">查看详情</a-button>
              <a-button type="link" @click="handleApprove(record)">通过</a-button>
              <a-button type="link" danger @click="openReject(record)">驳回</a-button>
              <a-button type="link" @click="handlePin(record, Number(record.isPinned || 0) !== 1)">
                {{ Number(record.isPinned || 0) === 1 ? '取消置顶' : '置顶' }}
              </a-button>
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
          :page-size-options="['10', '20', '50']"
          @change="loadPosts"
        />
      </div>
    </a-card>

    <a-drawer v-model:open="detailOpen" width="720" title="帖子详情">
      <a-spin :spinning="detailLoading">
        <template v-if="detailPost">
          <div class="detail-stack">
            <div class="detail-line">
              <a-tag :color="getCommunityPostStatusColor(detailPost.status)">
                {{ getCommunityPostStatusText(detailPost.status) }}
              </a-tag>
              <a-tag v-if="Number(detailPost.isPinned || 0) === 1" color="gold">已置顶</a-tag>
            </div>

            <h3>{{ detailPost.title }}</h3>
            <div class="meta-text">
              {{ buildCommunityAuthorName(detailPost) }} | {{ formatDateTime(detailPost.createTime) }}
            </div>
            <p class="detail-content">{{ detailPost.content }}</p>

            <div v-if="detailPost.images?.length" class="image-grid">
              <a-image
                v-for="image in detailPost.images"
                :key="String(image.id || image.imageUrl)"
                :src="image.imageUrl"
                :width="160"
                :height="104"
              />
            </div>

            <a-descriptions bordered :column="2" size="small">
              <a-descriptions-item label="标签">{{ detailPost.tag?.name || '-' }}</a-descriptions-item>
              <a-descriptions-item label="点赞数">{{ detailPost.likeCount || 0 }}</a-descriptions-item>
              <a-descriptions-item label="评论数">{{ detailPost.commentCount || 0 }}</a-descriptions-item>
              <a-descriptions-item label="驳回原因">{{ detailPost.rejectReason || '-' }}</a-descriptions-item>
            </a-descriptions>
          </div>
        </template>
      </a-spin>
    </a-drawer>

    <a-modal
      v-model:open="rejectOpen"
      title="驳回帖子"
      :confirm-loading="rejectSaving"
      ok-text="确认驳回"
      cancel-text="取消"
      destroy-on-close
      @ok="submitReject"
    >
      <a-form layout="vertical">
        <a-form-item label="驳回原因" required>
          <a-textarea
            v-model:value="rejectReason"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            :maxlength="300"
            placeholder="请输入驳回原因"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { TableProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import {
  getCommunityPostDetail,
  getCommunityPostPageByAdmin,
  pinCommunityPost,
  reviewCommunityPost,
  type CommunityId,
  type CommunityPostAdminQueryRequest,
  type CommunityPostVO,
} from '@/api/community'
import { useCommunityStore } from '@/stores/community'
import { formatDateTime, isSuccessCode } from '@/utils/appUtils'
import {
  COMMUNITY_POST_STATUS_OPTIONS,
  buildCommunityAuthorName,
  getCommunityPostStatusColor,
  getCommunityPostStatusText,
} from '@/utils/communityAdmin'

type StatusFilter = (typeof COMMUNITY_POST_STATUS_OPTIONS)[number]['value']

const communityStore = useCommunityStore()

const columns: TableProps['columns'] = [
  { title: '标题', key: 'title', width: 360 },
  { title: '作者', key: 'author', width: 140 },
  { title: '标签', key: 'tag', width: 120 },
  { title: '状态', key: 'status', width: 120 },
  { title: '点赞', dataIndex: 'likeCount', key: 'likeCount', width: 90 },
  { title: '评论', dataIndex: 'commentCount', key: 'commentCount', width: 90 },
  { title: '置顶', key: 'isPinned', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 240 },
]

const postStatusOptions = COMMUNITY_POST_STATUS_OPTIONS

const filters = reactive<{
  keyword: string
  tagId?: CommunityId
  status: StatusFilter
  sortType: 'latest' | 'hot'
}>({
  keyword: '',
  tagId: undefined,
  status: 'ALL',
  sortType: 'latest',
})

const loading = ref(false)
const posts = ref<CommunityPostVO[]>([])

const detailOpen = ref(false)
const detailLoading = ref(false)
const detailPost = ref<CommunityPostVO | null>(null)

const rejectOpen = ref(false)
const rejectSaving = ref(false)
const rejectReason = ref('')
const rejectTarget = ref<CommunityPostVO | null>(null)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const pendingCount = computed(() => posts.value.filter((item) => item.status === 'PENDING').length)

function buildPayload(): CommunityPostAdminQueryRequest {
  return {
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    tagId: filters.tagId,
    status: filters.status === 'ALL' ? undefined : filters.status,
    sortType: filters.sortType,
  }
}

async function loadPosts() {
  loading.value = true
  try {
    const res = await getCommunityPostPageByAdmin(buildPayload())
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '帖子列表加载失败')
    }
    posts.value = res.data?.records || []
    pagination.total = Number(res.data?.totalRow || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '帖子列表加载失败')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  pagination.current = 1
  void loadPosts()
}

function resetFilters() {
  pagination.current = 1
  pagination.pageSize = 10
  filters.keyword = ''
  filters.tagId = undefined
  filters.status = 'ALL'
  filters.sortType = 'latest'
  void loadPosts()
}

async function openDetail(post: CommunityPostVO) {
  if (!post.id) {
    return
  }
  detailOpen.value = true
  detailLoading.value = true
  try {
    const res = await getCommunityPostDetail(post.id)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '帖子详情加载失败')
    }
    detailPost.value = res.data || null
  } catch (error) {
    message.error(error instanceof Error ? error.message : '帖子详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function handleApprove(post: CommunityPostVO) {
  if (!post.id) {
    return
  }
  try {
    const res = await reviewCommunityPost({
      postId: post.id,
      status: 'APPROVED',
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '审核失败')
    }
    message.success('帖子已通过审核')
    await loadPosts()
    if (detailPost.value?.id === post.id) {
      detailPost.value.status = 'APPROVED'
      detailPost.value.rejectReason = ''
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '审核失败')
  }
}

function openReject(post: CommunityPostVO) {
  rejectTarget.value = post
  rejectReason.value = post.rejectReason || ''
  rejectOpen.value = true
}

async function submitReject() {
  if (!rejectTarget.value?.id) {
    return
  }
  if (!rejectReason.value.trim()) {
    message.warning('请输入驳回原因')
    return
  }

  rejectSaving.value = true
  try {
    const res = await reviewCommunityPost({
      postId: rejectTarget.value.id,
      status: 'REJECTED',
      rejectReason: rejectReason.value.trim(),
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '驳回失败')
    }
    message.success('帖子已驳回')
    rejectOpen.value = false
    await loadPosts()
    if (detailPost.value?.id === rejectTarget.value.id) {
      detailPost.value.status = 'REJECTED'
      detailPost.value.rejectReason = rejectReason.value.trim()
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '驳回失败')
  } finally {
    rejectSaving.value = false
  }
}

async function handlePin(post: CommunityPostVO, pinned: boolean) {
  if (!post.id) {
    return
  }
  try {
    const res = await pinCommunityPost({
      postId: post.id,
      pinned,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '置顶操作失败')
    }
    message.success(pinned ? '帖子已置顶' : '帖子已取消置顶')
    await loadPosts()
    if (detailPost.value?.id === post.id) {
      detailPost.value.isPinned = pinned ? 1 : 0
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '置顶操作失败')
  }
}

void communityStore.loadTags()
void loadPosts()
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

.title-cell {
  display: grid;
  gap: 6px;
}

.title-cell strong {
  color: #0f172a;
}

.title-cell span {
  display: -webkit-box;
  overflow: hidden;
  color: #64748b;
  line-height: 1.6;
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

.detail-line {
  display: flex;
  gap: 8px;
}

.detail-stack h3 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
}

.meta-text {
  color: #64748b;
}

.detail-content {
  margin: 0;
  color: #334155;
  line-height: 1.8;
  white-space: pre-wrap;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 160px));
  gap: 12px;
}

@media (max-width: 900px) {
  .hero-layout {
    flex-direction: column;
  }

  .hero-metrics {
    width: 100%;
  }

  .metric-box {
    flex: 1;
  }
}
</style>
