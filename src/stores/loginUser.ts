import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getLoginUser, type LoginUserVO } from '@/api/sysUserApi'

type LoginUserInfo = LoginUserVO['user']

const SUCCESS_CODES = new Set([0, 20000])

export const useLoginUserStore = defineStore('loginUser', () => {
  const loginUser = ref<LoginUserInfo | null>(null)
  const loading = ref(false)
  const hasFetched = ref(false)
  let fetchPromise: Promise<LoginUserInfo | null> | null = null

  const isLogin = computed(() => Boolean(loginUser.value?.id))

  function setLoginUser(user: LoginUserInfo | null) {
    loginUser.value = user
    hasFetched.value = true
  }

  function updateLoginUser(user: Partial<LoginUserInfo>) {
    if (!loginUser.value) {
      return
    }

    loginUser.value = {
      ...loginUser.value,
      ...user,
    }
  }

  function clearLoginUser() {
    loginUser.value = null
    hasFetched.value = false
  }

  async function fetchLoginUser() {
    if (fetchPromise) {
      return fetchPromise
    }

    fetchPromise = (async () => {
      loading.value = true
      try {
        const res = await getLoginUser()
        const code = Number(res.code ?? -1)

        if (!SUCCESS_CODES.has(code)) {
          clearLoginUser()
          hasFetched.value = true
          return null
        }

        setLoginUser(res.data?.user ?? null)
        hasFetched.value = true
        return loginUser.value
      } catch (_error) {
        clearLoginUser()
        hasFetched.value = true
        return null
      } finally {
        loading.value = false
      }
    })()

    try {
      return await fetchPromise
    } finally {
      fetchPromise = null
    }
  }

  return {
    loginUser,
    loading,
    hasFetched,
    isLogin,
    setLoginUser,
    updateLoginUser,
    clearLoginUser,
    fetchLoginUser,
  }
})
