<template>
  <section class="user-page">
    <a-card class="hero-card" :bordered="false">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="hero-eyebrow">Admin workspace</span>
          <h2>用户管理</h2>
          <p>创建账号、查看资料和调整启用状态，管理员常用操作都集中在这里。</p>

          <div class="hero-stats">
            <div class="stat-chip">
              <span class="stat-label">用户总数</span>
              <strong>{{ pagination.total }}</strong>
            </div>
            <div class="stat-chip">
              <span class="stat-label">当前页管理员</span>
              <strong>{{ adminCount }}</strong>
            </div>
            <div class="stat-chip">
              <span class="stat-label">当前页禁用</span>
              <strong>{{ disabledCount }}</strong>
            </div>
          </div>
        </div>

        <div class="hero-panel">
          <a-input-search
            v-model:value="searchText"
            allow-clear
            placeholder="搜索当前页账号 / 邮箱 / 昵称"
            size="large"
          />

          <div class="hero-actions">
            <a-button size="large" @click="handleResetSearch">清空筛选</a-button>
            <a-button size="large" @click="loadUsers">刷新列表</a-button>
            <a-button type="primary" size="large" @click="openCreate">新增用户</a-button>
          </div>
        </div>
      </div>
    </a-card>

    <a-card class="table-card" :bordered="false">
      <a-table
        :columns="columns"
        :data-source="filteredUsers"
        :loading="listLoading"
        :row-key="rowKey"
        :pagination="pagination"
        :scroll="{ x: 1120 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatarUrl'">
            <div class="avatar-cell">
              <a-avatar :size="44" :src="record.avatarUrl || undefined">
                {{ avatarFallback(record) }}
              </a-avatar>
            </div>
          </template>

          <template v-else-if="column.key === 'userRole'">
            <a-tag :color="record.userRole === 'admin' ? 'red' : 'blue'">
              {{ record.userRole === 'admin' ? '管理员' : '普通用户' }}
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

          <template v-else-if="column.key === 'lastLoginTime'">
            {{ formatDateTime(record.lastLoginTime) }}
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="openEdit(record)">查看 / 调整状态</a-button>
              <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="createOpen"
      title="新增用户"
      :width="720"
      :confirm-loading="createLoading"
      ok-text="创建用户"
      cancel-text="取消"
      destroy-on-close
      @ok="handleCreate"
      @cancel="resetCreateForm"
    >
      <a-form ref="createFormRef" :model="createForm" :rules="createRules" layout="vertical">
        <a-segmented v-model:value="createMode" :options="createModeOptions" class="mode-switch" />

        <div class="form-grid">
          <a-form-item v-if="createMode === 'account'" name="account" label="账号">
            <a-input v-model:value="createForm.account" placeholder="请输入账号" />
          </a-form-item>

          <a-form-item v-else name="email" label="邮箱">
            <a-input v-model:value="createForm.email" placeholder="name@example.com" />
          </a-form-item>

          <a-form-item name="nickname" label="昵称">
            <a-input v-model:value="createForm.nickname" placeholder="给用户一个好识别的名字" />
          </a-form-item>

          <a-form-item name="password" label="密码">
            <a-input-password v-model:value="createForm.password" placeholder="至少 6 位" />
          </a-form-item>

          <a-form-item name="confirmPassword" label="确认密码">
            <a-input-password
              v-model:value="createForm.confirmPassword"
              placeholder="请再次输入密码"
            />
          </a-form-item>
        </div>

        <a-form-item name="userProfile" label="个人简介">
          <a-textarea
            v-model:value="createForm.userProfile"
            :rows="4"
            placeholder="这段简介会显示在用户资料里，可留空"
          />
        </a-form-item>

        <a-form-item label="头像上传">
          <div class="avatar-editor">
            <div class="avatar-preview-card">
              <a-avatar :size="88" :src="createAvatarPreview || undefined" class="preview-avatar">
                {{ createAvatarText }}
              </a-avatar>
              <div>
                <div class="preview-title">创建时上传头像</div>
                <p>支持 JPG、PNG、WEBP、GIF，建议控制在 5MB 以内。</p>
              </div>
            </div>

            <div class="avatar-actions">
              <a-upload
                accept="image/*"
                :show-upload-list="false"
                :before-upload="handleCreateAvatarBeforeUpload"
              >
                <a-button>选择图片</a-button>
              </a-upload>
              <a-button v-if="createAvatarFile" @click="clearCreateAvatar">移除本次上传</a-button>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="editOpen"
      title="查看用户"
      :width="760"
      :confirm-loading="editSaving"
      ok-text="保存状态"
      cancel-text="关闭"
      destroy-on-close
      @ok="handleEdit"
      @cancel="resetEditForm"
    >
      <a-spin :spinning="editDetailLoading">
        <a-form ref="editFormRef" :model="editForm" layout="vertical">
          <div class="form-grid">
            <a-form-item label="账号">
              <a-input :value="editForm.account" disabled />
            </a-form-item>

            <a-form-item label="邮箱">
              <a-input :value="editForm.email" disabled />
            </a-form-item>

            <a-form-item label="昵称">
              <a-input :value="editForm.nickname || '-'" disabled />
            </a-form-item>

            <a-form-item label="角色">
              <a-input :value="roleText(editForm.userRole)" disabled />
            </a-form-item>
          </div>

          <a-form-item label="头像">
            <div class="avatar-editor readonly-avatar">
              <div class="avatar-preview-card">
                <a-avatar :size="88" :src="editForm.avatarUrl || undefined" class="preview-avatar">
                  {{ editAvatarText }}
                </a-avatar>
                <div>
                  <div class="preview-title">当前头像</div>
                  <p>管理员可查看用户资料，本页仅允许调整启用状态。</p>
                </div>
              </div>
            </div>
          </a-form-item>

          <div class="meta-grid">
            <div class="meta-card">
              <span>注册方式</span>
              <strong>{{ registerTypeText(editForm.registerType) }}</strong>
            </div>
            <div class="meta-card">
              <span>最近登录</span>
              <strong>{{ formatDateTime(editForm.lastLoginTime) }}</strong>
            </div>
          </div>

          <a-form-item label="个人简介">
            <a-textarea :value="editForm.userProfile || '-'" :rows="4" disabled />
          </a-form-item>

          <a-form-item label="状态">
            <a-select v-model:value="editForm.status">
              <a-select-option :value="0">正常</a-select-option>
              <a-select-option :value="1">禁用</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-spin>
    </a-modal>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import type { TableProps, UploadProps } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { Modal, Upload, message } from 'ant-design-vue'
