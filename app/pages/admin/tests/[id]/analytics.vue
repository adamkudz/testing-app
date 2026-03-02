<template>
  <NuxtLayout name="admin">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <NuxtLink to="/admin" class="text-sm text-gray-500 hover:text-gray-700">← Back to Tests</NuxtLink>
          <h1 class="text-3xl font-bold text-gray-900 mt-1">Test Analytics</h1>
        </div>
        <div class="flex gap-2">
          <button
            @click="exportCSV"
            class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Export CSV
          </button>
          <button
            @click="exportPDF"
            class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Export PDF
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Filters</h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Date From</label>
            <input
              v-model="filters.dateFrom"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Date To</label>
            <input
              v-model="filters.dateTo"
              type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Min Score %</label>
            <input
              v-model.number="filters.scoreMin"
              type="number"
              min="0"
              max="100"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Max Score %</label>
            <input
              v-model.number="filters.scoreMax"
              type="number"
              min="0"
              max="100"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="100"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Pass/Fail</label>
            <select
              v-model="filters.passed"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              <option value="true">Passed</option>
              <option value="false">Failed</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button
            @click="applyFilters"
            class="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700"
          >
            Apply
          </button>
          <button
            @click="resetFilters"
            class="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12 text-gray-500">Loading analytics...</div>

      <template v-else-if="analytics">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Attempts</p>
            <p class="text-2xl font-bold text-gray-900">{{ analytics.summary.totalAttempts }}</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Avg Score</p>
            <p class="text-2xl font-bold text-gray-900">{{ analytics.summary.avgScore }}%</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Median</p>
            <p class="text-2xl font-bold text-gray-900">{{ analytics.summary.medianScore }}%</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Highest</p>
            <p class="text-2xl font-bold text-green-600">{{ analytics.summary.highestScore }}%</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Lowest</p>
            <p class="text-2xl font-bold text-red-600">{{ analytics.summary.lowestScore }}%</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Avg Time</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatDuration(analytics.summary.avgCompletionTimeMs) }}</p>
          </div>
        </div>

        <!-- Miss Rate Leaderboard -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Question Miss Rate (Most Missed First)</h2>
          <div v-if="!analytics.questionMissRates.length" class="text-gray-500 text-sm">No data available.</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 px-3 font-medium text-gray-500">#</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500">Question</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500">Type</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500">Answered</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500">Missed</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500">Miss Rate</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(q, idx) in analytics.questionMissRates" :key="q.questionId">
                  <tr class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" @click="toggleExpand(q.questionId)">
                    <td class="py-2 px-3 text-gray-400">{{ idx + 1 }}</td>
                    <td class="py-2 px-3 text-gray-900 max-w-xs truncate">{{ q.prompt }}</td>
                    <td class="py-2 px-3 text-gray-500 capitalize">{{ q.type.replace('_', ' ') }}</td>
                    <td class="py-2 px-3 text-right text-gray-600">{{ q.timesAnswered }}</td>
                    <td class="py-2 px-3 text-right text-gray-600">{{ q.timesMissed }}</td>
                    <td class="py-2 px-3 text-right">
                      <span
                        class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                        :class="missRateClass(q.missRate)"
                      >
                        {{ q.missRate }}%
                      </span>
                    </td>
                    <td class="py-2 px-3 text-right text-gray-400">
                      {{ expandedQuestion === q.questionId ? '▲' : '▼' }}
                    </td>
                  </tr>
                  <!-- Expanded: Common wrong answers -->
                  <tr v-if="expandedQuestion === q.questionId">
                    <td colspan="7" class="bg-gray-50 px-6 py-4">
                      <div class="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 class="text-sm font-medium text-gray-700 mb-2">Most Common Wrong Answers</h4>
                          <div v-if="q.commonWrongAnswers.length" class="space-y-1">
                            <div
                              v-for="wa in q.commonWrongAnswers"
                              :key="wa.answer"
                              class="flex justify-between text-sm"
                            >
                              <span class="text-gray-600 truncate mr-4">{{ wa.answer }}</span>
                              <span class="text-gray-400 font-mono">{{ wa.count }}x</span>
                            </div>
                          </div>
                          <p v-else class="text-gray-400 text-sm">No wrong answers</p>
                        </div>
                        <div>
                          <button
                            @click.stop="loadDrillDown(q.questionId)"
                            class="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-2"
                          >
                            View All Individual Responses →
                          </button>
                          <div v-if="drillDownData && drillDownQuestion === q.questionId">
                            <div class="max-h-48 overflow-y-auto">
                              <table class="w-full text-xs">
                                <thead>
                                  <tr class="border-b">
                                    <th class="text-left py-1 text-gray-500">Answer</th>
                                    <th class="text-left py-1 text-gray-500">Correct</th>
                                    <th class="text-left py-1 text-gray-500">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="r in drillDownData.responses" :key="r.attemptId" class="border-b border-gray-100">
                                    <td class="py-1 text-gray-700">{{ formatDrillAnswer(r.userAnswer) }}</td>
                                    <td class="py-1">
                                      <span :class="r.isCorrect ? 'text-green-600' : 'text-red-600'">
                                        {{ r.isCorrect ? '✓' : '✗' }}
                                      </span>
                                    </td>
                                    <td class="py-1 text-gray-400">{{ new Date(r.completedAt).toLocaleDateString() }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Attempts Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Attempts</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 px-3 font-medium text-gray-500">Attempt</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500">Score</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500">Percentage</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500">Completed</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(a, idx) in analytics.attempts.slice(0, 50)" :key="a.id" class="border-b border-gray-100">
                  <td class="py-2 px-3 text-gray-400">#{{ idx + 1 }}</td>
                  <td class="py-2 px-3 text-right text-gray-900">{{ a.score }}/{{ a.total }}</td>
                  <td class="py-2 px-3 text-right">
                    <span
                      class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                      :class="a.percentage >= 80 ? 'bg-green-100 text-green-700' : a.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'"
                    >
                      {{ a.percentage }}%
                    </span>
                  </td>
                  <td class="py-2 px-3 text-right text-gray-500">{{ new Date(a.completedAt).toLocaleString() }}</td>
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
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

definePageMeta({ layout: false })

const route = useRoute()
const testId = route.params.id as string

const filters = reactive({
  dateFrom: '',
  dateTo: '',
  scoreMin: null as number | null,
  scoreMax: null as number | null,
  passed: '',
})

const analytics = ref<any>(null)
const loading = ref(true)
const expandedQuestion = ref<string | null>(null)
const drillDownData = ref<any>(null)
const drillDownQuestion = ref<string | null>(null)

async function fetchAnalytics() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filters.dateFrom) params.date_from = new Date(filters.dateFrom).toISOString()
    if (filters.dateTo) params.date_to = new Date(filters.dateTo + 'T23:59:59').toISOString()
    if (filters.scoreMin !== null && filters.scoreMin !== undefined) params.score_min = String(filters.scoreMin)
    if (filters.scoreMax !== null && filters.scoreMax !== undefined) params.score_max = String(filters.scoreMax)
    if (filters.passed) params.passed = filters.passed

    const query = new URLSearchParams(params).toString()
    analytics.value = await $fetch(`/api/admin/analytics/tests/${testId}${query ? '?' + query : ''}`)
  } catch (e) {
    console.error('Failed to load analytics', e)
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  fetchAnalytics()
}

