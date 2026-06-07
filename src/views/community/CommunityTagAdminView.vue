<template>
  <section class="admin-page">
    <a-card class="hero-card" :bordered="false">
      <div class="hero-layout">
        <div>
          <span class="eyebrow">Community admin</span>
          <h2>社区标签管理</h2>
          <p>维护社区标签的名称、描述、排序和启用状态，前台筛选区会复用这里的配置。</p>
        </div>

        <div class="hero-actions">
          <a-button @click="loadTags(true)">刷新列表</a-button>
          <a-button type="primary" @click="openCreate">新建标签</a-button>
        </div>
      </div>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="filteredTags"
        :loading="loading"
        :pagination="false"
        :row-key="(record: CommunityTagVO) => String(record.id)"
      >
        <template #title>
          <div class="table-head">
            <a-input v-model:value="keyword" allow-clear placeholder="搜索标签名 / 描述" style="width: 260px" />
            <a-select v-model:value="statusFilter" style="width: 160px">
              <a-select-option
                v-for="option in tagStatusOptions"
                :key="String(option.value)"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </div>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-space>
              <a-tag :color="getCommunityTagStatusColor(record.status)">
                {{ getCommunityTagStatusText(record.status) }}
              </a-tag>
              <a-switch
                :checked="Number(record.status ?? 0) === 1"
                checked-children="启用"
                un-checked-children="停用"
                @change="toggleStatus(record, $event)"
              />
            </a-space>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确认删除这个标签？"
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
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :title="editingTagId ? '编辑标签' : '新建标签'"
      :confirm-loading="saving"
      ok-text="保存"
      cancel-text="取消"
      destroy-on-close
      @ok="handleSave"
    >
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-form-item label="标签名称" name="name">
          <a-input v-model:value="formState.name" maxlength="30" show-count />
        </a-form-item>
        <a-form-item label="标签描述" name="description">
          <a-textarea v-model:value="formState.description" :auto-size="{ minRows: 3, maxRows: 5 }" maxlength="120" show-count />
        </a-form-item>
        <a-form-item label="排序值" name="sortOrder">
          <a-input-number v-model:value="formState.sortOrder" :min="0" :max="9999" style="width: 100%" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select v-model:value="formState.status">
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="0">停用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { TableProps } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { message } from 'ant-design-vue'
import {
  deleteCommunityTag,
  getAllCommunityTagList,
  saveCommunityTag,
  type CommunityId,
  type CommunityTagSaveRequest,
  type CommunityTagVO,
} from '@/api/community'
import {
  COMMUNITY_TAG_STATUS_OPTIONS,
  getCommunityTagStatusColor,
  getCommunityTagStatusText,
} from '@/utils/communityAdmin'
import { isSuccessCode } from '@/utils/appUtils'

const columns: TableProps['columns'] = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 110 },
  { title: '标签名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '标签描述', dataIndex: 'description', key: 'description' },
  { title: '排序值', dataIndex: 'sortOrder', key: 'sortOrder', width: 120 },
  { title: '状态', key: 'status', width: 200 },
  { title: '操作', key: 'action', width: 160 },
]

const tagStatusOptions = COMMUNITY_TAG_STATUS_OPTIONS

const tags = ref<CommunityTagVO[]>([])
const loading = ref(false)
const keyword = ref('')
const statusFilter = ref<number>(-1)
const modalOpen = ref(false)
const saving = ref(false)
const editingTagId = ref<CommunityId>()
const formRef = ref<FormInstance>()

const formState = reactive<CommunityTagSaveRequest>({
  name: '',
  description: '',
  sortOrder: 0,
  status: 1,
})

const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
}

const filteredTags = computed(() => {
  const currentKeyword = keyword.value.trim()
  return tags.value.filter((item) => {
    const matchesKeyword =
      !currentKeyword ||
      item.name?.includes(currentKeyword) ||
      item.description?.includes(currentKeyword)
    const matchesStatus =
      statusFilter.value === -1 || Number(item.status ?? 0) === Number(statusFilter.value)
    return matchesKeyword && matchesStatus
  })
})

async function loadTags(_force = false) {
  loading.value = true
  try {
    const res = await getAllCommunityTagList()
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '标签加载失败')
    }
    tags.value = res.data || []
  } catch (error) {
    message.error(error instanceof Error ? error.message : '标签加载失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  formRef.value?.clearValidate()
  editingTagId.value = undefined
  formState.name = ''
  formState.description = ''
  formState.sortOrder = 0
  formState.status = 1
}

function openCreate() {
  resetForm()
  modalOpen.value = true
}

function openEdit(record: CommunityTagVO) {
  resetForm()
  editingTagId.value = record.id
  formState.name = record.name || ''
  formState.description = record.description || ''
  formState.sortOrder = Number(record.sortOrder || 0)
  formState.status = Number(record.status ?? 1)
  modalOpen.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload: CommunityTagSaveRequest = {
      id: editingTagId.value,
      name: formState.name.trim(),
      description: formState.description?.trim() || undefined,
      sortOrder: Number(formState.sortOrder || 0),
      status: Number(formState.status ?? 1),
    }
    const res = await saveCommunityTag(payload)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '标签保存失败')
    }
    message.success(editingTagId.value ? '标签已更新' : '标签已创建')
    modalOpen.value = false
    await loadTags(true)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '标签保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleStatus(record: CommunityTagVO, checked: boolean) {
  try {
    const res = await saveCommunityTag({
      id: record.id,
      name: record.name || '',
      description: record.description,
      sortOrder: Number(record.sortOrder || 0),
      status: checked ? 1 : 0,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '状态切换失败')
    }
    message.success(checked ? '标签已启用' : '标签已停用')
    await loadTags(true)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '状态切换失败')
  }
}

async function handleDelete(record: CommunityTagVO) {
  if (!record.id) {
    return
  }
  try {
    const res = await deleteCommunityTag(record.id)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '标签删除失败')
    }
    message.success('标签已删除')
    await loadTags(true)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '标签删除失败')
  }
}

void loadTags()
</script>

<style scoped>
.admin-page {
  display: grid;
  gap: 18px;
}

.hero-card,
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

.hero-actions {
  display: flex;
  gap: 12px;
}

.table-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 820px) {
  .hero-layout,
  .table-head {
    flex-direction: column;
  }
}
</style>
