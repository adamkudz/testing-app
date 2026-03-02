<template>
  <NuxtLayout name="admin">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div v-if="loading" class="text-center py-12 text-gray-500">Loading dashboard...</div>

      <template v-else-if="dashboard">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Total Tests</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ dashboard.summary.totalTests }}</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Total Attempts</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ dashboard.summary.totalAttempts }}</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Overall Avg Score</p>
            <p class="text-3xl font-bold text-indigo-600 mt-1">{{ dashboard.summary.overallAvgScore }}%</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Most Popular</p>
            <p class="text-lg font-bold text-gray-900 mt-1 truncate">
              {{ dashboard.summary.mostPopularTest?.title || '—' }}
            </p>
            <p v-if="dashboard.summary.mostPopularTest" class="text-xs text-gray-400">
              {{ dashboard.summary.mostPopularTest.attemptCount }} attempts
            </p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Least Popular</p>
            <p class="text-lg font-bold text-gray-900 mt-1 truncate">
              {{ dashboard.summary.leastPopularTest?.title || '—' }}
            </p>
            <p v-if="dashboard.summary.leastPopularTest" class="text-xs text-gray-400">
              {{ dashboard.summary.leastPopularTest.attemptCount }} attempts
            </p>
          </div>
        </div>

        <!-- Trend Charts -->
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Attempts Over Time (Last 30 Days)</h2>
            <div class="h-64">
              <Line v-if="attemptsChartData" :data="attemptsChartData" :options="chartOptions" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Average Score Over Time (Last 30 Days)</h2>
            <div class="h-64">
              <Line v-if="scoreChartData" :data="scoreChartData" :options="scoreChartOptions" />
            </div>
          </div>
        </div>

        <!-- Test Rankings Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Test Rankings</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th
                    v-for="col in columns"
                    :key="col.key"
                    @click="sortBy(col.key)"
                    class="text-left py-2 px-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                    :class="col.align === 'right' ? 'text-right' : 'text-left'"
                  >
                    {{ col.label }}
                    <span v-if="sortKey === col.key">{{ sortAsc ? '↑' : '↓' }}</span>
                  </th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in sortedTestStats" :key="t.id" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-2 px-3 text-gray-900 font-medium">{{ t.title }}</td>
                  <td class="py-2 px-3 text-right text-gray-600">{{ t.questionCount }}</td>
                  <td class="py-2 px-3 text-right text-gray-600">{{ t.attemptCount }}</td>
                  <td class="py-2 px-3 text-right">
                    <span
                      class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                      :class="t.avgScore >= 80 ? 'bg-green-100 text-green-700' : t.avgScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'"
                    >
                      {{ t.avgScore }}%
                    </span>
                  </td>
                  <td class="py-2 px-3 text-right text-gray-500">{{ formatDuration(t.avgCompletionTimeMs) }}</td>
                  <td class="py-2 px-3 text-right">
                    <NuxtLink
                      :to="`/admin/tests/${t.id}/analytics`"
                      class="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                    >
                      View →
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

definePageMeta({ layout: false })

const dashboard = ref<any>(null)
const loading = ref(true)

const sortKey = ref('attemptCount')
const sortAsc = ref(false)

const columns = [
  { key: 'title', label: 'Test', align: 'left' },
  { key: 'questionCount', label: 'Questions', align: 'right' },
  { key: 'attemptCount', label: 'Attempts', align: 'right' },
  { key: 'avgScore', label: 'Avg Score', align: 'right' },
  { key: 'avgCompletionTimeMs', label: 'Avg Time', align: 'right' },
]

async function fetchDashboard() {
  loading.value = true
  try {
    dashboard.value = await $fetch('/api/admin/analytics/dashboard')
  } catch (e) {
    console.error('Failed to load dashboard', e)
  } finally {
    loading.value = false
  }
}

const sortedTestStats = computed(() => {
  if (!dashboard.value) return []
  return [...dashboard.value.testStats].sort((a: any, b: any) => {
    const aVal = a[sortKey.value]
    const bVal = b[sortKey.value]
    if (typeof aVal === 'string') {
      return sortAsc.value ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortAsc.value ? aVal - bVal : bVal - aVal
  })
})

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = false
  }
}

const attemptsChartData = computed(() => {
  if (!dashboard.value?.trends) return null
  return {
    labels: dashboard.value.trends.map((t: any) => t.date.slice(5)),
    datasets: [
      {
        label: 'Attempts',
        data: dashboard.value.trends.map((t: any) => t.attempts),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }
})

const scoreChartData = computed(() => {
  if (!dashboard.value?.trends) return null
  return {
    labels: dashboard.value.trends.map((t: any) => t.date.slice(5)),
    datasets: [
      {
        label: 'Avg Score %',
        data: dashboard.value.trends.map((t: any) => t.avgScore),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        spanGaps: true,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

const scoreChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, max: 100 },
  },
}

function formatDuration(ms: number) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${sec}s`
}

fetchDashboard()
</script>
