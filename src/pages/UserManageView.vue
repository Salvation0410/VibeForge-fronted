<template>
  <section class="user-page">
    <a-card class="toolbar-card">
      <div class="toolbar">
        <div>
          <h2>用户管理</h2>
          <p>仅管理员可见。支持查询、创建、编辑和删除。</p>
        </div>

        <a-space wrap>
          <a-input
            v-model:value="searchText"
            placeholder="搜索账号 / 邮箱 / 昵称"
            style="width: 280px"
          />
          <a-button @click="loadUsers">刷新</a-button>
          <a-button type="primary" @click="openCreate">新增用户</a-button>
        </a-space>
      </div>
    </a-card>

    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredUsers"
        :loading="listLoading"
        :row-key="rowKey"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatarUrl'">
            <div class="avatar-cell">
              <a-avatar :size="40" :src="resolveAvatarUrl(record)">
                {{ avatarFallback(record) }}
              </a-avatar>
            </div>
          </template>

          <template v-if="column.key === 'userRole'">
            <a-tag :color="record.userRole === 'admin' ? 'red' : 'blue'">
              {{ record.userRole || '-' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'orange'">
              {{ record.status === 0 ? '正常' : '禁用' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'registerType'">
            {{ registerTypeText(record.registerType) }}
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="openEdit(record)">编辑</a-button>
              <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="createOpen"
      title="新增用户"
      :confirm-loading="createLoading"
      @ok="handleCreate"
      @cancel="resetCreateForm"
    >
      <a-form ref="createFormRef" :model="createForm" :rules="createRules" layout="vertical">
        <a-form-item label="头像">
          <div class="avatar-upload">
            <a-avatar :size="64" :src="createAvatarPreview">
              {{ createAvatarFallback }}
            </a-avatar>

            <div class="avatar-upload-content">
              <div class="avatar-upload-actions">
                <a-upload
                  accept="image/*"
                  :before-upload="handleCreateAvatarBeforeUpload"
                  :show-upload-list="false"
                >
                  <a-button>选择图片</a-button>
                </a-upload>
                <a-button v-if="createAvatarPreview" type="link" danger @click="clearCreateAvatar">
                  清除
                </a-button>
              </div>
              <p class="upload-hint">
                支持 JPG、PNG、WebP。当前先做本地预览，后续接入 OSS 时只需要替换上传逻辑。
              </p>
              <p v-if="createAvatarFileName" class="file-name">{{ createAvatarFileName }}</p>
            </div>
          </div>
        </a-form-item>

        <a-segmented v-model:value="createMode" :options="createModeOptions" class="mode-switch" />

        <a-form-item v-if="createMode === 'account'" name="account" label="账号">
          <a-input v-model:value="createForm.account" placeholder="请输入账号" />
        </a-form-item>

        <a-form-item v-else name="email" label="邮箱">
          <a-input v-model:value="createForm.email" placeholder="name@example.com" />
        </a-form-item>

        <a-form-item name="password" label="密码">
          <a-input-password v-model:value="createForm.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item name="confirmPassword" label="确认密码">
          <a-input-password
            v-model:value="createForm.confirmPassword"
            placeholder="请再次输入密码"
          />
        </a-form-item>

        <a-form-item name="nickname" label="昵称（可选）">
          <a-input v-model:value="createForm.nickname" placeholder="请输入昵称" />
        </a-form-item>

        <a-form-item name="userProfile" label="简介（可选）">
          <a-textarea
            v-model:value="createForm.userProfile"
            :rows="4"
            placeholder="简单描述一下用户"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="editOpen"
      title="编辑用户"
      :confirm-loading="editLoading"
      @ok="handleEdit"
      @cancel="resetEditForm"
    >
      <a-form ref="editFormRef" :model="editForm" layout="vertical">
        <a-form-item label="账号">
          <a-input v-model:value="editForm.account" disabled />
        </a-form-item>

        <a-form-item label="邮箱">
          <a-input v-model:value="editForm.email" disabled />
        </a-form-item>

        <a-form-item label="昵称">
          <a-input v-model:value="editForm.nickname" />
        </a-form-item>

        <a-form-item label="头像地址">
          <a-input v-model:value="editForm.avatarUrl" placeholder="请输入头像 URL" />
        </a-form-item>

        <a-form-item label="简介">
          <a-textarea v-model:value="editForm.userProfile" :rows="4" />
        </a-form-item>

        <a-form-item label="状态">
          <a-select v-model:value="editForm.status">
            <a-select-option :value="0">正常</a-select-option>
            <a-select-option :value="1">禁用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import type { TableProps } from 'ant-design-vue'
import { Modal, message } from 'ant-design-vue'
import {
  adminCreateUser,
  deleteUser,
  pageUsers,
  updateUser,
  type SysUserRegisterRequest,
  type SysUserVO,
} from '@/api/sysUserApi'

type CreateMode = 'account' | 'email'

const SUCCESS_CODES = new Set([0, 20000])

const listLoading = ref(false)
const createLoading = ref(false)
const editLoading = ref(false)
const users = ref<SysUserVO[]>([])
const searchText = ref('')
const avatarPreviewMap = reactive<Record<string, string>>({})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
})

const columns: TableProps['columns'] = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
  { title: '头像', key: 'avatarUrl', width: 92, align: 'center' },
  { title: '账号', dataIndex: 'account', key: 'account' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
  { title: '角色', key: 'userRole' },
  { title: '状态', key: 'status' },
  { title: '注册方式', key: 'registerType' },
  { title: '最后登录', dataIndex: 'lastLoginTime', key: 'lastLoginTime' },
  { title: '操作', key: 'action', width: 180 },
]

const rowKey = (record: SysUserVO) => record.id

const filteredUsers = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  if (!keyword) {
    return users.value
  }
  return users.value.filter((item) =>
    [item.account, item.email, item.nickname].some((value) =>
      value?.toLowerCase().includes(keyword),
    ),
  )
})