import {
  createUserByAdminWithAvatar,
  deleteUser,
  getUserById,
  getUserPage,
  updateUser,
  type SysUser,
  type SysUserRegisterRequest,
  type SysUserVO,
} from '@/api/sysUserApi'
import { formatDateTime, isSuccessCode } from '@/utils/appUtils'

type CreateMode = 'account' | 'email'
type CreateFormModel = SysUserRegisterRequest & { confirmPassword: string }
type EditFormModel = Partial<SysUser> & { id?: number }

const AVATAR_SIZE_LIMIT = 5 * 1024 * 1024

const listLoading = ref(false)
const createLoading = ref(false)
const editSaving = ref(false)
const editDetailLoading = ref(false)
const users = ref<SysUserVO[]>([])
const searchText = ref('')
const editSnapshot = ref<SysUser | null>(null)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const columns: TableProps['columns'] = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 110 },
  { title: '头像', key: 'avatarUrl', width: 92, align: 'center' },
  { title: '账号', dataIndex: 'account', key: 'account', width: 170 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 220 },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 150 },
  { title: '角色', key: 'userRole', width: 110 },
  { title: '状态', key: 'status', width: 100 },
  { title: '注册方式', key: 'registerType', width: 120 },
  { title: '最近登录', key: 'lastLoginTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 190 },
]

const rowKey = (record: SysUserVO) => record.id ?? record.account ?? record.email ?? ''

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

const adminCount = computed(
  () => filteredUsers.value.filter((item) => item.userRole === 'admin').length,
)
const disabledCount = computed(
  () => filteredUsers.value.filter((item) => Number(item.status ?? 0) !== 0).length,
)

const createOpen = ref(false)
const createMode = ref<CreateMode>('account')
const createFormRef = ref<FormInstance>()
const createForm = reactive<CreateFormModel>({
  account: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  userProfile: '',
})

const createAvatarFile = ref<File>()
const createAvatarPreview = ref('')
const createAvatarText = computed(() => getAvatarLetter(createForm.nickname || createForm.account))

const editOpen = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive<EditFormModel>({
  id: undefined,
  account: '',
  email: '',
  nickname: '',
  avatarUrl: '',
  userProfile: '',
  userRole: '',
  registerType: undefined,
  lastLoginTime: '',
  status: 0,
})
const editAvatarText = computed(() => getAvatarLetter(editForm.nickname || editForm.account))

