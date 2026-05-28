<template>
  <section class="edit-page">
    <a-card class="edit-card" :bordered="false">
      <div class="page-head">
        <div>
          <p class="eyebrow">应用信息修改页</p>
          <h1>编辑应用信息</h1>
          <p class="head-desc">普通用户只能编辑自己的应用名称；管理员可额外修改封面和优先级。</p>
        </div>
        <a-space>
          <a-button @click="router.push(`/apps/${appId}/chat`)">返回对话页</a-button>
          <a-button @click="router.push('/home')">返回首页</a-button>
        </a-space>
      </div>

      <a-spin :spinning="loading">
        <a-form
          ref="formRef"
          :model="formState"
          :rules="rules"
          layout="vertical"
          class="edit-form"
          @finish="handleSubmit"
        >
          <a-form-item name="appName" label="应用名称">
            <a-input v-model:value="formState.appName" size="large" placeholder="请输入应用名称" />
          </a-form-item>

          <a-form-item label="初始提示词">
            <a-textarea :value="appDetail?.initPrompt" :rows="5" disabled />
          </a-form-item>

          <template v-if="isAdmin">
            <a-form-item label="应用封面">
              <a-input
                v-model:value="formState.cover"
                size="large"
                placeholder="请输入封面图片 URL，管理员可维护精选展示图"
              />
            </a-form-item>

            <a-form-item label="优先级">
              <a-input-number v-model:value="formState.priority" :min="0" :max="999" class="full-width" />
            </a-form-item>
          </template>

          <a-descriptions bordered :column="2" class="detail-grid">
            <a-descriptions-item label="应用 id">{{ appDetail?.id || '-' }}</a-descriptions-item>
            <a-descriptions-item label="代码类型">{{ appDetail?.codeGenType || '-' }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ formatDateTime(appDetail?.createTime) }}</a-descriptions-item>
            <a-descriptions-item label="更新时间">{{ formatDateTime(appDetail?.updateTime) }}</a-descriptions-item>
          </a-descriptions>

          <div class="submit-row">
            <a-button size="large" @click="resetForm">重置</a-button>
            <a-button type="primary" html-type="submit" size="large" :loading="saving">保存修改</a-button>
          </div>
        </a-form>
      </a-spin>
    </a-card>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import {
  type AppId,
  getAppDetail,
  getAppDetailByAdmin,
  updateAppByAdmin,
  updateMyApp,
  type AppVO,
} from '@/api/app'
import { useLoginUserStore } from '@/stores/loginUser'
import { canEditApp } from '@/utils/appAccess'
import { formatDateTime, isAdminRole, isSuccessCode } from '@/utils/appUtils'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const appId = String(route.params.id || '') as AppId

const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const appDetail = ref<AppVO | null>(null)

const formState = reactive<{
  appName: string
  cover: string
  priority: number
}>({
  appName: '',
  cover: '',
  priority: 0,
})

const isAdmin = computed(() => isAdminRole(loginUserStore.loginUser?.userRole))

const rules: Record<string, Rule[]> = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
}

const syncForm = () => {
  formState.appName = appDetail.value?.appName || ''
  formState.cover = appDetail.value?.cover || ''
  formState.priority = Number(appDetail.value?.priority || 0)
}

const loadAppDetail = async () => {
  loading.value = true
  try {
    const res = isAdmin.value ? await getAppDetailByAdmin(appId) : await getAppDetail(appId)
    if (!isSuccessCode(res.code) || !res.data) {
      throw new Error(res.message || '获取应用详情失败')
    }
    if (!canEditApp(loginUserStore.loginUser, res.data)) {
      message.warning('你只能编辑自己的应用')
      await router.replace('/home')
      return
    }
    appDetail.value = res.data
    syncForm()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '获取应用详情失败')
    await router.replace('/home')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formRef.value?.clearValidate()
  syncForm()
}

const handleSubmit = async () => {
  saving.value = true
  try {
    if (isAdmin.value) {
      const res = await updateAppByAdmin({
        id: appId,
        appName: formState.appName.trim(),
        cover: formState.cover.trim() || undefined,
        priority: formState.priority,
      })
      if (!isSuccessCode(res.code)) {
        throw new Error(res.message || '保存失败')
      }
    } else {
      const res = await updateMyApp({
        id: appId,
        appName: formState.appName.trim(),
      })
      if (!isSuccessCode(res.code)) {
        throw new Error(res.message || '保存失败')
      }
    }

    message.success('应用信息已更新')
    await loadAppDetail()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

void loadAppDetail()
</script>

<style scoped>
.edit-page {
  display: grid;
}

.edit-card {
  border-radius: 30px;
  box-shadow: 0 22px 60px rgba(24, 45, 79, 0.08);
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 30px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #1a9dc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-head h1 {
  margin: 0;
  color: #132033;
  font-size: 34px;
}

.head-desc {
  margin: 12px 0 0;
  color: #6b7a92;
  line-height: 1.7;
}

.edit-form {
  max-width: 860px;
}

.detail-grid {
  margin-top: 10px;
}

.submit-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}

.full-width {
  width: 100%;
}

@media (max-width: 760px) {
  .page-head {
    flex-direction: column;
  }

  .submit-row {
    justify-content: stretch;
  }
}
</style>