const createOpen = ref(false)
const createMode = ref<CreateMode>('account')
const createFormRef = ref<FormInstance>()
const createAvatarPreview = ref('')
const createAvatarFileName = ref('')
const createForm = reactive<SysUserRegisterRequest & { confirmPassword: string }>({
  account: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  userProfile: '',
})

const createModeOptions = [
  { label: '账号创建', value: 'account' },
  { label: '邮箱创建', value: 'email' },
]

const getAvatarLetter = (value?: string) => (value?.trim().slice(0, 1) || 'U').toUpperCase()

const avatarFallback = (record: Pick<SysUserVO, 'nickname' | 'account'>) => {
  return getAvatarLetter(record.nickname || record.account)
}

const resolveAvatarUrl = (record: SysUserVO) => {
  return avatarPreviewMap[String(record.id)] || record.avatarUrl || ''
}

const createAvatarFallback = computed(() =>
  getAvatarLetter(createForm.nickname || createForm.account || createForm.email),
)

const clearCreateAvatar = () => {
  createAvatarPreview.value = ''
  createAvatarFileName.value = ''
}

const handleCreateAvatarBeforeUpload = (file: File) => {
  if (!file.type.startsWith('image/')) {
    message.error('请上传图片文件')
    return false
  }

  if (file.size > 5 * 1024 * 1024) {
    message.error('头像图片不能超过 5MB')
    return false
  }

  const reader = new FileReader()
  reader.onload = () => {
    createAvatarPreview.value = String(reader.result || '')
    createAvatarFileName.value = file.name
  }
  reader.onerror = () => {
    message.error('头像读取失败')
  }
  reader.readAsDataURL(file)
  return false
}

const createRules: Record<string, Rule[]> = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: async (_, value) => {
        if (value !== createForm.password) {
          return Promise.reject(new Error('两次输入的密码不一致'))
        }
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
}

watch(createMode, () => {
  createFormRef.value?.clearValidate()
  createForm.account = ''
  createForm.email = ''
})

const editOpen = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive<Partial<SysUserVO>>({
  id: undefined,
  account: '',
  email: '',
  nickname: '',
  avatarUrl: '',
  userProfile: '',
  status: 0,
})

const registerTypeText = (value?: number) => {
  if (value === 2) return '邮箱注册'
  if (value === 1) return '账号注册'
  return '-'
}

const loadUsers = async () => {
  listLoading.value = true
  try {
    const res = await pageUsers({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    })
    const page = res.data?.data
    users.value = page?.records || []
    pagination.total = page?.totalRow || 0
  } finally {
    listLoading.value = false
  }
}

const handleTableChange: TableProps['onChange'] = (pag) => {
  pagination.current = pag.current || 1
  pagination.pageSize = pag.pageSize || 10
  void loadUsers()
}

const resetCreateForm = () => {
  createFormRef.value?.clearValidate()
  createMode.value = 'account'
  createForm.account = ''
  createForm.email = ''
  createForm.password = ''
  createForm.confirmPassword = ''
  createForm.nickname = ''
  createForm.userProfile = ''
  clearCreateAvatar()
}