function resetFilters() {
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.scoreMin = null
  filters.scoreMax = null
  filters.passed = ''
  fetchAnalytics()
}

function toggleExpand(questionId: string) {
  expandedQuestion.value = expandedQuestion.value === questionId ? null : questionId
  drillDownData.value = null
  drillDownQuestion.value = null
}

async function loadDrillDown(questionId: string) {
  try {
    drillDownQuestion.value = questionId
    drillDownData.value = await $fetch(
      `/api/admin/analytics/tests/${testId}/questions/${questionId}`
    )
  } catch (e) {
    console.error('Failed to load drill-down', e)
  }
}

function missRateClass(rate: number) {
  if (rate >= 60) return 'bg-red-100 text-red-700'
  if (rate >= 30) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

function formatDuration(ms: number) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${sec}s`
}

function formatDrillAnswer(answer: any) {
  if (Array.isArray(answer)) return answer.join(', ')
  if (typeof answer === 'object' && answer !== null) {
    return Object.entries(answer).map(([k, v]) => `${k}→${v}`).join(', ')
  }
  return String(answer || 'No answer')
}

function exportCSV() {
  if (!analytics.value) return

  // Build CSV content
  let csv = 'Question,Type,Times Answered,Times Missed,Miss Rate %\n'
  for (const q of analytics.value.questionMissRates) {
    csv += `"${q.prompt.replace(/"/g, '""')}",${q.type},${q.timesAnswered},${q.timesMissed},${q.missRate}\n`
  }
  csv += '\nAttempt #,Score,Total,Percentage,Completed At\n'
  analytics.value.attempts.forEach((a: any, i: number) => {
    csv += `${i + 1},${a.score},${a.total},${a.percentage}%,${a.completedAt}\n`
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `test-analytics-${testId}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function exportPDF() {
  if (!analytics.value) return

  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text('Test Analytics Report', 14, 22)

  // Summary
  doc.setFontSize(11)
  doc.text(`Total Attempts: ${analytics.value.summary.totalAttempts}`, 14, 35)
  doc.text(`Average Score: ${analytics.value.summary.avgScore}%`, 14, 42)
  doc.text(`Median Score: ${analytics.value.summary.medianScore}%`, 14, 49)
  doc.text(`Highest: ${analytics.value.summary.highestScore}% | Lowest: ${analytics.value.summary.lowestScore}%`, 14, 56)
  doc.text(`Avg Completion Time: ${formatDuration(analytics.value.summary.avgCompletionTimeMs)}`, 14, 63)

  // Miss rate table
  doc.setFontSize(14)
  doc.text('Question Miss Rates', 14, 78)

  autoTable(doc, {
    startY: 82,
    head: [['#', 'Question', 'Type', 'Answered', 'Missed', 'Miss Rate']],
    body: analytics.value.questionMissRates.map((q: any, i: number) => [
      i + 1,
      q.prompt.length > 50 ? q.prompt.substring(0, 50) + '...' : q.prompt,
      q.type.replace('_', ' '),
      q.timesAnswered,
      q.timesMissed,
      `${q.missRate}%`,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  })

  doc.save(`test-analytics-${testId}.pdf`)
}

// Initial load
fetchAnalytics()
</script>