const createModeOptions = [
  { label: '账号创建', value: 'account' },
  { label: '邮箱创建', value: 'email' },
]

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

onBeforeUnmount(() => {
  clearCreateAvatar()
})

function getAvatarLetter(value?: string) {
  return (value?.trim().slice(0, 1) || 'U').toUpperCase()
}

function avatarFallback(record: Pick<SysUserVO, 'nickname' | 'account'>) {
  return getAvatarLetter(record.nickname || record.account)
}

function roleText(userRole?: string) {
  return userRole === 'admin' ? '管理员' : '普通用户'
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function registerTypeText(value?: number) {
  if (value === 2) return '邮箱注册'
  if (value === 1) return '账号注册'
  return '-'
}

function revokeBlobUrl(url?: string) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function validateAvatarFile(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return false
  }
  if (file.size > AVATAR_SIZE_LIMIT) {
    message.error('头像文件不能超过 5MB')
    return false
  }
  return true
}

const handleCreateAvatarBeforeUpload: UploadProps['beforeUpload'] = (file) => {
  const avatar = file as File
  if (!validateAvatarFile(avatar)) {
    return Upload.LIST_IGNORE
  }
  revokeBlobUrl(createAvatarPreview.value)
  createAvatarFile.value = avatar
  createAvatarPreview.value = URL.createObjectURL(avatar)
  return false
}

function clearCreateAvatar() {
  revokeBlobUrl(createAvatarPreview.value)
  createAvatarFile.value = undefined
  createAvatarPreview.value = ''
}

async function loadUsers() {
  listLoading.value = true
  try {
    const res = await getUserPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '加载用户列表失败')
    }
    users.value = Array.isArray(res.data?.records) ? res.data.records : []
    pagination.total = Number(res.data?.totalRow || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载用户列表失败')
  } finally {
    listLoading.value = false
  }
}

const handleTableChange: TableProps['onChange'] = (pag) => {
  pagination.current = pag.current || 1
  pagination.pageSize = pag.pageSize || 10
  void loadUsers()
}

function handleResetSearch() {
  searchText.value = ''
}

function resetCreateForm() {
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

function openCreate() {
  resetCreateForm()
  createOpen.value = true
}

async function handleCreate() {
  await createFormRef.value?.validate()
  createLoading.value = true
  try {
    const payload: SysUserRegisterRequest = {
      password: createForm.password,
      confirmPassword: createForm.confirmPassword,
      nickname: createForm.nickname?.trim() || undefined,
      userProfile: createForm.userProfile?.trim() || undefined,
      ...(createMode.value === 'account'
        ? { account: createForm.account?.trim() || undefined }
        : { email: createForm.email?.trim() || undefined }),
    }

    const res = await createUserByAdminWithAvatar(payload, createAvatarFile.value)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '创建失败')
    }

    message.success('用户创建成功')
    createOpen.value = false
    resetCreateForm()
    await loadUsers()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '创建失败，请稍后重试')
  } finally {
    createLoading.value = false
  }
}

async function openEdit(record: SysUserVO) {
  if (!record.id) {
    return
  }

  resetEditForm()
  editOpen.value = true
  editDetailLoading.value = true

  try {
    const res = await getUserById(record.id)
    if (!isSuccessCode(res.code) || !res.data) {
      throw new Error(res.message || '获取用户详情失败')
    }

    editSnapshot.value = res.data
    Object.assign(editForm, {
      id: res.data.id,
      account: res.data.account || '',
      email: res.data.email || '',
      nickname: res.data.nickname || '',
      avatarUrl: res.data.avatarUrl || '',
      userProfile: res.data.userProfile || '',
      userRole: res.data.userRole || '',
      registerType: res.data.registerType,
      lastLoginTime: res.data.lastLoginTime || '',
      status: res.data.status ?? 0,
    })
  } catch (error) {
    editOpen.value = false
    message.error(error instanceof Error ? error.message : '获取用户详情失败')
  } finally {
    editDetailLoading.value = false
  }
}

function resetEditForm() {
  editFormRef.value?.clearValidate()
  editSnapshot.value = null
  Object.assign(editForm, {
    id: undefined,
    account: '',
    email: '',
    nickname: '',
    avatarUrl: '',
    userProfile: '',
    userRole: '',
    registerType: undefined,
    lastLoginTime: '',
    status: 0,
  })
}

