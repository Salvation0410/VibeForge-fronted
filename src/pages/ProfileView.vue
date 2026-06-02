<template>
  <section class="profile-page">
    <div class="hero-grid">
      <a-card class="profile-hero-card" :bordered="false">
        <div class="identity-wrap">
          <span class="profile-eyebrow">Personal console</span>

          <div class="identity-head">
            <a-avatar :size="92" :src="avatarPreview || undefined" class="hero-avatar">
              {{ avatarText }}
            </a-avatar>

            <div class="identity-copy">
              <h1>{{ displayName }}</h1>
              <p>{{ profileForm.email || '未设置邮箱' }}</p>

              <div class="tag-row">
                <a-tag color="blue">{{ roleText(profileForm.userRole) }}</a-tag>
                <a-tag :color="profileForm.status === 0 ? 'green' : 'orange'">
                  {{ profileForm.status === 0 ? '账号正常' : '已禁用' }}
                </a-tag>
              </div>
            </div>
          </div>

          <p class="hero-desc">这里集中管理你的公开资料，并快速回到自己创建过的应用。</p>

          <div class="stat-grid">
            <div class="stat-card">
              <span>账号</span>
              <strong>{{ profileForm.account || '-' }}</strong>
            </div>
            <div class="stat-card">
              <span>注册方式</span>
              <strong>{{ registerTypeText(profileForm.registerType) }}</strong>
            </div>
            <div class="stat-card">
              <span>最近登录</span>
              <strong>{{ formatDateTime(profileForm.lastLoginTime) }}</strong>
            </div>
            <div class="stat-card">
              <span>我的应用</span>
              <strong>{{ myTotal }}</strong>
            </div>
          </div>
        </div>
      </a-card>

      <a-card class="profile-form-card" :bordered="false">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Edit profile</p>
            <h2>基本信息</h2>
          </div>
          <a-button @click="loadProfile">刷新资料</a-button>
        </div>

        <a-spin :spinning="profileLoading">
          <a-form
            ref="formRef"
            :model="profileForm"
            :rules="profileRules"
            layout="vertical"
            @finish="handleSave"
          >
            <div class="form-grid">
              <a-form-item label="账号">
                <a-input :value="profileForm.account" disabled />
              </a-form-item>

              <a-form-item name="email" label="邮箱">
                <a-input v-model:value="profileForm.email" placeholder="请输入邮箱" />
              </a-form-item>

              <a-form-item name="nickname" label="昵称">
                <a-input
                  v-model:value="profileForm.nickname"
                  placeholder="给自己一个更好识别的名字"
                />
              </a-form-item>
            </div>

            <a-form-item label="头像">
              <div class="avatar-editor">
                <div class="avatar-preview-card">
                  <a-avatar :size="88" :src="avatarPreview || undefined" class="preview-avatar">
                    {{ avatarText }}
                  </a-avatar>
                  <div>
                    <div class="preview-title">当前头像预览</div>
                    <p>支持上传新头像，也可以保留或填写外链头像地址。</p>
                  </div>
                </div>

                <div class="avatar-actions">
                  <a-upload
                    accept="image/*"
                    :show-upload-list="false"
                    :before-upload="handleAvatarBeforeUpload"
                  >
                    <a-button>上传头像</a-button>
                  </a-upload>
                  <a-button v-if="avatarFile" @click="clearAvatarSelection">撤销本次上传</a-button>
                </div>
              </div>
            </a-form-item>

            <a-form-item name="avatarUrl" label="头像地址">
              <a-input
                v-model:value="profileForm.avatarUrl"
                placeholder="不上传新图片时，可保留或填写头像地址"
              />
            </a-form-item>

            <a-form-item name="userProfile" label="个人简介">
              <a-textarea
                v-model:value="profileForm.userProfile"
                :rows="5"
                placeholder="介绍一下你自己，或者写下这个账号的用途"
              />
            </a-form-item>

            <div class="submit-row">
              <a-button @click="resetProfileForm">重置</a-button>
              <a-button type="primary" html-type="submit" :loading="profileSaving">
                保存资料
              </a-button>
            </div>
          </a-form>
        </a-spin>
      </a-card>
    </div>

    <a-card class="apps-card" :bordered="false">
      <div class="apps-head">
        <div>
          <p class="panel-eyebrow">My apps</p>
          <h2>我的应用</h2>
          <p class="apps-desc">继续生成、编辑资料，或者直接打开本地预览。</p>
        </div>

        <div class="apps-actions">
          <a-input-search
            v-model:value="appQuery.appName"
            allow-clear
            class="search-input"
            placeholder="按应用名称搜索"
            enter-button="搜索"
            @search="handleAppSearch"
          />
          <a-button @click="loadMyApps">刷新</a-button>
        </div>
      </div>

      <a-spin :spinning="appsLoading">
        <a-empty v-if="!myApps.length" description="你还没有创建应用，去首页试试新的想法吧。" />

        <div v-else class="card-grid">
          <AppCard
            v-for="app in myApps"
            :key="app.id"
            :app="app"
            show-actions
            @click="goToChat(app)"
          >
            <template #actions>
              <a-button type="link" @click="goToChat(app)">继续生成</a-button>
              <a-button type="link" @click="goToEdit(app)">编辑</a-button>
              <a-button type="link" :href="getPreviewUrl(app)" target="_blank" @click.stop>
                进入应用
              </a-button>
            </template>
          </AppCard>
        </div>
      </a-spin>

      <div class="pagination-row">
        <a-pagination
          v-model:current="appQuery.pageNum"
          v-model:page-size="appQuery.pageSize"
          :total="myTotal"
          :show-size-changer="true"
          :page-size-options="['6', '12', '18']"
          @change="loadMyApps"
        />
      </div>
    </a-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { UploadProps } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { Upload, message } from 'ant-design-vue'
