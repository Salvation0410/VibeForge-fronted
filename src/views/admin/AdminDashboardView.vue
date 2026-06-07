<template>
  <section class="dashboard-page">
    <header class="page-head">
      <div>
        <span class="eyebrow">Dashboard</span>
        <h2>数据报表</h2>
        <p>社区、应用和对话的关键数据都放在这里。</p>
      </div>
      <a-button :loading="loading" @click="loadDashboard">刷新</a-button>
    </header>

    <a-spin :spinning="loading && !dashboard">
      <div class="metric-grid">
        <article v-for="metric in dashboard?.metrics || []" :key="metric.label" class="metric-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.hint }}</small>
        </article>
      </div>

      <div class="chart-grid">
        <section class="chart-panel wide">
          <div class="panel-head">
            <h3>近 7 日增长</h3>
          </div>
          <div ref="trendChartRef" class="chart"></div>
        </section>

        <section class="chart-panel">
          <div class="panel-head">
            <h3>帖子状态</h3>
          </div>
          <div ref="postChartRef" class="chart"></div>
        </section>

        <section class="chart-panel">
          <div class="panel-head">
            <h3>应用类型</h3>
          </div>
          <div ref="appChartRef" class="chart"></div>
        </section>
      </div>
    </a-spin>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
import {
  getAdminDashboardOverview,
  type AdminDashboardVO,
  type DashboardChartItem,
} from '@/api/adminDashboard'
import { isSuccessCode } from '@/utils/appUtils'

const loading = ref(false)
const dashboard = ref<AdminDashboardVO>()
const trendChartRef = ref<HTMLDivElement>()
const postChartRef = ref<HTMLDivElement>()
const appChartRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | null = null
let postChart: echarts.ECharts | null = null
let appChart: echarts.ECharts | null = null

async function loadDashboard() {
  loading.value = true
  try {
    const res = await getAdminDashboardOverview()
    if (!isSuccessCode(res.code)) {
      throw new Error(res.message || '报表加载失败')
    }
    dashboard.value = res.data
    await nextTick()
    renderCharts()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '报表加载失败')
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  renderTrendChart()
  renderPieChart(postChartRef.value, 'post', dashboard.value?.postStatusDistribution || [])
  renderPieChart(appChartRef.value, 'app', dashboard.value?.appTypeDistribution || [])
}

function renderTrendChart() {
  if (!trendChartRef.value || !dashboard.value?.trend) {
    return
  }
  trendChart = trendChart || echarts.init(trendChartRef.value)
  const trend = dashboard.value.trend
  trendChart.setOption({
    color: ['#127f9b', '#e07a3f', '#3d7dd8', '#6f9f45', '#6e63b6'],
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0 },
    grid: { left: 36, right: 18, top: 46, bottom: 28 },
    xAxis: { type: 'category', data: trend.dates, boundaryGap: false },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '用户', type: 'line', smooth: true, data: trend.users },
      { name: '应用', type: 'line', smooth: true, data: trend.apps },
      { name: '帖子', type: 'line', smooth: true, data: trend.posts },
      { name: '评论', type: 'line', smooth: true, data: trend.comments },
      { name: '对话', type: 'line', smooth: true, data: trend.chats },
    ],
  })
}

function renderPieChart(
  element: HTMLDivElement | undefined,
  type: 'post' | 'app',
  data: DashboardChartItem[],
) {
  if (!element) {
    return
  }
  const chart = type === 'post' ? postChart || echarts.init(element) : appChart || echarts.init(element)
  if (type === 'post') {
    postChart = chart
  } else {
    appChart = chart
  }
  chart.setOption({
    color: ['#127f9b', '#e6a23c', '#d85863', '#5f7f95', '#6e63b6'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, left: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        label: { formatter: '{b}: {c}' },
        data,
      },
    ],
  })
}

function resizeCharts() {
  trendChart?.resize()
  postChart?.resize()
  appChart?.resize()
}

onMounted(() => {
  void loadDashboard()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  trendChart?.dispose()
  postChart?.dispose()
  appChart?.dispose()
})
</script>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 20px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border: 1px solid rgba(28, 45, 72, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(21, 43, 72, 0.06);
}

.eyebrow {
  color: #1683a4;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.page-head h2 {
  margin: 4px 0 0;
  color: #152238;
  font-size: 30px;
}

.page-head p {
  margin: 8px 0 0;
  color: #6d7c93;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  display: grid;
  gap: 8px;
  min-height: 116px;
  padding: 18px;
  border: 1px solid rgba(28, 45, 72, 0.08);
  border-radius: 8px;
  background: #ffffff;
}

.metric-card span {
  color: #687890;
  font-weight: 700;
}

.metric-card strong {
  color: #152238;
  font-size: 30px;
  line-height: 1;
}

.metric-card small {
  color: #8896aa;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.chart-panel {
  min-width: 0;
  padding: 20px;
  border: 1px solid rgba(28, 45, 72, 0.08);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(21, 43, 72, 0.06);
}

.chart-panel.wide {
  grid-column: 1 / -1;
}

.panel-head h3 {
  margin: 0 0 12px;
  color: #20304a;
  font-size: 18px;
}

.chart {
  width: 100%;
  height: 330px;
}

@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-head {
    align-items: stretch;
    flex-direction: column;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
