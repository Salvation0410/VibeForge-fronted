import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getCommunityTagList, type CommunityTagVO } from '@/api/community'
import { useLoginUserStore } from '@/stores/loginUser'
import { isAdminRole, isSuccessCode } from '@/utils/appUtils'

export const useCommunityStore = defineStore('community', () => {
  const tags = ref<CommunityTagVO[]>([])
  const tagsLoading = ref(false)

  const loginUserStore = useLoginUserStore()
  const isLogin = computed(() => loginUserStore.isLogin)
  const loginUser = computed(() => loginUserStore.loginUser)
  const isAdmin = computed(() => isAdminRole(loginUserStore.loginUser?.userRole))

  async function loadTags(force = false) {
    if (tags.value.length && !force) {
      return tags.value
    }

    tagsLoading.value = true
    try {
      const res = await getCommunityTagList()
      if (!isSuccessCode(res.code)) {
        throw new Error(res.message || '标签加载失败')
      }
      tags.value = res.data || []
      return tags.value
    } finally {
      tagsLoading.value = false
    }
  }

  return {
    tags,
    tagsLoading,
    isLogin,
    loginUser,
    isAdmin,
    loadTags,
  }
})