import AppCard from '@/components/AppCard.vue'
import { getMyAppPage, type AppQueryRequest, type AppVO } from '@/api/app'
import {
  getLoginUserDetail,
  updateUserWithAvatar,
  type SysUser,
  type SysUserUpdateRequest,
} from '@/api/sysUserApi'
import { useLoginUserStore } from '@/stores/loginUser'
import { buildLocalPreviewUrl, formatDateTime, isSuccessCode } from '@/utils/appUtils'

type ProfileFormModel = Partial<SysUser> & { id?: number }

const AVATAR_SIZE_LIMIT = 5 * 1024 * 1024

const router = useRouter()
const loginUserStore = useLoginUserStore()

const formRef = ref<FormInstance>()
const profileLoading = ref(false)
const profileSaving = ref(false)
const appsLoading = ref(false)
const profileSnapshot = ref<SysUser | null>(null)
const avatarFile = ref<File>()
const avatarPreview = ref('')
const myApps = ref<AppVO[]>([])
const myTotal = ref(0)

const profileForm = reactive<ProfileFormModel>({
  id: undefined,
  account: '',
  email: '',
  nickname: '',
  avatarUrl: '',
  userProfile: '',
  userRole: '',
  status: 0,
  registerType: undefined,
  lastLoginTime: '',
})

const appQuery = reactive<AppQueryRequest>({
  pageNum: 1,
  pageSize: 6,
  appName: '',
})

const profileRules: Record<string, Rule[]> = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

const displayName = computed(
  () => profileForm.nickname?.trim() || profileForm.account?.trim() || '当前用户',
)
const avatarText = computed(() => (displayName.value.slice(0, 1) || 'U').toUpperCase())

watch(
  () => profileForm.avatarUrl,
  (value) => {
    if (!avatarFile.value) {
      avatarPreview.value = value?.trim() || ''
    }
  },
)

onBeforeUnmount(() => {
  clearAvatarSelection()
})

function roleText(userRole?: string) {
  return userRole === 'admin' ? '管理员' : '普通用户'
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

function syncProfileForm(user: SysUser) {
  profileSnapshot.value = user
  Object.assign(profileForm, {
    id: user.id,
    account: user.account || '',
    email: user.email || '',
    nickname: user.nickname || '',
    avatarUrl: user.avatarUrl || '',
    userProfile: user.userProfile || '',
    userRole: user.userRole || '',
    status: user.status ?? 0,
    registerType: user.registerType,
    lastLoginTime: user.lastLoginTime || '',
  })
  if (!avatarFile.value) {
    avatarPreview.value = user.avatarUrl || ''
  }
}

function syncLoginUserStore(user: SysUser) {
  loginUserStore.updateLoginUser({
    id: user.id,
    account: user.account,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    userProfile: user.userProfile,
    userRole: user.userRole,
    registerType: user.registerType,
    status: user.status,
    lastLoginTime: user.lastLoginTime,
  })
}

async function loadProfile() {
  profileLoading.value = true
  try {
    const res = await getLoginUserDetail()
    if (!isSuccessCode(res.code) || !res.data) {
      throw new Error(res.message || '加载个人资料失败')
    }

    syncProfileForm(res.data)
    syncLoginUserStore(res.data)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载个人资料失败')
  } finally {
    profileLoading.value = false
  }
}

function resetProfileForm() {
  formRef.value?.clearValidate()
  if (!profileSnapshot.value) {
    return
  }
  clearAvatarSelection()
  syncProfileForm(profileSnapshot.value)
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

const handleAvatarBeforeUpload: UploadProps['beforeUpload'] = (file) => {
  const avatar = file as File
  if (!validateAvatarFile(avatar)) {
    return Upload.LIST_IGNORE
  }
  revokeBlobUrl(avatarPreview.value)
  avatarFile.value = avatar
  avatarPreview.value = URL.createObjectURL(avatar)
  return false
}

function clearAvatarSelection() {
  revokeBlobUrl(avatarPreview.value)
  avatarFile.value = undefined
  avatarPreview.value = profileForm.avatarUrl?.trim() || ''
}

async function handleSave() {
  await formRef.value?.validate()
  profileSaving.value = true
  try {
    const latestRes = await getLoginUserDetail()
    if (!isSuccessCode(latestRes.code) || !latestRes.data?.id) {
      throw new Error(latestRes.message || '获取最新用户信息失败')
    }

    const latest = latestRes.data
    const payload: SysUserUpdateRequest = {
      account: latest.account?.trim(),
      email: profileForm.email?.trim(),
      nickname: profileForm.nickname?.trim(),
      avatarUrl: profileForm.avatarUrl?.trim(),
      userProfile: profileForm.userProfile?.trim(),
      userRole: latest.userRole,
      status: latest.status,
    }

    const res = await updateUserWithAvatar(latest.id as number, payload, avatarFile.value)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '保存失败')
    }

    message.success('个人资料已更新')
    clearAvatarSelection()
    await loadProfile()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败，请稍后重试')
  } finally {
    profileSaving.value = false
  }
}

