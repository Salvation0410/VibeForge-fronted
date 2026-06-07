<template>
  <section class="profile-page">
    <a-spin :spinning="pageLoading">
      <a-empty v-if="!hasProfile" :description="profileErrorText || '用户不存在或暂不可见'" />

      <template v-else>
        <section class="hero-panel">
          <div class="hero-backdrop"></div>

          <div class="hero-content">
            <span class="hero-eyebrow">{{ heroEyebrow }}</span>

            <a-avatar :size="112" :src="avatarPreview || undefined" class="hero-avatar">
              {{ avatarText }}
            </a-avatar>

            <h1>{{ displayName }}</h1>
            <p class="hero-summary">{{ heroSummary }}</p>

            <div class="hero-actions">
              <a-button v-if="isOwnerView" type="primary" @click="openEditDrawer">编辑资料</a-button>
              <a-button v-if="!isOwnerView && routeUserId" @click="goToCommunity">去社区看看</a-button>
            </div>

            <div class="hero-stats">
              <article v-for="item in summaryCards" :key="item.label" class="stat-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </article>
            </div>
          </div>
        </section>

        <section class="content-panel">
          <div class="content-head">
            <div>
              <p class="panel-eyebrow">Workspace</p>
              <h2>{{ isOwnerView ? '我的主页' : '公开主页' }}</h2>
              <p class="panel-desc">
                {{
                  isOwnerView
                    ? '这里集中展示你的应用、文章和个人信息。'
                    : '这里展示该用户愿意公开的资料、应用和社区文章。'
                }}
              </p>
            </div>

            <div class="tab-switcher">
              <button
                class="tab-button"
                :class="{ active: activeTab === 'apps' }"
                type="button"
                @click="activeTab = 'apps'"
              >
                作品
              </button>
              <button
                class="tab-button"
                :class="{ active: activeTab === 'articles' }"
                type="button"
                @click="activeTab = 'articles'"
              >
                文章
              </button>
            </div>
          </div>

          <section v-if="activeTab === 'apps'" class="section-panel">
            <div class="section-head">
              <div>
                <h3>{{ isOwnerView ? '我的应用' : 'TA 的应用' }}</h3>
                <p>
                  {{
                    isOwnerView
                      ? '继续编辑、预览和管理你生成的应用。'
                      : '这里展示该用户公开可查看的应用作品。'
                  }}
                </p>
                <p v-if="appSectionHint" class="section-hint">{{ appSectionHint }}</p>
              </div>

              <div class="section-actions">
                <a-input-search
                  v-model:value="appQuery.appName"
                  allow-clear
                  class="search-input"
                  placeholder="按应用名称搜索"
                  enter-button="搜索"
                  @search="handleAppSearch"
                />
                <a-button @click="loadApps">刷新</a-button>
              </div>
            </div>

            <a-spin :spinning="appsLoading">
              <a-empty
                v-if="!visibleApps.length"
                :description="isOwnerView ? '你还没有生成应用，先去首页试试新的想法吧。' : 'TA 还没有公开应用。'"
              />

              <template v-else>
                <div class="card-grid">
                  <AppCard
                    v-for="app in visibleApps"
                    :key="app.id"
                    :app="app"
                    :show-actions="isOwnerView"
                    @click="handleAppCardClick(app)"
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

                <div class="pagination-row">
                  <a-pagination
                    v-model:current="appQuery.pageNum"
                    v-model:page-size="appQuery.pageSize"
                    :total="appsTotal"
                    :show-size-changer="true"
                    :page-size-options="['6', '12', '18']"
                    @change="handleAppPageChange"
                  />
                </div>
              </template>
            </a-spin>
          </section>

          <section v-else class="section-panel">
            <div class="section-head compact">
              <div>
                <h3>{{ isOwnerView ? '我的文章' : 'TA 的文章' }}</h3>
                <p>
                  {{
                    isOwnerView
                      ? '这里展示你在交流社区发布的帖子和审核状态。'
                      : '这里展示该用户在交流社区公开可见的文章。'
                  }}
                </p>
                <p v-if="postSectionHint" class="section-hint">{{ postSectionHint }}</p>
              </div>

              <div class="section-actions compact-actions">
                <a-button @click="reloadPosts">刷新</a-button>
              </div>
            </div>

            <a-spin :spinning="postsLoading">
              <a-empty
                v-if="postsInitialLoaded && !visiblePosts.length"
                :description="isOwnerView ? '你还没有发布帖子。' : 'TA 还没有公开文章。'"
              />

              <template v-else>
                <div class="post-grid">
                  <ProfilePostCard
                    v-for="post in visiblePosts"
                    :key="String(post.id)"
                    :post="post"
                    :owner-view="isOwnerView"
                    @click="openPostDetail"
                  />
                </div>

                <div v-if="postsHasMore || postsLoadingMore" class="load-more-row">
                  <a-button :loading="postsLoadingMore" @click="loadMorePosts">加载更多</a-button>
                </div>
              </template>
            </a-spin>
          </section>
        </section>

        <a-drawer
          v-if="isOwnerView"
          v-model:open="editDrawerOpen"
          title="编辑个人资料"
          width="520"
          destroy-on-close
        >
          <a-form
            ref="formRef"
            :model="profileForm"
            :rules="profileRules"
            layout="vertical"
            @finish="handleSave"
          >
            <a-form-item label="账号">
              <a-input :value="profileForm.account" disabled />
            </a-form-item>

            <a-form-item name="email" label="邮箱">
              <a-input v-model:value="profileForm.email" placeholder="请输入邮箱" />
            </a-form-item>

            <a-form-item name="nickname" label="昵称">
              <a-input v-model:value="profileForm.nickname" placeholder="给自己起一个更好识别的名字" />
            </a-form-item>

            <a-form-item label="头像">
              <div class="avatar-editor">
                <div class="avatar-preview-card">
                  <a-avatar :size="88" :src="avatarPreview || undefined" class="preview-avatar">
                    {{ avatarText }}
                  </a-avatar>
                  <div>
                    <div class="preview-title">当前头像预览</div>
                    <p>支持上传新头像，也可以继续使用头像地址。</p>
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
                placeholder="介绍一下你自己，或者写下这个账号的使用方向"
              />
            </a-form-item>

            <div class="drawer-actions">
              <a-button @click="resetProfileForm">重置</a-button>
              <a-button type="primary" html-type="submit" :loading="profileSaving">保存资料</a-button>
            </div>
          </a-form>
        </a-drawer>
      </template>
    </a-spin>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { useRoute, useRouter } from 'vue-router'
