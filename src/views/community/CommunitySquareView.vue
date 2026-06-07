<template>
  <section class="community-square-page">
    <header class="community-topbar">
      <button class="community-logo" type="button" @click="resetToAll">
        <img class="logo-image" src="@/assets/logo.png" alt="智创 · AI应用平台" />
        <span class="logo-copy">
          <span class="logo-name">智创 · AI应用平台</span>
          <span class="logo-subtitle">交流社区</span>
        </span>
      </button>

      <label class="community-search">
        <span class="search-icon"></span>
        <input
          v-model="keywordInput"
          type="search"
          placeholder="搜索帖子、问题或灵感"
          @keyup.enter="handleSearch(keywordInput)"
          @input="handleKeywordInput"
        />
      </label>

      <div class="topbar-actions">
        <button class="publish-entry" type="button" @click="openEditor">
          <span class="edit-icon"></span>
          发布帖子
        </button>

        <a-dropdown placement="bottomRight" trigger="click">
          <button class="profile-entry" type="button">
            <img
              v-if="communityStore.loginUser?.avatarUrl"
              :src="communityStore.loginUser.avatarUrl"
              alt="用户头像"
            />
            <span v-else>{{ avatarText }}</span>
          </button>

          <template #overlay>
            <a-menu @click="handleAvatarMenuClick">
              <a-menu-item key="profile">个人中心</a-menu-item>
              <a-menu-item key="logout">退出账号</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </header>

    <section class="community-shell">
      <main class="community-board">
        <section class="board-toolbar">
          <div class="board-head">
            <div class="board-copy">
              <span class="board-eyebrow">Community</span>
              <h1>一起聊想法、经验和作品</h1>
              <p>浏览最新讨论，按标签筛选，或者把你的问题与实践写成一篇帖子。</p>
            </div>

            <div class="sort-switch">
              <button
                v-for="option in sortOptions"
                :key="option.value"
                class="sort-tab"
                :class="{ active: query.sortType === option.value }"
                type="button"
                @click="changeSort(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="tag-strip">
            <button
              class="tag-chip"
              :class="{ active: !query.tagId }"
              type="button"
              @click="selectTag(undefined)"
            >
              全部
            </button>
            <button
              v-for="tag in communityStore.tags"
              :key="String(tag.id)"
              class="tag-chip"
              :class="{ active: String(query.tagId ?? '') === String(tag.id ?? '') }"
              type="button"
              @click="selectTag(tag.id)"
            >
              {{ tag.name }}
            </button>
          </div>
        </section>

        <a-spin :spinning="loading && !posts.length">
          <a-empty
            v-if="!loading && !posts.length"
            class="community-empty"
            description="暂时还没有符合条件的帖子"
          />

          <section v-else class="community-feed">
            <CommunityPostCard
              v-for="post in posts"
              :key="String(post.id)"
              :post="post"
              :is-admin="communityStore.isAdmin"
              :like-loading="likingIds.has(String(post.id))"
              @open="openPost"
              @like="handleLike"
              @review="handleReview"
              @pin="handlePin"
            />
          </section>
        </a-spin>

        <div class="load-more-row">
          <button
            v-if="hasMore"
            class="load-more-button"
            type="button"
            :disabled="loading"
            @click="loadMore"
          >
            {{ loading ? '加载中...' : '加载更多' }}
          </button>
          <span v-else-if="posts.length" class="feed-end">已经到底了</span>
        </div>
      </main>

      <CommunityAdminPanel
        v-if="communityStore.isAdmin"
        class="admin-sidebar"
        :post-count="posts.length"
        :pending-count="pendingCount"
        :tag-count="communityStore.tags.length"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { MenuProps } from 'ant-design-vue'