async function loadMyApps() {
  appsLoading.value = true
  try {
    const res = await getMyAppPage({ ...appQuery })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '加载我的应用失败')
    }
    myApps.value = res.data?.records || []
    myTotal.value = Number(res.data?.totalRow || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载我的应用失败')
  } finally {
    appsLoading.value = false
  }
}

async function handleAppSearch() {
  appQuery.pageNum = 1
  await loadMyApps()
}

function goToChat(app: AppVO) {
  router.push(`/apps/${app.id}/chat`)
}

function goToEdit(app: AppVO) {
  router.push(`/apps/${app.id}/edit`)
}

function getPreviewUrl(app: AppVO) {
  return buildLocalPreviewUrl(app.id, app.codeGenType)
}

void Promise.all([loadProfile(), loadMyApps()])
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: 24px;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.1fr);
  gap: 24px;
}

.profile-hero-card,
.profile-form-card,
.apps-card {
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(24, 45, 79, 0.08);
}

.profile-hero-card {
  background:
    radial-gradient(circle at 100% 0, rgba(31, 167, 199, 0.18), transparent 24%),
    radial-gradient(circle at 12% 100%, rgba(72, 134, 255, 0.12), transparent 20%),
    linear-gradient(145deg, #ffffff 0%, #f4f9ff 100%);
}

.identity-wrap {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
}

.profile-eyebrow,
.panel-eyebrow {
  margin: 0;
  color: #1a9dc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.identity-head {
  display: flex;
  align-items: center;
  gap: 18px;
}

.hero-avatar,
.preview-avatar {
  flex-shrink: 0;
  background: linear-gradient(145deg, #1fb7cf, #127fc6);
}

.identity-copy h1 {
  margin: 0;
  color: #142137;
  font-size: clamp(30px, 4vw, 40px);
  line-height: 1.08;
  letter-spacing: -0.05em;
}

.identity-copy p {
  margin: 10px 0 0;
  color: #627289;
  line-height: 1.7;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.hero-desc {
  margin: 0;
  color: #61728b;
  line-height: 1.8;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  border: 1px solid rgba(26, 43, 69, 0.07);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
}

.stat-card span {
  color: #72819a;
  font-size: 12px;
}

.stat-card strong {
  color: #18273f;
  font-size: 16px;
}

.profile-form-card {
  background: rgba(255, 255, 255, 0.92);
}

.panel-head,
.apps-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.panel-head h2,
.apps-head h2 {
  margin: 8px 0 0;
  color: #132033;
  font-size: 32px;
  line-height: 1.1;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.avatar-editor {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(26, 43, 69, 0.08);
  border-radius: 22px;
  background: linear-gradient(180deg, #fbfdff 0%, #f6faff 100%);
}

.avatar-preview-card {
  display: flex;
  align-items: center;
  gap: 18px;
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

.avatar-actions,
.apps-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.submit-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.apps-card {
  background: rgba(255, 255, 255, 0.92);
}

.apps-desc {
  margin: 12px 0 0;
  color: #6b7a92;
  line-height: 1.7;
}

.search-input {
  width: 320px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 28px;
}

@media (max-width: 1180px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .panel-head,
  .apps-head {
    flex-direction: column;
  }

  .apps-actions {
    width: 100%;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .form-grid,
  .stat-grid,
  .card-grid {
    grid-template-columns: 1fr;
  }

  .identity-head,
  .avatar-preview-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .submit-row {
    justify-content: stretch;
  }
}
</style>