import type { UploadProps } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { Upload, message } from 'ant-design-vue'
import AppCard from '@/components/AppCard.vue'
import ProfilePostCard from '@/components/profile/ProfilePostCard.vue'
import {
  getMyAppPage,
  getUserPublicAppPage,
  type AppQueryRequest,
  type AppVO,
} from '@/api/app'
import {
  getMyCommunityPostPage,
  getUserCommunityPostPage,
  type CommunityPostQueryRequest,
  type CommunityPostVO,
} from '@/api/community'
import {
  getLoginUserDetail,
  getUserVoById,
  type UserId,
  updateCurrentUserProfileWithAvatar,
  type SysUser,
  type SysUserUpdateRequest,
  type SysUserVO,
} from '@/api/sysUserApi'
import { useLoginUserStore } from '@/stores/loginUser'
import { buildLocalPreviewUrl, formatDateTime, isSuccessCode } from '@/utils/appUtils'
import { isSameUserId, normalizeUserId } from '@/utils/userId'

type ProfileFormModel = Partial<SysUser> & { id?: UserId }
type ProfileSource = Partial<SysUser & SysUserVO> & { id?: UserId }
type ActiveTab = 'apps' | 'articles'

const AVATAR_SIZE_LIMIT = 5 * 1024 * 1024
const DEFAULT_POST_PAGE_SIZE = 6

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

const formRef = ref<FormInstance>()
const pageLoading = ref(false)
const profileSaving = ref(false)
const appsLoading = ref(false)
const postsLoading = ref(false)
const postsLoadingMore = ref(false)
const postsInitialLoaded = ref(false)
const profileSnapshot = ref<ProfileFormModel | null>(null)
const avatarFile = ref<File>()
const avatarPreview = ref('')
const visibleApps = ref<AppVO[]>([])
const visiblePosts = ref<CommunityPostVO[]>([])
const appsTotal = ref(0)
const postNextCursor = ref<string>()
const postsHasMore = ref(false)
const appSectionHint = ref('')
const postSectionHint = ref('')
const editDrawerOpen = ref(false)
const activeTab = ref<ActiveTab>('apps')
const profileErrorText = ref('')

