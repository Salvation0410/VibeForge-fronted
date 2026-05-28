<template>
  <section class="auth-panel">
    <div class="panel-head">
      <h2>创建账号</h2>
      <p>支持账号或邮箱注册，注册成功后自动跳转到登录页。</p>
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
          placeholder="创建一个密码"
        />
      </a-form-item>

      <a-form-item name="confirmPassword" label="确认密码">
        <a-input-password
          v-model:value="formState.confirmPassword"
          size="large"
          placeholder="再次输入密码"
        />
      </a-form-item>

      <a-form-item name="nickname" label="昵称（可选）">
        <a-input v-model:value="formState.nickname" size="large" placeholder="你的昵称" />
      </a-form-item>

      <a-form-item name="userProfile" label="个人简介（可选）">
        <a-textarea
          v-model:value="formState.userProfile"
          :rows="4"
          placeholder="简单介绍一下自己"
        />
      </a-form-item>

      <a-form-item class="submit-item">
        <a-button type="primary" html-type="submit" size="large" block :loading="loading">
          注册
        </a-button>
      </a-form-item>
    </a-form>

    <div class="panel-footer">
      <span>已有账号？</span>
      <a-button type="link" class="text-link" @click="goLogin">去登录</a-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { registerUser, type SysUserRegisterRequest } from '@/api/sysUserApi'

type RegisterMode = 'account' | 'email'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const mode = ref<RegisterMode>('account')

const modeOptions = [
  { label: '账号注册', value: 'account' },
  { label: '邮箱注册', value: 'email' },
]

const formState = reactive<SysUserRegisterRequest & { confirmPassword: string }>({
  account: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  userProfile: '',
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
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: async (_, value) => {
        if (value !== formState.password) {
          return Promise.reject(new Error('两次输入的密码不一致'))
        }
        return Promise.resolve()
      },
      trigger: 'blur',
    },
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
    const payload: SysUserRegisterRequest = {
      password: formState.password,
      confirmPassword: formState.confirmPassword,
      nickname: formState.nickname?.trim() || undefined,
      userProfile: formState.userProfile?.trim() || undefined,
      ...(mode.value === 'account'
        ? { account: account.trim() }
        : { email: email.trim() }),
    }

    const res = await registerUser(payload)
    const code = res.code
    if (code !== 0 && code !== 20000) {
      throw new Error(res.message || '注册失败')
    }

    message.success('注册成功，正在前往登录页')
    router.replace('/login')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.auth-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  padding-left: 34px;
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
    padding-left: 0;
    padding-top: 28px;
  }
}
</style>