async function handleEdit() {
  if (!editForm.id || !editSnapshot.value) {
    return
  }

  editSaving.value = true
  try {
    const snapshot = editSnapshot.value
    const res = await updateUser(editForm.id, {
      account: normalizeOptionalText(snapshot.account),
      email: normalizeOptionalText(snapshot.email),
      nickname: normalizeOptionalText(snapshot.nickname),
      avatarUrl: normalizeOptionalText(snapshot.avatarUrl),
      userProfile: normalizeOptionalText(snapshot.userProfile),
      userRole: snapshot.userRole,
      status: editForm.status ?? snapshot.status ?? 0,
    })

    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '保存失败')
    }

    message.success('用户状态已更新')
    editOpen.value = false
    resetEditForm()
    await loadUsers()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败，请稍后重试')
  } finally {
    editSaving.value = false
  }
}

function handleDelete(record: SysUserVO) {
  if (!record.id) {
    return
  }

  Modal.confirm({
    title: '确认删除该用户？',
    content: '删除后无法恢复，请确认当前操作。',
    okText: '删除',
    cancelText: '取消',
    async onOk() {
      const res = await deleteUser(record.id as number)
      if (!isSuccessCode(res.code)) {
        throw new Error(res.message || '删除失败')
      }
      message.success('用户已删除')
      await loadUsers()
    },
  })
}

void loadUsers()
</script>

<style scoped>
.user-page {
  display: grid;
  gap: 22px;
}

.hero-card,
.table-card {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(24, 45, 79, 0.08);
}

.hero-card {
  background:
    radial-gradient(circle at 100% 0, rgba(31, 167, 199, 0.18), transparent 24%),
    radial-gradient(circle at 0 100%, rgba(72, 134, 255, 0.12), transparent 22%),
    linear-gradient(135deg, #fefefe 0%, #f5f9ff 100%);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
  gap: 24px;
  align-items: stretch;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero-eyebrow {
  display: inline-flex;
  align-self: flex-start;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(19, 127, 198, 0.08);
  color: #177ea9;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h2 {
  margin: 0;
  color: #142137;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.08;
  letter-spacing: -0.05em;
}

.hero-copy p {
  margin: 0;
  max-width: 640px;
  color: #627289;
  font-size: 16px;
  line-height: 1.8;
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.stat-chip {
  min-width: 150px;
  padding: 16px 18px;
  border: 1px solid rgba(26, 43, 69, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.stat-label {
  display: block;
  color: #72819a;
  font-size: 12px;
}

.stat-chip strong {
  display: block;
  margin-top: 6px;
  color: #18273f;
  font-size: 26px;
  font-weight: 800;
}

.hero-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 22px;
  border: 1px solid rgba(26, 43, 69, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 16px 40px rgba(24, 45, 79, 0.06);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.table-card :deep(.ant-table-thead > tr > th) {
  color: #4f6079;
  font-weight: 700;
  background: #f7faff;
}

.table-card :deep(.ant-table-tbody > tr:hover > td) {
  background: #fbfdff;
}

.avatar-cell {
  display: flex;
  justify-content: center;
}

.mode-switch {
  width: 100%;
  margin-bottom: 20px;
  background: #f3f7fc;
  border-radius: 16px;
  padding: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.meta-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f7fbff;
  border: 1px solid rgba(26, 43, 69, 0.07);
}

.meta-card span {
  color: #72819a;
  font-size: 12px;
}

.meta-card strong {
  color: #18273f;
  font-size: 16px;
}

.avatar-editor {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(26, 43, 69, 0.08);
  border-radius: 22px;
  background: linear-gradient(180deg, #fbfdff 0%, #f6faff 100%);
}

.readonly-avatar {
  background: linear-gradient(180deg, #fbfdff 0%, #f9fbff 100%);
}

.avatar-preview-card {
  display: flex;
  align-items: center;
  gap: 18px;
}

.preview-avatar {
  flex-shrink: 0;
  background: linear-gradient(145deg, #1fb7cf, #127fc6);
}

.preview-title {
  color: #17253c;
  font-weight: 700;
}

.avatar-preview-card p {
  margin: 8px 0 0;
  color: #718099;
  line-height: 1.7;
}

.avatar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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

@media (max-width: 980px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-actions :deep(.ant-btn) {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .form-grid,
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .avatar-preview-card {
    align-items: flex-start;
  }
}
</style>