const createEmptyProfileForm = (): ProfileFormModel => ({
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

const profileForm = reactive<ProfileFormModel>(createEmptyProfileForm())

const appQuery = reactive<AppQueryRequest>({
  pageNum: 1,
  pageSize: 6,
  appName: '',
})

const postQuery = reactive<CommunityPostQueryRequest>({
  pageSize: DEFAULT_POST_PAGE_SIZE,
  sortType: 'latest',
})

const profileRules: Record<string, Rule[]> = {
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

const routeUserId = computed(() => {
  const raw = route.params.userId
  return normalizeUserId(Array.isArray(raw) ? raw[0] : raw)
})

const isPublicRoute = computed(() => Boolean(route.params.userId))
const isOwnerView = computed(() => {
  if (!isPublicRoute.value) {
    return true
  }

  return isSameUserId(loginUserStore.loginUser?.id, routeUserId.value)
})

const hasProfile = computed(() => Boolean(profileForm.id || profileForm.account || profileForm.nickname))
const displayName = computed(() => profileForm.nickname?.trim() || profileForm.account?.trim() || '未命名用户')
const avatarText = computed(() => (displayName.value.slice(0, 1) || 'U').toUpperCase())
const heroEyebrow = computed(() => (isOwnerView.value ? 'Personal Center' : 'Public Profile'))
const heroSummary = computed(() => {
  if (profileForm.userProfile?.trim()) {
    return profileForm.userProfile.trim()
  }
  return isOwnerView.value ? '完善你的资料，让社区更快认识你。' : '这位创作者正在分享自己的应用与社区内容。'
})
const heroDescription = computed(() => {
  if (isOwnerView.value) {
    return `账号 ${profileForm.account || '-'} · ${registerTypeText(profileForm.registerType)} · 最近登录 ${formatDateTime(profileForm.lastLoginTime)}`
  }
  return `${roleText(profileForm.userRole)} · 公开主页仅展示公开资料、公开应用和社区文章`
})

const summaryCards = computed(() => {
  if (isOwnerView.value) {
    return [
      { label: '账号', value: profileForm.account || '-' },
      { label: '注册方式', value: registerTypeText(profileForm.registerType) },
      { label: '应用总数', value: String(appsTotal.value) },
      { label: '已加载文章', value: String(visiblePosts.value.length) },
    ]
  }
  return [
    { label: '主页身份', value: roleText(profileForm.userRole) },
    { label: '账号', value: profileForm.account || '-' },
    { label: '公开应用', value: String(appsTotal.value) },
    { label: '公开文章', value: String(visiblePosts.value.length) },
  ]
})

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

function syncProfileForm(user: ProfileSource) {
  profileSnapshot.value = {
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
  }

  Object.assign(profileForm, profileSnapshot.value)
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

function resetContentState() {
  visibleApps.value = []
  visiblePosts.value = []
  appsTotal.value = 0
  postNextCursor.value = undefined
  postsHasMore.value = false
  postsInitialLoaded.value = false
  appSectionHint.value = ''
  postSectionHint.value = ''
}

function mergePosts(currentPosts: CommunityPostVO[], incomingPosts: CommunityPostVO[]) {
  const map = new Map<string, CommunityPostVO>()
  currentPosts.forEach((post) => map.set(String(post.id), post))
  incomingPosts.forEach((post) => map.set(String(post.id), post))
  return Array.from(map.values())
}

function isNotFoundError(error: unknown) {
  return isAxiosError(error) && error.response?.status === 404
}

async function ensureLoginUserKnown() {
  if (!loginUserStore.hasFetched) {
    await loginUserStore.fetchLoginUser()
  }
}

async function loadProfile() {
  profileErrorText.value = ''
  try {
    if (isOwnerView.value) {
      const res = await getLoginUserDetail()
      if (!isSuccessCode(res.code) || !res.data) {
        throw new Error(res.message || '加载个人资料失败')
      }
      syncProfileForm(res.data)
      syncLoginUserStore(res.data)
      return
    }

    if (!routeUserId.value) {
      throw new Error('用户不存在')
    }

    const res = await getUserVoById(routeUserId.value)
    if (!isSuccessCode(res.code) || !res.data) {
      throw new Error(res.message || '加载用户主页失败')
    }
    syncProfileForm(res.data)
  } catch (error) {
    profileErrorText.value = error instanceof Error ? error.message : '加载用户主页失败'
    Object.assign(profileForm, createEmptyProfileForm())
  }
}

function resetProfileForm() {
  formRef.value?.clearValidate()
  if (!profileSnapshot.value) {
    return
  }
  clearAvatarSelection()
  Object.assign(profileForm, profileSnapshot.value)
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
      email: profileForm.email?.trim() || undefined,
      nickname: profileForm.nickname?.trim(),
      avatarUrl: profileForm.avatarUrl?.trim(),
      userProfile: profileForm.userProfile?.trim(),
    }

    const res = await updateCurrentUserProfileWithAvatar(payload, avatarFile.value)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '保存失败')
    }

    message.success('个人资料已更新')
    clearAvatarSelection()
    editDrawerOpen.value = false
    await loadProfile()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败，请稍后重试')
  } finally {
    profileSaving.value = false
  }
}