import { Modal, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import {
  getCommunityPostPage,
  pinCommunityPost,
  reviewCommunityPost,
  toggleCommunityPostLike,
  type CommunityId,
  type CommunityPostQueryRequest,
  type CommunityPostVO,
} from '@/api/community'
import { logoutUser } from '@/api/sysUserApi'
import CommunityAdminPanel from '@/components/community/CommunityAdminPanel.vue'
import CommunityPostCard from '@/components/community/CommunityPostCard.vue'
import { useCommunityStore } from '@/stores/community'
import { useLoginUserStore } from '@/stores/loginUser'
import { isSuccessCode } from '@/utils/appUtils'

const router = useRouter()
const communityStore = useCommunityStore()
const loginUserStore = useLoginUserStore()

const sortOptions: Array<{ label: string; value: 'latest' | 'hot' }> = [
  { label: '最新', value: 'latest' },
  { label: '最热', value: 'hot' },
]

const query = reactive<CommunityPostQueryRequest>({
  pageSize: 10,
  keyword: '',
  tagId: undefined,
  sortType: 'latest',
})

const keywordInput = ref('')
const posts = ref<CommunityPostVO[]>([])
const nextCursor = ref<string | undefined>()
const hasMore = ref(false)
const loading = ref(false)
const likingIds = ref(new Set<string>())

const avatarText = computed(() => {
  const name = communityStore.loginUser?.nickname || communityStore.loginUser?.account || 'N'
  return name.slice(0, 1).toUpperCase()
})

const pendingCount = computed(() => posts.value.filter((item) => item.status === 'PENDING').length)

function requireLogin(actionText: string) {
  message.warning(`${actionText}需要先登录`)
}

async function loadMore() {
  if (loading.value) {
    return
  }

  loading.value = true
  try {
    const res = await getCommunityPostPage({
      ...query,
      cursor: nextCursor.value,
    })
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '帖子加载失败')
    }

    const page = res.data
    posts.value = [...posts.value, ...(page?.records || [])]
    nextCursor.value = page?.nextCursor
    hasMore.value = Boolean(page?.hasMore)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '帖子加载失败')
  } finally {
    loading.value = false
  }
}

async function resetAndLoad() {
  posts.value = []
  nextCursor.value = undefined
  hasMore.value = false
  await loadMore()
}

function handleSearch(value: string) {
  query.keyword = value.trim()
  void resetAndLoad()
}

function handleKeywordInput() {
  if (!keywordInput.value && query.keyword) {
    query.keyword = ''
    void resetAndLoad()
  }
}

function changeSort(sortType: 'latest' | 'hot') {
  if (query.sortType === sortType) {
    return
  }
  query.sortType = sortType
  void resetAndLoad()
}

function selectTag(tagId?: CommunityId) {
  query.tagId = tagId
  void resetAndLoad()
}

function resetToAll() {
  keywordInput.value = ''
  query.keyword = ''
  query.tagId = undefined
  query.sortType = 'latest'
  void resetAndLoad()
}

function openEditor() {
  if (!communityStore.isLogin) {
    requireLogin('发帖')
    return
  }
  void router.push('/community/create')
}

const handleAvatarMenuClick: MenuProps['onClick'] = async (e) => {
  if (e.key === 'profile') {
    if (!communityStore.isLogin) {
      requireLogin('查看个人中心')
      return
    }
    await router.push('/profile')
    return
  }

  if (e.key !== 'logout') {
    return
  }

  if (!communityStore.isLogin) {
    requireLogin('退出登录')
    return
  }

  Modal.confirm({
    title: '确认退出登录？',
    content: '退出后需要重新登录才能继续发帖、评论和管理社区内容。',
    okText: '退出登录',
    cancelText: '取消',
    async onOk() {
      try {
        await logoutUser()
      } finally {
        loginUserStore.clearLoginUser()
        message.success('已退出登录')
        await router.push('/login')
      }
    },
  })
}

function openPost(post: CommunityPostVO) {
  if (post.id) {
    void router.push(`/community/post/${post.id}`)
  }
}

async function handleLike(post: CommunityPostVO) {
  if (!communityStore.isLogin) {
    requireLogin('点赞')
    return
  }
  if (!post.id) {
    return
  }

  const id = String(post.id)
  likingIds.value = new Set(likingIds.value).add(id)
  try {
    const res = await toggleCommunityPostLike(post.id)
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '点赞失败')
    }
    post.liked = Boolean(res.data?.liked)
    post.likeCount = Number(res.data?.likeCount || 0)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '点赞失败')
  } finally {
    const next = new Set(likingIds.value)
    next.delete(id)
    likingIds.value = next
  }
}

