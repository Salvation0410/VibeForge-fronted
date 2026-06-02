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

      <a-form-item name="password" label="密码">
        <a-input-password
          v-model:value="formState.password"
          size="large"
          placeholder="请输入密码"
          autocomplete="current-password"
        >
          <template #prefix>
            <LockOutlined />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item name="captchaCode" label="图片验证码">
        <div class="captcha-row">
          <a-input
            v-model:value="formState.captchaCode"
            size="large"
            maxlength="6"
            placeholder="请输入图片验证码"
          >
            <template #prefix>
              <SafetyCertificateOutlined />
            </template>
          </a-input>

          <div class="captcha-side">
            <button
              type="button"
              class="captcha-image-button"
              :disabled="captchaLoading"
              @click="refreshCaptcha"
            >
              <img v-if="captchaImage" :src="captchaImage" alt="登录验证码" class="captcha-image" />
              <span v-else>{{ captchaLoading ? '加载中' : '获取验证码' }}</span>
            </button>

            <button
              type="button"
              class="refresh-button"
              :disabled="captchaLoading"
              @click="refreshCaptcha"
            >
              <ReloadOutlined />
              看不清，换一张
            </button>
          </div>
        </div>
      </a-form-item>

      <div class="form-row">
        <a-checkbox v-model:checked="formState.remember">记住我</a-checkbox>
        <a-button type="link" class="text-link" @click="forgotPassword">忘记密码?</a-button>
      </div>

      <a-form-item class="submit-item">
        <a-button
          type="primary"
          html-type="submit"
          size="large"
          block
          :loading="loading"
          :disabled="captchaLoading"
        >
          立即登录
        </a-button>
      </a-form-item>
    </a-form>

    <div class="panel-footer">
      <span>还没有账号?</span>
      <a-button type="link" class="text-link strong" @click="goRegister">立即注册</a-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import {
  LockOutlined,
  MailOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import {
  getLoginCaptcha,
  loginUser,
  type LoginCaptchaVO,
  type SysUserLoginRequest,
} from '@/api/sysUserApi'
import { useLoginUserStore } from '@/stores/loginUser'

type LoginMode = 'account' | 'email'

const SUCCESS_CODES = new Set([0, 20000])

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaLoading = ref(false)
const mode = ref<LoginMode>('account')
const captchaImage = ref('')

const modeOptions = [
  { label: '账号登录', value: 'account' },
  { label: '邮箱登录', value: 'email' },
]

const formState = reactive<SysUserLoginRequest & { remember: boolean }>({
  account: '',
  email: '',
  password: '',
  captchaCode: '',
  remember: false,
})

const rules: Record<string, Rule[]> = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  captchaCode: [{ required: true, message: '请输入图片验证码', trigger: 'blur' }],
}

watch(mode, () => {
  formRef.value?.clearValidate()
  formState.account = ''
  formState.email = ''
})

onMounted(() => {
  void refreshCaptcha()
})

const refreshCaptcha = async () => {
  captchaLoading.value = true
  try {
    const res = await getLoginCaptcha()
    const captchaData: LoginCaptchaVO | undefined = res.data
    captchaImage.value = captchaData?.captchaImage ?? ''
    formState.captchaCode = ''
  } catch (error) {
    message.error(error instanceof Error ? error.message : '获取验证码失败，请稍后重试')
  } finally {
    captchaLoading.value = false
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const payload: SysUserLoginRequest =
      mode.value === 'account'
        ? {
            account: formState.account?.trim(),
            password: formState.password,
            captchaCode: formState.captchaCode.trim(),
          }
        : {
            email: formState.email?.trim(),
            password: formState.password,
            captchaCode: formState.captchaCode.trim(),
          }

    const res = await loginUser(payload)
    if (!SUCCESS_CODES.has(Number(res.code))) {
      throw new Error(res.message || '登录失败')
    }

    loginUserStore.setLoginUser(res.data?.user ?? null)
    message.success('登录成功')

    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' && redirect ? redirect : '/home')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
    await refreshCaptcha()
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  router.push('/register')
}

const forgotPassword = () => {
  message.info('找回密码功能暂未开放')
}
</script>

<style scoped>
.auth-panel {
  display: flex;
  flex-direction: column;
}

.mode-switch {
  width: 100%;
  margin-bottom: 16px;
  padding: 4px;
  border-radius: 6px;
  background: #f2f5f9;
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  align-items: start;
  gap: 14px;
}

.captcha-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.captcha-image-button {
  display: grid;
  place-items: center;
  width: 160px;
  height: 48px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #dfe5ee;
  border-radius: 6px;
  background: #f7faff;
  color: #1671ff;
  font-weight: 750;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.captcha-image-button:hover:not(:disabled) {
  border-color: #9dc1ff;
  box-shadow: 0 0 0 3px rgba(22, 113, 255, 0.08);
}

.captcha-image-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 160px;
  margin-top: 8px;
  border: 0;
  background: transparent;
  color: #1671ff;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 14px;
}

.submit-item {
  margin: 0;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 14px;
  padding-top: 12px;
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
  margin-bottom: 12px;
}

:deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

:deep(.ant-form-item-label > label) {
  color: #273449;
  font-size: 14px;
  font-weight: 750;
}

:deep(.ant-input),
:deep(.ant-input-affix-wrapper) {
  height: 48px;
  min-height: 48px;
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

:deep(.ant-checkbox-wrapper) {
  color: #273449;
  font-size: 14px;
}

:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  border-color: #1671ff;
  background: #1671ff;
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
  .captcha-row {
    grid-template-columns: 1fr;
  }

  .captcha-side {
    align-items: flex-start;
  }

  .captcha-image-button {
    width: 160px;
  }
}
</style>
