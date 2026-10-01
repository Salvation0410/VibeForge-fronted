<template>
  <main class="customer-service-page">
    <section class="hero-panel">
      <span class="eyebrow">Knowledge Assistant</span>
      <h1>智能客服</h1>
      <p>输入一个平台使用问题，客服会根据已有帮助资料给出回答和参考来源。</p>
    </section>

    <section class="question-panel">
      <label class="question-label" for="customer-service-question">你的问题</label>
      <a-textarea
        id="customer-service-question"
        v-model:value="question"
        :maxlength="CUSTOMER_SERVICE_QUESTION_LIMIT"
        :auto-size="{ minRows: 4, maxRows: 8 }"
        show-count
        placeholder="例如：如何修改应用名称？"
        :disabled="loading"
        :aria-invalid="showQuestionError ? 'true' : 'false'"
        aria-describedby="customer-service-question-help"
        @keydown.ctrl.enter.prevent="submitQuestion"
        @keydown.meta.enter.prevent="submitQuestion"
      />
      <div class="question-actions">
        <span
          id="customer-service-question-help"
          class="input-hint"
          :class="{ 'validation-error': showQuestionError }"
          aria-live="polite"
          :role="showQuestionError ? 'alert' : undefined"
        >
          {{
            showQuestionError
              ? questionErrorMessage
              : '最多 4000 个字符，按 Ctrl / Command + Enter 可提交'
          }}
        </span>
        <div class="button-group">
          <a-button v-if="loading" danger @click="cancelQuestion">取消提问</a-button>
          <a-button
            type="primary"
            :loading="loading"
            :disabled="!canSubmit"
            @click="submitQuestion"
          >
            {{ loading ? '正在查询' : '提交问题' }}
          </a-button>
        </div>
      </div>
    </section>

    <section class="result-panel" aria-live="polite">
      <div class="result-heading">
        <span class="eyebrow">Answer</span>
        <h2>客服回答</h2>
      </div>

      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
        <p>正在查找相关帮助资料，请稍候。</p>
      </div>

      <template v-else-if="uiState?.status === 'answered'">
        <p class="answer-text">{{ uiState.answer }}</p>
        <div v-if="uiState.sources.length" class="source-section">
          <h3>参考来源</h3>
          <a-collapse ghost>
            <a-collapse-panel
              v-for="source in uiState.sources"
              :key="source.chunkId"
              :header="source.documentName || '帮助文档'"
            >
              <dl class="source-meta">
                <div v-if="source.locator">
                  <dt>位置</dt>
                  <dd>{{ source.locator }}</dd>
                </div>
                <div>
                  <dt>内容摘要</dt>
                  <dd>{{ source.excerpt || '暂无摘要' }}</dd>
                </div>
              </dl>
            </a-collapse-panel>
          </a-collapse>
        </div>
      </template>

      <a-alert
        v-else-if="uiState?.status === 'no-answer'"
        type="info"
        show-icon
        message="暂时没有找到可靠答案"
        description="可以换一种更具体的问法后再试一次。"
      />
      <a-alert
        v-else-if="uiState?.status === 'service-unavailable'"
        type="error"
        show-icon
        message="智能客服暂时不可用"
        description="请稍后重试。"
      />
      <a-alert
        v-else-if="uiState?.status === 'cancelled'"
        type="warning"
        show-icon
        message="本次提问已取消"
        description="你可以修改问题后重新提交。"
      />
      <div v-else class="empty-state">
        <span>?</span>
        <p>提交问题后，回答会显示在这里。</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { askCustomerService } from '@/api/customerService'
import {
  CUSTOMER_SERVICE_QUESTION_LIMIT,
  createCustomerServiceRequestController,
  type CustomerServiceUiState,
  validateCustomerServiceQuestion,
} from '@/utils/customerService'

const question = ref('')
const loading = ref(false)
const uiState = ref<CustomerServiceUiState | null>(null)

const requestController = createCustomerServiceRequestController({
  request: askCustomerService,
  onStateChange: (state) => {
    loading.value = state.loading
    uiState.value = state.uiState
  },
})

const questionValidation = computed(() => validateCustomerServiceQuestion(question.value))
const questionErrorMessage = computed(() =>
  questionValidation.value.valid ? '' : questionValidation.value.message,
)
const showQuestionError = computed(
  () => Boolean(question.value) && Boolean(questionErrorMessage.value),
)
const canSubmit = computed(() => !loading.value && questionValidation.value.valid)

function submitQuestion() {
  return requestController.submit(question.value)
}

function cancelQuestion() {
  requestController.cancel()
}

onBeforeUnmount(() => {
  requestController.dispose()
})
</script>

<style scoped>
.customer-service-page {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 20px;
  width: min(1180px, 100%);
  margin: 0 auto;
}

.hero-panel,
.question-panel,
.result-panel {
  border: 1px solid rgba(28, 45, 72, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20px 52px rgba(21, 43, 72, 0.07);
}

.hero-panel {
  grid-column: 1 / -1;
  padding: 34px;
  background:
    radial-gradient(circle at 90% 8%, rgba(31, 183, 207, 0.17), transparent 30%),
    rgba(255, 255, 255, 0.94);
}

.eyebrow {
  color: #1683a4;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-panel h1 {
  margin: 6px 0 8px;
  color: #152238;
  font-size: 36px;
}

.hero-panel p,
.loading-state p,
.empty-state p {
  margin: 0;
  color: #687890;
  line-height: 1.7;
}

.question-panel,
.result-panel {
  min-width: 0;
  padding: 24px;
}

.question-label {
  display: block;
  margin-bottom: 10px;
  color: #20304a;
  font-size: 17px;
  font-weight: 800;
}

.question-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.input-hint {
  color: #8a98ab;
  font-size: 12px;
}

.validation-error {
  color: #cf1322;
}

.button-group {
  display: flex;
  gap: 10px;
}

.result-panel {
  min-height: 330px;
}

.result-heading h2 {
  margin: 4px 0 20px;
  color: #152238;
  font-size: 24px;
}

.loading-state,
.empty-state {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 14px;
  min-height: 210px;
  text-align: center;
}

.empty-state span {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 50%;
  background: #eaf9fc;
  color: #1683a4;
  font-size: 24px;
  font-weight: 900;
}

.answer-text {
  margin: 0;
  color: #26364f;
  font-size: 16px;
  line-height: 1.85;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.source-section {
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1px solid rgba(28, 45, 72, 0.08);
}

.source-section h3 {
  margin: 0 0 8px;
  color: #20304a;
  font-size: 16px;
}

.source-meta {
  display: grid;
  gap: 12px;
  margin: 0;
}

.source-meta div {
  display: grid;
  gap: 4px;
}

.source-meta dt {
  color: #748299;
  font-size: 12px;
  font-weight: 800;
}

.source-meta dd {
  margin: 0;
  color: #33445d;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

@media (max-width: 820px) {
  .customer-service-page {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    grid-column: auto;
    padding: 26px;
  }

  .question-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .button-group {
    justify-content: flex-end;
  }
}
</style>