const openCreate = () => {
  resetCreateForm()
  createOpen.value = true
}

const handleCreate = async () => {
  await createFormRef.value?.validate()
  createLoading.value = true
  try {
    const account = createForm.account ?? ''
    const email = createForm.email ?? ''
    const payload: SysUserRegisterRequest = {
      password: createForm.password,
      confirmPassword: createForm.confirmPassword,
      nickname: createForm.nickname?.trim() || undefined,
      userProfile: createForm.userProfile?.trim() || undefined,
      ...(createMode.value === 'account'
        ? { account: account.trim() }
        : { email: email.trim() }),
    }

    const res = await adminCreateUser(payload)
    const code = Number(res.data?.code ?? -1)
    if (!SUCCESS_CODES.has(code)) {
      throw new Error(res.data?.message || '创建失败')
    }

    const createdUser = res.data?.data
    if (createdUser?.id && createAvatarPreview.value) {
      avatarPreviewMap[String(createdUser.id)] = createAvatarPreview.value
      try {
        const avatarRes = await updateUser(createdUser.id, {
          avatarUrl: createAvatarPreview.value,
        })
        const avatarCode = Number(avatarRes.data?.code ?? -1)
        if (!SUCCESS_CODES.has(avatarCode)) {
          throw new Error(avatarRes.data?.message || '头像保存失败')
        }
      } catch (avatarError) {
        message.warning(
          avatarError instanceof Error ? avatarError.message : '头像保存失败，稍后可在编辑中补充',
        )
      }
    }

    message.success('创建成功')
    createOpen.value = false
    resetCreateForm()
    await loadUsers()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '创建失败，请稍后重试')
  } finally {
    createLoading.value = false
  }
}

const openEdit = (record: SysUserVO) => {
  Object.assign(editForm, {
    id: record.id,
    account: record.account,
    email: record.email,
    nickname: record.nickname,
    avatarUrl: record.avatarUrl,
    userProfile: record.userProfile,
    status: record.status ?? 0,
  })
  editOpen.value = true
}

const resetEditForm = () => {
  editFormRef.value?.clearValidate()
  Object.assign(editForm, {
    id: undefined,
    account: '',
    email: '',
    nickname: '',
    avatarUrl: '',
    userProfile: '',
    status: 0,
  })
}

const handleEdit = async () => {
  if (!editForm.id) {
    return
  }

  editLoading.value = true
  try {
    const res = await updateUser(editForm.id, {
      nickname: editForm.nickname,
      avatarUrl: editForm.avatarUrl,
      userProfile: editForm.userProfile,
      status: editForm.status,
      account: editForm.account,
      email: editForm.email,
    })
    const code = Number(res.data?.code ?? -1)
    if (!SUCCESS_CODES.has(code)) {
      throw new Error(res.data?.message || '保存失败')
    }

    message.success('保存成功')
    editOpen.value = false
    resetEditForm()
    await loadUsers()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败，请稍后重试')
  } finally {
    editLoading.value = false
  }
}

const handleDelete = (record: SysUserVO) => {
  Modal.confirm({
    title: '确认删除该用户？',
    content: '此操作不可恢复。',
    async onOk() {
      const res = await deleteUser(record.id)
      const code = Number(res.data?.code ?? -1)
      if (!SUCCESS_CODES.has(code)) {
        throw new Error(res.data?.message || '删除失败')
      }
      delete avatarPreviewMap[String(record.id)]
      message.success('删除成功')
      await loadUsers()
    },
  })
}

void loadUsers()
</script>

<style scoped>
.user-page {
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

.avatar-cell {
  display: flex;
  justify-content: center;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px dashed rgba(60, 90, 128, 0.18);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(243, 247, 252, 0.88), rgba(255, 255, 255, 0.96));
}

.avatar-upload-content {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.avatar-upload-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-hint {
  margin: 0;
  color: #6f7f95;
  font-size: 12px;
  line-height: 1.6;
}

.file-name {
  margin: 0;
  color: #1e2d47;
  font-size: 12px;
  word-break: break-all;
}

.mode-switch {
  width: 100%;
  margin-bottom: 16px;
  background: #f3f7fc;
  border-radius: 16px;
  padding: 6px;
}

:deep(.ant-segmented) {
  width: 100%;
}

:deep(.ant-segmented-item) {
  flex: 1;
}

:deep(.ant-segmented-item-selected) {
  background: white;
  color: #1e2d47;
  box-shadow: 0 8px 18px rgba(47, 86, 132, 0.12);
}

@media (max-width: 640px) {
  .avatar-upload {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
