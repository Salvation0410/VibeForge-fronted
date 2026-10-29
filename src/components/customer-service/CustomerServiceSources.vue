<template>
  <a-collapse ghost class="answer-sources">
    <a-collapse-panel key="sources">
      <template #header>
        <span class="sources-heading"
          ><ReadOutlined aria-hidden="true" />参考来源<span class="source-count">{{
            sources.length
          }}</span></span
        >
      </template>
      <article v-for="(source, index) in sources" :key="source.chunkId" class="source-card">
        <span class="source-number" aria-hidden="true">{{
          String(index + 1).padStart(2, '0')
        }}</span>
        <div class="source-content">
          <strong>{{ source.documentName || '帮助文档' }}</strong>
          <span v-if="source.locator" class="source-location">{{ source.locator }}</span>
          <p>{{ source.excerpt || '暂无摘要' }}</p>
        </div>
      </article>
    </a-collapse-panel>
  </a-collapse>
</template>

<script setup lang="ts">
import { ReadOutlined } from '@ant-design/icons-vue'
import type { CustomerServiceSource } from '@/api/customerService'

defineProps<{ sources: CustomerServiceSource[] }>()
</script>

<style scoped>
.answer-sources {
  margin-top: 16px;
  border-top: 1px solid #e4e9df;
}
.answer-sources :deep(.ant-collapse-header) {
  padding: 12px 0 0 !important;
  align-items: center !important;
  color: #526b5e !important;
}
.answer-sources :deep(.ant-collapse-expand-icon) {
  display: flex;
  align-items: center;
}
.sources-heading {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
}
.source-count {
  padding: 0 6px;
  border: 1px solid #d8e2d3;
  border-radius: 5px;
  font-size: 10px;
  line-height: 18px;
}
.answer-sources :deep(.ant-collapse-content-box) {
  padding: 12px 0 0 !important;
}
.source-card {
  display: flex;
  gap: 12px;
  padding: 13px;
  background: #f6f8f2;
  border: 1px solid #e6eadf;
  border-radius: 8px;
}
.source-card + .source-card {
  margin-top: 8px;
}
.source-number {
  flex: none;
  color: #6f8666;
  font:
    11px/1.8 'Cascadia Code',
    Consolas,
    monospace;
}
.source-content {
  min-width: 0;
  overflow-wrap: anywhere;
}
.source-content strong {
  display: block;
  color: #3c5545;
  font-size: 12px;
  font-weight: 600;
}
.source-location {
  display: block;
  margin-top: 3px;
  color: #6d7a6a;
  font-size: 11px;
}
.source-content p {
  margin: 6px 0 0;
  color: #6c766a;
  font-size: 12px;
  line-height: 1.8;
  white-space: pre-wrap;
}
.answer-sources :deep(.ant-collapse-header:focus-visible) {
  outline: 2px solid #367d62;
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
