<template>
  <div class="welcome">
    <div class="welcome-mark" aria-hidden="true"><img :src="logo" alt="" /></div>
    <span class="welcome-eyebrow">在这里，找到下一步</span>
    <h2>你好，今天想了解什么？</h2>
    <p class="welcome-description">
      从创建第一个应用，到把作品分享出去。<br />关于平台的使用问题，都可以从这里开始。
    </p>
    <div class="starter-grid" aria-label="常见问题">
      <button
        v-for="starter in starters"
        :key="starter.title"
        type="button"
        class="starter-card"
        @click="emit('select', starter.question)"
      >
        <span class="starter-icon" aria-hidden="true"><component :is="starter.icon" /></span>
        <span class="starter-copy"
          ><strong>{{ starter.title }}</strong
          ><span>{{ starter.description }}</span></span
        >
        <ArrowUpOutlined class="starter-arrow" aria-hidden="true" />
      </button>
    </div>
    <span class="starter-hint">选择一个话题，编辑后发送</span>
  </div>
</template>

<script setup lang="ts">
import {
  AppstoreAddOutlined,
  ArrowUpOutlined,
  CloudUploadOutlined,
  EditOutlined,
  SafetyOutlined,
} from '@ant-design/icons-vue'
import logo from '@/assets/logo.png'

const emit = defineEmits<{ select: [question: string] }>()
// 示例只填充草稿；用户确认内容后再发送，避免点击引导就触发真实请求。
const starters = [
  {
    title: '创建第一个应用',
    description: '从想法开始，描述你想做的产品',
    question: '第一次使用平台，如何创建一个应用？',
    icon: AppstoreAddOutlined,
  },
  {
    title: '部署与分享作品',
    description: '让做好的应用被更多人看见',
    question: '应用生成后，如何部署并分享给其他人？',
    icon: CloudUploadOutlined,
  },
  {
    title: '继续修改应用',
    description: '调整内容，逐步完善已有作品',
    question: '如何继续修改已经生成的应用？',
    icon: EditOutlined,
  },
  {
    title: '了解操作权限',
    description: '查看、编辑与下载有哪些区别',
    question: '查看、编辑、下载和部署应用分别需要什么权限？',
    icon: SafetyOutlined,
  },
]
</script>

<style scoped>
.welcome {
  width: min(650px, 100%);
  margin: auto;
  padding: 24px 0;
  text-align: center;
  animation: welcome-in 450ms ease-out both;
}
.welcome-mark {
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  margin: 0 auto 22px;
  background: #eaf0e9;
  border: 1px solid #dbe5da;
  border-radius: 22px 22px 22px 6px;
  transform: rotate(-5deg);
}
.welcome-mark img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  transform: rotate(5deg);
}
.welcome-eyebrow {
  color: #61776d;
  font-size: 12px;
  letter-spacing: 0.16em;
}
h2 {
  margin: 13px 0;
  color: #203f36;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', SimSun, serif;
  font-size: clamp(24px, 2.7vw, 34px);
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.02em;
}
.welcome-description {
  margin: 0;
  color: #728078;
  font-size: 13px;
  line-height: 1.9;
}
.starter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 30px 0 14px;
  text-align: left;
}
.starter-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px 15px;
  border: 1px solid #e0e6dd;
  border-radius: 12px;
  background: #fff;
  color: #254b40;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s,
    transform 0.18s;
}
.starter-card:hover {
  background: #f1f6ee;
  border-color: #91b6a0;
  transform: translateY(-2px);
}
.starter-card:focus-visible {
  outline: 2px solid #367d62;
  outline-offset: 3px;
}
.starter-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  background: #f0f4ed;
  border-radius: 9px;
  font-size: 18px;
}
.starter-copy {
  min-width: 0;
  display: grid;
  gap: 5px;
}
.starter-copy strong {
  font-size: 13px;
  font-weight: 600;
}
.starter-copy > span {
  color: #7a857b;
  font-size: 11px;
  line-height: 1.6;
}
.starter-arrow {
  flex: none;
  margin-left: auto;
  font-size: 12px;
  color: #96a298;
  transform: rotate(45deg);
}
.starter-hint {
  color: #7b857c;
  font-size: 11px;
}
@keyframes welcome-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 600px) {
  .welcome {
    padding: 0;
  }
  .welcome-mark {
    display: none;
  }
  .welcome-eyebrow {
    font-size: 10px;
  }
  h2 {
    margin: 8px 0;
    font-size: 22px;
  }
  .welcome-description {
    font-size: 12px;
  }
  .starter-grid {
    gap: 8px;
    margin: 16px 0 10px;
  }
  .starter-card {
    gap: 8px;
    padding: 12px 10px;
    align-items: flex-start;
  }
  .starter-icon {
    width: 26px;
    height: 26px;
    font-size: 15px;
    border-radius: 7px;
  }
  .starter-copy strong {
    font-size: 12px;
    line-height: 1.7;
  }
  .starter-copy > span {
    display: none;
  }
  .starter-arrow {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .welcome {
    animation: none;
  }
  .starter-card {
    transition: none;
  }
}
</style>