function handleReview(post: CommunityPostVO, status: 'APPROVED' | 'REJECTED') {
  if (!post.id) {
    return
  }

  Modal.confirm({
    title: status === 'APPROVED' ? '通过这篇帖子？' : '驳回这篇帖子？',
    content: '这里保留了管理员在社区前台直接审核内容的入口。',
    async onOk() {
      const res = await reviewCommunityPost({
        postId: post.id as CommunityId,
        status,
      })
      if (!isSuccessCode(res.code)) {
        throw new Error(res.message || '审核失败')
      }
      message.success('审核状态已更新')
      post.status = status
    },
  })
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
    message.success(pinned ? '已置顶' : '已取消置顶')
    post.isPinned = pinned ? 1 : 0
  } catch (error) {
    message.error(error instanceof Error ? error.message : '置顶操作失败')
  }
}

void communityStore.loadTags()
void resetAndLoad()
</script>

<style scoped>
.community-square-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.1), transparent 24%),
    radial-gradient(circle at 0% 100%, rgba(56, 189, 248, 0.12), transparent 24%),
    linear-gradient(180deg, #f7f9fc 0%, #f4f6f8 100%);
  color: #111827;
}

.community-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 240px minmax(280px, 1fr) 220px;
  align-items: center;
  gap: 24px;
  height: 84px;
  padding: 0 28px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.95);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  box-sizing: border-box;
}

.community-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.logo-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-image {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 10px 22px rgba(31, 167, 199, 0.16));
}

.logo-name {
  color: #111827;
  font-size: 17px;
  font-weight: 700;
}

.logo-subtitle {
  color: #9ca3af;
  font-size: 12px;
}

.community-search {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #f9fafb;
}

.search-icon {
  position: relative;
  width: 15px;
  height: 15px;
  border: 1.8px solid #6b7280;
  border-radius: 50%;
}

.search-icon::after {
  position: absolute;
  right: -4px;
  bottom: -5px;
  width: 7px;
  height: 2px;
  border-radius: 999px;
  background: #6b7280;
  content: '';
  transform: rotate(45deg);
}

.community-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #111827;
  font-size: 15px;
}

.community-search input::placeholder {
  color: #9ca3af;
}

.topbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.publish-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  background: #111111;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.edit-icon {
  position: relative;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 3px;
}

.edit-icon::after {
  position: absolute;
  top: -5px;
  right: -4px;
  width: 10px;
  height: 3px;
  border-radius: 999px;
  background: #fff;
  content: '';
  transform: rotate(-45deg);
}

.profile-entry {
  padding: 0;
  border: 0;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.profile-entry img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  max-width: 1420px;
  margin: 0 auto;
  padding: 28px 24px 40px;
}

.community-shell:has(.admin-sidebar) {
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
}

.community-board {
  display: grid;
  gap: 20px;
}

.board-toolbar {
  padding: 28px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.06);
}

.board-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.board-copy h1 {
  margin: 8px 0 12px;
  color: #111827;
  font-size: 30px;
  line-height: 1.2;
}

.board-copy p {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.75;
}

.board-eyebrow {
  color: #6366f1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sort-switch {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: #f3f4f6;
}

.sort-tab {
  min-width: 76px;
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.sort-tab.active {
  background: #111827;
  color: #fff;
}

.tag-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.tag-chip {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.tag-chip.active {
  border-color: #111827;
  background: #111827;
  color: #fff;
}

.community-feed {
  display: grid;
  gap: 18px;
}

.community-feed :deep(.post-row) {
  padding: 24px 26px 28px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
}

.community-feed :deep(.post-row + .post-row) {
  padding-top: 24px;
}

.community-empty {
  padding: 72px 0;
  border: 1px dashed #d1d5db;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
}

.load-more-row {
  display: flex;
  justify-content: center;
  min-height: 60px;
  padding-top: 4px;
}

.load-more-button {
  height: 40px;
  padding: 0 18px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
}

.load-more-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.feed-end {
  color: #9ca3af;
  font-size: 14px;
}

.admin-sidebar {
  position: sticky;
  top: 108px;
}

@media (max-width: 1260px) {
  .community-topbar {
    grid-template-columns: 220px minmax(0, 1fr) auto;
    padding: 0 20px;
  }

  .community-shell,
  .community-shell:has(.admin-sidebar) {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: static;
  }
}

@media (max-width: 860px) {
  .community-topbar {
    grid-template-columns: 1fr;
    height: auto;
    padding: 16px;
  }

  .topbar-actions {
    justify-content: flex-start;
  }

  .board-toolbar {
    padding: 22px 18px;
  }

  .board-head {
    flex-direction: column;
  }

  .board-copy h1 {
    font-size: 24px;
  }

  .community-shell {
    padding: 18px 14px 32px;
  }
}
</style>