async function loadApps() {
  appsLoading.value = true
  appSectionHint.value = ''
  try {
    const query = { ...appQuery }
    const res = isOwnerView.value
      ? await getMyAppPage(query)
      : routeUserId.value
        ? await getUserPublicAppPage(String(routeUserId.value), query)
        : null

    if (!res || !isSuccessCode(res.code)) {
      throw new Error(res?.message || '加载应用失败')
    }

    visibleApps.value = res.data?.records || []
    appsTotal.value = Number(res.data?.totalRow || 0)
  } catch (error) {
    visibleApps.value = []
    appsTotal.value = 0
    if (isNotFoundError(error)) {
      appSectionHint.value = isOwnerView.value
        ? '当前后端未返回个人应用列表接口结果，请确认后端服务已重启到最新版本。'
        : '当前后端未返回公开应用列表接口结果，请确认后端服务已重启到最新版本。'
      return
    }
    message.error(error instanceof Error ? error.message : '加载应用失败')
  } finally {
    appsLoading.value = false
  }
}

async function loadPosts(reset = true) {
  const loadingRef = reset ? postsLoading : postsLoadingMore
  loadingRef.value = true
  if (reset) {
    postSectionHint.value = ''
  }

  try {
    const query: CommunityPostQueryRequest = {
      ...postQuery,
      cursor: reset ? undefined : postNextCursor.value,
    }

    const res = isOwnerView.value
      ? await getMyCommunityPostPage(query)
      : routeUserId.value
        ? await getUserCommunityPostPage(routeUserId.value, query)
        : null

    if (!res || !isSuccessCode(res.code)) {
      throw new Error(res?.message || '加载文章失败')
    }

    const incomingPosts = res.data?.records || []
    visiblePosts.value = reset ? incomingPosts : mergePosts(visiblePosts.value, incomingPosts)
    postNextCursor.value = res.data?.nextCursor
    postsHasMore.value = Boolean(res.data?.hasMore)
    postsInitialLoaded.value = true
  } catch (error) {
    if (reset) {
      visiblePosts.value = []
      postNextCursor.value = undefined
      postsHasMore.value = false
      postsInitialLoaded.value = true
    }
    if (isNotFoundError(error)) {
      postSectionHint.value = isOwnerView.value
        ? '当前后端未返回“我的帖子”接口结果，请确认后端服务已重启到包含社区个人帖子接口的最新版本。'
        : '当前后端未返回指定用户帖子接口结果，请确认后端服务已重启到包含社区个人帖子接口的最新版本。'
      return
    }
    message.error(error instanceof Error ? error.message : '加载文章失败')
  } finally {
    loadingRef.value = false
  }
}

async function refreshPage() {
  pageLoading.value = true
  editDrawerOpen.value = false
  resetContentState()
  await ensureLoginUserKnown()
  await loadProfile()

  if (hasProfile.value) {
    await Promise.all([loadApps(), loadPosts(true)])
  }

  pageLoading.value = false
}

async function handleAppSearch() {
  appQuery.pageNum = 1
  await loadApps()
}

async function handleAppPageChange(page: number, pageSize: number) {
  appQuery.pageNum = page
  appQuery.pageSize = pageSize
  await loadApps()
}

async function reloadPosts() {
  await loadPosts(true)
}

async function loadMorePosts() {
  if (!postsHasMore.value || postsLoadingMore.value) {
    return
  }
  await loadPosts(false)
}

