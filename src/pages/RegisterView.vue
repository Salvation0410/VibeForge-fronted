<template>
  <section class="auth-panel">
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
        <a-input
          v-model:value="formState.account"
          size="large"
          placeholder="请输入账号"
          autocomplete="username"
        >
          <template #prefix>
            <UserOutlined />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item v-else name="email" label="邮箱">
        <a-input
          v-model:value="formState.email"
          size="large"
          placeholder="请输入邮箱"
          autocomplete="email"
        >
          <template #prefix>
            <MailOutlined />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item v-if="mode === 'email'" name="emailCode" label="邮箱验证码">
        <div class="verify-row">
          <a-input
            v-model:value="formState.emailCode"
            size="large"
            maxlength="6"
            placeholder="请输入邮箱验证码"
          >
            <template #prefix>
              <SafetyCertificateOutlined />
            </template>
          </a-input>
          <a-button
            type="default"
            size="large"
            class="send-code-button"
            :loading="sendCodeLoading"
            :disabled="sendCodeLoading || countdown > 0 || !canSendEmailCode"
            @click="handleSendEmailCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
          </a-button>
        </div>
      </a-form-item>

      <a-form-item name="password" label="密码">
        <a-input-password
          v-model:value="formState.password"
          size="large"
          placeholder="请输入密码"
          autocomplete="new-password"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item name="confirmPassword" label="确认密码">
        <a-input-password
          v-model:value="formState.confirmPassword"
          size="large"
          placeholder="请再次输入密码"
          autocomplete="new-password"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item name="nickname" label="昵称">
        <a-input v-model:value="formState.nickname" size="large" placeholder="请输入昵称">
          <template #prefix>
            <IdcardOutlined />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item class="submit-item">
        <a-button type="primary" html-type="submit" size="large" block :loading="loading">
          立即注册
        </a-button>
      </a-form-item>
    </a-form>

    <div class="panel-footer">
      <span>已有账号?</span>
      <a-button type="link" class="text-link strong" @click="goLogin">去登录</a-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import {
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import {
  registerUser,
  sendRegisterEmailCode,
  type SysUserRegisterRequest,
} from '@/api/sysUserApi'

type RegisterMode = 'account' | 'email'

const SUCCESS_CODES = new Set([0, 20000])

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const sendCodeLoading = ref(false)
const mode = ref<RegisterMode>('account')
const countdown = ref(0)
let countdownTimer: number | null = null

const modeOptions = [
  { label: '账号注册', value: 'account' },
  { label: '邮箱注册', value: 'email' },
]

const formState = reactive<SysUserRegisterRequest>({
  account: '',
  email: '',
  emailCode: '',
  password: '',
  confirmPassword: '',
  nickname: '',
})

const canSendEmailCode = computed(() => {
  const email = formState.email?.trim() ?? ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
})

const rules: Record<string, Rule[]> = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { len: 6, message: '邮箱验证码应为 6 位', trigger: 'blur' },
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
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

watch(mode, () => {
  formRef.value?.clearValidate()
  formState.account = ''
  formState.email = ''
  formState.emailCode = ''
  resetCountdown()
})

onBeforeUnmount(() => {
  resetCountdown()
})

const startCountdown = (seconds: number) => {
  resetCountdown()
  countdown.value = seconds
  countdownTimer = window.setInterval(() => {
    if (countdown.value <= 1) {
      resetCountdown()
      return
    }
    countdown.value -= 1
  }, 1000)
}

const resetCountdown = () => {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

const handleSendEmailCode = async () => {
  if (!canSendEmailCode.value) {
    message.warning('请先输入正确的邮箱地址')
    return
  }

  sendCodeLoading.value = true
  try {
    const res = await sendRegisterEmailCode({
      email: formState.email?.trim() ?? '',
    })
    if (!SUCCESS_CODES.has(Number(res.code))) {
      throw new Error(res.message || '发送验证码失败')
    }
    startCountdown(60)
    message.success('验证码已发送，请查收邮箱')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '发送验证码失败，请稍后重试')
  } finally {
    sendCodeLoading.value = false
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const payload: SysUserRegisterRequest = {
      password: formState.password,
      confirmPassword: formState.confirmPassword,
      nickname: formState.nickname?.trim(),
    }

    if (mode.value === 'account') {
      payload.account = formState.account?.trim()
    } else {
      payload.email = formState.email?.trim()
      payload.emailCode = formState.emailCode?.trim()
    }

    const res = await registerUser(payload)
    if (!SUCCESS_CODES.has(Number(res.code))) {
      throw new Error(res.message || '注册失败')
    }

    message.success('注册成功，请登录')
    resetCountdown()
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
}

.mode-switch {
  width: 100%;
  margin-bottom: 14px;
  padding: 4px;
  border-radius: 6px;
  background: #f2f5f9;
}

.verify-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  align-items: start;
  gap: 12px;
}

.send-code-button {
  height: 46px;
  border-radius: 6px;
  color: #176fff;
  font-weight: 750;
}

.submit-item {
  margin: 0;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #edf1f7;
  color: #69778c;
  font-size: 14px;
}

.text-link {
  padding-inline: 0;
  color: #1671ff;
  font-weight: 750;
}

.strong {
  font-size: 14px;
}

:deep(.ant-form-item) {
  margin-bottom: 8px;
}

:deep(.ant-form-item-label) {
  padding-bottom: 3px;
}

:deep(.ant-form-item-label > label) {
  color: #273449;
  font-size: 14px;
  font-weight: 750;
}

:deep(.ant-input),
:deep(.ant-input-affix-wrapper) {
  height: 46px;
  min-height: 46px;
  border-color: #dfe5ee;
  border-radius: 6px;
  color: #1d293f;
  font-size: 15px;
}

:deep(.ant-input-affix-wrapper .ant-input) {
  height: auto;
  min-height: 0;
  line-height: 22px;
}

:deep(.ant-input::placeholder) {
  color: #aab3c2;
}

:deep(.ant-input-prefix) {
  margin-inline-end: 10px;
  color: #9aa6b8;
  font-size: 16px;
}

:deep(.ant-input-affix-wrapper-focused),
:deep(.ant-input:focus) {
  border-color: #8bb8ff;
  box-shadow: 0 0 0 3px rgba(22, 113, 255, 0.1);
}

:deep(.ant-btn-primary) {
  height: 46px;
  border-radius: 6px;
  background: linear-gradient(180deg, #237cff, #095ee8);
  font-size: 16px;
  font-weight: 850;
  box-shadow: 0 14px 24px rgba(22, 101, 238, 0.22);
}

:deep(.ant-segmented) {
  width: 100%;
}

:deep(.ant-segmented-group) {
  width: 100%;
}

:deep(.ant-segmented-item) {
  flex: 1;
  height: 40px;
  min-height: 40px;
  color: #596578;
  font-weight: 750;
}

:deep(.ant-segmented-item-label) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  min-height: 40px;
  padding: 0;
  line-height: 40px;
}

:deep(.ant-segmented-item-selected) {
  background: #ffffff;
  color: #1671ff;
  box-shadow: 0 6px 16px rgba(47, 86, 132, 0.08);
}

@media (max-width: 440px) {
  .verify-row {
    grid-template-columns: 1fr;
  }

  .send-code-button {
    width: 100%;
  }
}
</style>
