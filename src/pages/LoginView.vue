<template>
  <section class="auth-panel" :class="{ 'is-active': isActive }">
    <div class="panel-head">
      <h2>Welcome back</h2>
      <p>登录后继续进入普通用户首页占位页</p>
    </div>

    <a-segmented v-model:value="mode" :options="modeOptions" class="mode-switch" />

    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
      autocomplete="off"
      @finish="handleSubmit"
    >
      <a-form-item v-if="mode === 'account'" name="account" label="账号">
        <a-input v-model:value="formState.account" size="large" placeholder="请输入账号" />
      </a-form-item>

      <a-form-item v-else name="email" label="邮箱地址">
        <a-input v-model:value="formState.email" size="large" placeholder="name@company.com" />
      </a-form-item>

      <a-form-item name="password" label="密码">
        <a-input-password
          v-model:value="formState.password"
          size="large"
          placeholder="请输入密码"
        />
      </a-form-item>

      <div class="row">
        <a-checkbox v-model:checked="formState.remember">记住我</a-checkbox>
        <a-button type="link" class="text-link" @click="forgotPassword">忘记密码？</a-button>
      </div>

      <a-form-item class="submit-item">
        <a-button type="primary" html-type="submit" size="large" block :loading="loading">
          登录
        </a-button>
      </a-form-item>
    </a-form>

    <div class="panel-footer">
      <span>还没有账号？</span>
      <a-button type="link" class="text-link" @click="goRegister">去注册</a-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { loginUser, type SysUserLoginRequest } from '@/api/sysUserApi'

type LoginMode = 'account' | 'email'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const mode = ref<LoginMode>('account')

const isActive = computed(() => route.name === 'login')

const modeOptions = [
  { label: '账号登录', value: 'account' },
  { label: '邮箱登录', value: 'email' },
]

const formState = reactive<SysUserLoginRequest & { remember: boolean }>({
  account: '',
  email: '',
  password: '',
  remember: true,
})

const rules: Record<string, Rule[]> = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

watch(mode, () => {
  formRef.value?.clearValidate()
  formState.account = ''
  formState.email = ''
})

const handleSubmit = async () => {
  loading.value = true
  try {
    const account = formState.account ?? ''
    const email = formState.email ?? ''
    const payload: SysUserLoginRequest =
      mode.value === 'account'
        ? { account: account.trim(), password: formState.password }
        : { email: email.trim(), password: formState.password }

    const res = await loginUser(payload)
    const code = res.data?.code
    if (code !== 0 && code !== 20000) {
      throw new Error(res.data?.message || '登录失败')
    }

    message.success('登录成功')
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect) {
      router.replace(redirect)
      return
    }
    router.replace('/home')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  router.push('/register')
}

const forgotPassword = () => {
  message.info('暂未开放找回密码功能')
}
</script>

<style scoped>
.auth-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  padding-right: 34px;
  border-right: 1px solid rgba(36, 64, 100, 0.08);
}

.panel-head h2 {
  margin: 0;
  font-size: 28px;
  color: #1c2740;
  letter-spacing: -0.03em;
}

.panel-head p {
  margin: 10px 0 0;
  color: #6c7a92;
  line-height: 1.6;
}

.mode-switch {
  width: 100%;
  background: #f3f7fc;
  border-radius: 16px;
  padding: 6px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 6px;
}

.submit-item {
  margin-top: 20px;
}

.panel-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  color: #6c7a92;
  margin-top: auto;
}

.text-link {
  padding-inline: 0;
  color: #1ea7c7;
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

@media (max-width: 860px) {
  .auth-panel {
    padding-right: 0;
    padding-bottom: 28px;
    border-right: 0;
    border-bottom: 1px solid rgba(36, 64, 100, 0.08);
  }
}
</style>
