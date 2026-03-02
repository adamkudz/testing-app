<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading -->
    <div v-if="pending" class="text-center py-12 text-gray-500">Loading test...</div>

    <!-- Test not found -->
    <div v-else-if="!test" class="text-center py-12">
      <p class="text-gray-500">Test not found.</p>
      <NuxtLink to="/" class="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">← Back to Home</NuxtLink>
    </div>

    <!-- Results (after submission) -->
    <div v-else-if="results">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h1>
        <p class="text-lg text-gray-600 mb-6">{{ test.title }}</p>

        <div class="text-6xl font-bold mb-2" :class="scoreColor">
          {{ results.percentage }}%
        </div>
        <p class="text-gray-500 text-lg">
          {{ results.score }} / {{ results.total }} correct
        </p>
        <p v-if="test.passingScore" class="mt-2 text-sm font-medium" :class="results.percentage >= test.passingScore ? 'text-green-600' : 'text-red-600'">
          {{ results.percentage >= test.passingScore ? '✅ PASSED' : '❌ FAILED' }}
          ({{ test.passingScore }}% required)
        </p>
      </div>

      <!-- Per-question breakdown -->
      <div class="space-y-4 mb-8">
        <h2 class="text-xl font-semibold text-gray-900">Question Breakdown</h2>
        <div
          v-for="(r, idx) in results.results"
          :key="r.questionId"
          class="bg-white rounded-lg border p-4"
          :class="r.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'"
        >
          <div class="flex items-start gap-3">
            <span class="text-lg" :class="r.isCorrect ? 'text-green-600' : 'text-red-600'">
              {{ r.isCorrect ? '✓' : '✗' }}
            </span>
            <div class="flex-1">
              <p class="font-medium text-gray-900 text-sm">Q{{ idx + 1 }}: {{ r.prompt }}</p>
              <p class="text-sm mt-1">
                <span class="text-gray-500">Your answer: </span>
                <span :class="r.isCorrect ? 'text-green-700' : 'text-red-700'">
                  {{ formatAnswer(r.userAnswer) }}
                </span>
              </p>
              <p v-if="!r.isCorrect" class="text-sm mt-1">
                <span class="text-gray-500">Correct answer: </span>
                <span class="text-green-700 font-medium">{{ formatAnswer(r.correctAnswer) }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center space-x-4">
        <button
          @click="retakeTest"
          class="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          Retake Test
        </button>
        <NuxtLink
          to="/"
          class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Home
        </NuxtLink>
      </div>
    </div>

    <!-- Taking the test -->
    <div v-else>
      <!-- Header with progress and timer -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="flex justify-between items-center mb-2">
          <h1 class="text-xl font-bold text-gray-900">{{ test.title }}</h1>
          <div v-if="test.timeLimitSeconds" class="text-sm font-mono font-medium" :class="timerColor">
            ⏱️ {{ formatTime(timeRemaining) }}
          </div>
        </div>
        <!-- Progress bar -->
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${((currentIndex + 1) / test.questions.length) * 100}%` }"
          />
        </div>
        <div class="text-sm text-gray-500 mt-1">
          Question {{ currentIndex + 1 }} of {{ test.questions.length }}
        </div>
      </div>

      <!-- Current Question -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <p class="text-lg font-medium text-gray-900 mb-6">
          {{ currentQuestion.prompt }}
        </p>

        <!-- Single Select -->
        <div v-if="currentQuestion.type === 'single_select'" class="space-y-3">
          <label
            v-for="opt in currentQuestion.options"
            :key="opt.label"
            class="flex items-center p-3 border rounded-lg cursor-pointer transition-colors"
            :class="answers[currentQuestion.id] === opt.label ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'"
          >
            <input
              type="radio"
              :name="`q-${currentQuestion.id}`"
              :value="opt.label"
              v-model="answers[currentQuestion.id]"
              class="text-indigo-600 mr-3"
            />
            <span class="text-sm text-gray-800">{{ opt.label }}</span>
          </label>
        </div>

        <!-- Multi Select -->
        <div v-if="currentQuestion.type === 'multi_select'" class="space-y-3">
          <label
            v-for="opt in currentQuestion.options"
            :key="opt.label"
            class="flex items-center p-3 border rounded-lg cursor-pointer transition-colors"
            :class="(answers[currentQuestion.id] || []).includes(opt.label) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'"
          >
            <input
              type="checkbox"
              :value="opt.label"
              v-model="answers[currentQuestion.id]"
              class="text-indigo-600 rounded mr-3"
            />
            <span class="text-sm text-gray-800">{{ opt.label }}</span>
          </label>
        </div>

        <!-- True/False -->
        <div v-if="currentQuestion.type === 'true_false'" class="grid grid-cols-2 gap-4">
          <button
            v-for="opt in currentQuestion.options"
            :key="opt.label"
            type="button"
            @click="answers[currentQuestion.id] = opt.label"
            class="p-4 border-2 rounded-lg text-center font-medium transition-colors"
            :class="answers[currentQuestion.id] === opt.label ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Free Text -->
        <div v-if="currentQuestion.type === 'free_text'">
          <input
            v-model="answers[currentQuestion.id]"
            type="text"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Type your answer..."
          />
        </div>

        <!-- Matching -->
        <div v-if="currentQuestion.type === 'matching'" class="space-y-3">
          <div class="grid grid-cols-2 gap-2 text-sm font-medium text-gray-500 mb-2">
            <span>Item</span>
            <span>Match to</span>
          </div>
          <div
            v-for="opt in currentQuestion.options"
            :key="opt.label"
            class="grid grid-cols-2 gap-2 items-center"
          >
            <span class="text-sm font-medium text-gray-800 p-2 bg-gray-50 rounded">
              {{ opt.label }}
            </span>
            <select
              :value="(answers[currentQuestion.id] || {})[opt.label] || ''"
              @change="setMatchAnswer(currentQuestion.id, opt.label, ($event.target as HTMLSelectElement).value)"
              class="text-sm border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select...</option>
              <option
                v-for="target in shuffledTargets[currentQuestion.id]"
                :key="target"
                :value="target"
              >
                {{ target }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between">
        <button
          @click="prevQuestion"
          :disabled="currentIndex === 0"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <div class="flex gap-3">
          <button
            v-if="currentIndex < test.questions.length - 1"
            @click="nextQuestion"
            class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            Next →
          </button>
          <button
            @click="submitTest"
            :disabled="submitting"
            class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
          >
            {{ submitting ? 'Submitting...' : 'Submit Test' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const testId = route.params.id as string

const { data: test, pending } = await useFetch(`/api/tests/${testId}`)

const currentIndex = ref(0)
const answers = reactive<Record<string, any>>({})
const results = ref<any>(null)
const submitting = ref(false)
const startedAt = ref(new Date().toISOString())

// Timer
const timeRemaining = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const currentQuestion = computed(() => {
  return test.value?.questions?.[currentIndex.value] || { id: '', type: '', prompt: '', options: [] }
})

// Initialize multi-select answers and matching answers
watch(test, (t) => {
  if (!t) return
  for (const q of (t as any).questions) {
    if (q.type === 'multi_select' && !answers[q.id]) {
      answers[q.id] = []
    }
    if (q.type === 'matching' && !answers[q.id]) {
      answers[q.id] = {}
    }
  }
  // Start timer
  if ((t as any).timeLimitSeconds) {
    timeRemaining.value = (t as any).timeLimitSeconds
    timerInterval = setInterval(() => {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        clearInterval(timerInterval!)
        submitTest()
      }
    }, 1000)
  }
}, { immediate: true })

// Shuffled matching targets
const shuffledTargets = computed(() => {
  const map: Record<string, string[]> = {}
  if (!test.value) return map
  for (const q of (test.value as any).questions) {
    if (q.type === 'matching') {
      const targets = q.options.map((o: any) => o.matchTarget).filter(Boolean)
      // Simple shuffle
      map[q.id] = [...targets].sort(() => Math.random() - 0.5)
    }
  }
  return map
})

const timerColor = computed(() => {
  if (timeRemaining.value <= 60) return 'text-red-600'
  if (timeRemaining.value <= 300) return 'text-orange-500'
  return 'text-gray-600'
})

const scoreColor = computed(() => {
  if (!results.value) return ''
  if (results.value.percentage >= 80) return 'text-green-600'
  if (results.value.percentage >= 60) return 'text-yellow-600'
  return 'text-red-600'
})

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatAnswer(answer: any) {
  if (Array.isArray(answer)) return answer.join(', ')
  if (typeof answer === 'object' && answer !== null) {
    return Object.entries(answer).map(([k, v]) => `${k} → ${v}`).join(', ')
  }
  return answer || 'No answer'
}

function setMatchAnswer(questionId: string, label: string, value: string) {
  if (!answers[questionId]) answers[questionId] = {}
  answers[questionId] = { ...answers[questionId], [label]: value }
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

function nextQuestion() {
  if (test.value && currentIndex.value < (test.value as any).questions.length - 1) {
    currentIndex.value++
  }
}

async function submitTest() {
  if (submitting.value) return

  const unanswered = (test.value as any).questions.filter((q: any) => {
    const a = answers[q.id]
    if (a === undefined || a === null || a === '') return true
    if (Array.isArray(a) && a.length === 0) return true
    if (typeof a === 'object' && !Array.isArray(a) && Object.keys(a).length === 0) return true
    return false
  })

  if (unanswered.length > 0) {
    const proceed = confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)
    if (!proceed) return
  }

  submitting.value = true
  if (timerInterval) clearInterval(timerInterval)

  try {
    results.value = await $fetch(`/api/tests/${testId}/submit`, {
      method: 'POST',
      body: {
        answers,
        startedAt: startedAt.value,
      },
    })
  } catch (e: any) {
    alert('Failed to submit test: ' + (e.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

function retakeTest() {
  results.value = null
  currentIndex.value = 0
  Object.keys(answers).forEach((key) => delete answers[key])
  startedAt.value = new Date().toISOString()

  // Reinitialize multi-select and matching
  if (test.value) {
    for (const q of (test.value as any).questions) {
      if (q.type === 'multi_select') answers[q.id] = []
      if (q.type === 'matching') answers[q.id] = {}
    }
  }

  // Restart timer
  if (test.value && (test.value as any).timeLimitSeconds) {
    timeRemaining.value = (test.value as any).timeLimitSeconds
    timerInterval = setInterval(() => {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        clearInterval(timerInterval!)
        submitTest()
      }
    }, 1000)
  }
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