function openEditDrawer() {
  if (!isOwnerView.value) {
    return
  }
  editDrawerOpen.value = true
}

function goToCommunity() {
  void router.push('/community')
}

function goToChat(app: AppVO) {
  void router.push(`/apps/${app.id}/chat`)
}

function goToEdit(app: AppVO) {
  void router.push(`/apps/${app.id}/edit`)
}

function getPreviewUrl(app: AppVO) {
  return buildLocalPreviewUrl(app.id, app.codeGenType)
}

function openAppPreview(app: AppVO) {
  const previewUrl = getPreviewUrl(app)
  if (!previewUrl) {
    message.warning('当前应用暂时没有可访问的预览地址')
    return
  }
  window.open(previewUrl, '_blank', 'noopener')
}

function handleAppCardClick(app: AppVO) {
  if (isOwnerView.value) {
    goToChat(app)
    return
  }
  openAppPreview(app)
}

function openPostDetail(post: CommunityPostVO) {
  if (!post.id) {
    return
  }
  void router.push(`/community/post/${post.id}`)
}

watch(
  [() => route.params.userId, () => loginUserStore.loginUser?.id],
  () => {
    appQuery.pageNum = 1
    appQuery.appName = ''
    postQuery.cursor = undefined
    void refreshPage()
  },
  { immediate: true },
)
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: 24px;
}

.hero-panel {
  position: relative;
  overflow: hidden;
  padding: 44px 32px 32px;
  border-radius: 36px;
  background:
    radial-gradient(circle at 12% 18%, rgba(96, 165, 250, 0.16), transparent 20%),
    radial-gradient(circle at 88% 14%, rgba(250, 204, 21, 0.16), transparent 20%),
    linear-gradient(180deg, #f9fbff 0%, #f3f7fc 100%);
  box-shadow: 0 24px 64px rgba(24, 45, 79, 0.08);
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.hero-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-eyebrow,
.panel-eyebrow {
  margin: 0;
  color: #1a9dc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-avatar,
.preview-avatar {
  margin-top: 18px;
  background: linear-gradient(145deg, #1fb7cf, #127fc6);
}

.hero-content h1 {
  margin: 22px 0 0;
  color: #142137;
  font-size: clamp(34px, 4vw, 48px);
  line-height: 1.08;
  letter-spacing: 0;
}

.hero-summary {
  max-width: 840px;
  margin: 14px 0 0;
  color: #4d607b;
  font-size: 18px;
  line-height: 1.8;
}

.hero-description {
  margin: 12px 0 0;
  color: #7a8799;
  font-size: 14px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  width: 100%;
  margin-top: 28px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 16px;
  border: 1px solid rgba(26, 43, 69, 0.07);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
}

.stat-card span {
  color: #72819a;
  font-size: 12px;
}

.stat-card strong {
  color: #18273f;
  font-size: 16px;
}

.content-panel {
  padding: 30px 28px;
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 64px rgba(24, 45, 79, 0.08);
}

.content-head,
.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.content-head {
  margin-bottom: 26px;
}

.content-head h2,
.section-head h3 {
  margin: 8px 0 0;
  color: #132033;
}

.content-head h2 {
  font-size: 32px;
}

.section-head h3 {
  font-size: 24px;
}

.panel-desc,
.section-head p {
  margin: 10px 0 0;
  color: #6b7a92;
  line-height: 1.7;
}

.section-hint {
  color: #c2410c;
  font-size: 13px;
}

.tab-switcher {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: #f2f5f8;
}

.tab-button {
  min-width: 88px;
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.tab-button.active {
  background: #132033;
  color: #fff;
}

.section-panel {
  display: grid;
  gap: 24px;
}

.section-head.compact {
  margin-bottom: 0;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compact-actions {
  justify-content: flex-end;
}

.search-input {
  width: 320px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.post-grid {
  display: grid;
  gap: 18px;
}

.pagination-row,
.load-more-row {
  display: flex;
  justify-content: flex-end;
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

.avatar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1180px) {
  .hero-stats,
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .content-head,
  .section-head {
    flex-direction: column;
  }

  .section-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .hero-panel,
  .content-panel {
    padding: 22px 18px;
  }

  .hero-summary {
    font-size: 16px;
  }

  .hero-stats,
  .card-grid {
    grid-template-columns: 1fr;
  }

  .avatar-preview-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .drawer-actions {
    justify-content: stretch;
  }
}
</style>
