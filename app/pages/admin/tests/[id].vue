<template>
  <NuxtLayout name="admin">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          {{ isNew ? 'Create Test' : 'Edit Test' }}
        </h1>
        <NuxtLink to="/admin" class="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Tests
        </NuxtLink>
      </div>

      <form @submit.prevent="saveTest">
        <!-- Test Metadata -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Test Details</h2>
          <div class="grid gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Test title"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Optional description"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (minutes, optional)
                </label>
                <input
                  v-model.number="timeLimitMinutes"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="No time limit"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score (%, optional)
                </label>
                <input
                  v-model.number="form.passingScore"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="No passing score"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Questions -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900">
              Questions ({{ form.questions.length }})
            </h2>
            <button
              type="button"
              @click="addQuestion"
              class="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              + Add Question
            </button>
          </div>

          <div v-if="!form.questions.length" class="text-center py-8 text-gray-500">
            No questions yet. Click "Add Question" to get started.
          </div>

          <draggable
            v-model="form.questions"
            item-key="key"
            handle=".drag-handle"
            class="space-y-4"
          >
            <template #item="{ element: question, index }">
              <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div class="flex items-start gap-3">
                  <div class="drag-handle cursor-grab text-gray-400 hover:text-gray-600 mt-2 select-none">
                    ⠿
                  </div>
                  <div class="flex-1">
                    <!-- Question header -->
                    <div class="flex justify-between items-center mb-3">
                      <span class="text-sm font-medium text-gray-500">Question {{ index + 1 }}</span>
                      <div class="flex items-center gap-2">
                        <select
                          v-model="question.type"
                          @change="onTypeChange(question)"
                          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="single_select">Single Select</option>
                          <option value="multi_select">Multi Select</option>
                          <option value="true_false">True / False</option>
                          <option value="free_text">Free Text</option>
                          <option value="matching">Matching</option>
                        </select>
                        <button
                          type="button"
                          @click="removeQuestion(index)"
                          class="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <!-- Prompt -->
                    <div class="mb-3">
                      <input
                        v-model="question.prompt"
                        type="text"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Question text"
                      />
                    </div>

                    <!-- Single Select Options -->
                    <div v-if="question.type === 'single_select'" class="space-y-2">
                      <div
                        v-for="(opt, oIdx) in question.options"
                        :key="oIdx"
                        class="flex items-center gap-2"
                      >
                        <input
                          type="radio"
                          :name="`q-${question.key}-correct`"
                          :checked="opt.is_correct"
                          @change="setSingleCorrect(question, oIdx)"
                          class="text-indigo-600"
                        />
                        <input
                          v-model="opt.label"
                          type="text"
                          required
                          class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Option text"
                        />
                        <button
                          type="button"
                          @click="question.options.splice(oIdx, 1)"
                          class="text-red-400 hover:text-red-600 text-sm"
                        >
                          ×
                        </button>
                      </div>
                      <button
                        type="button"
                        @click="question.options.push({ label: '', is_correct: false })"
                        class="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        + Add Option
                      </button>
                    </div>

                    <!-- Multi Select Options -->
                    <div v-if="question.type === 'multi_select'" class="space-y-2">
                      <div
                        v-for="(opt, oIdx) in question.options"
                        :key="oIdx"
                        class="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          v-model="opt.is_correct"
                          class="text-indigo-600 rounded"
                        />
                        <input
                          v-model="opt.label"
                          type="text"
                          required
                          class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Option text"
                        />
                        <button
                          type="button"
                          @click="question.options.splice(oIdx, 1)"
                          class="text-red-400 hover:text-red-600 text-sm"
                        >
                          ×
                        </button>
                      </div>
                      <button
                        type="button"
                        @click="question.options.push({ label: '', is_correct: false })"
                        class="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        + Add Option
                      </button>
                    </div>

                    <!-- True/False -->
                    <div v-if="question.type === 'true_false'" class="space-y-2">
                      <div
                        v-for="(opt, oIdx) in question.options"
                        :key="oIdx"
                        class="flex items-center gap-2"
                      >
                        <input
                          type="radio"
                          :name="`q-${question.key}-tf`"
                          :checked="opt.is_correct"
                          @change="setSingleCorrect(question, oIdx)"
                          class="text-indigo-600"
                        />
                        <span class="text-sm font-medium">{{ opt.label }}</span>
                      </div>
                    </div>

                    <!-- Free Text -->
                    <div v-if="question.type === 'free_text'" class="space-y-2">
                      <label class="block text-sm text-gray-600">Expected correct answer:</label>
                      <input
                        v-model="question.correctAnswer"
                        type="text"
                        required
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Correct answer (case-insensitive)"
                      />
                    </div>

                    <!-- Matching -->
                    <div v-if="question.type === 'matching'" class="space-y-2">
                      <div class="grid grid-cols-2 gap-2 text-sm text-gray-500 font-medium mb-1">
                        <span>Left (Item)</span>
                        <span>Right (Match)</span>
                      </div>
                      <div
                        v-for="(opt, oIdx) in question.options"
                        :key="oIdx"
                        class="grid grid-cols-2 gap-2"
                      >
                        <input
                          v-model="opt.label"
                          type="text"
                          required
                          class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Left item"
                        />
                        <div class="flex items-center gap-1">
                          <input
                            v-model="opt.match_target"
                            type="text"
                            required
                            class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Right match"
                          />
                          <button
                            type="button"
                            @click="question.options.splice(oIdx, 1)"
                            class="text-red-400 hover:text-red-600 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        @click="question.options.push({ label: '', match_target: '' })"
                        class="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        + Add Pair
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Save -->
        <div class="flex justify-end space-x-3">
          <NuxtLink
            to="/admin"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="saving"
            class="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : (isNew ? 'Create Test' : 'Save Changes') }}
          </button>
        </div>
      </form>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const isNew = route.params.id === 'new'
const saving = ref(false)
let keyCounter = 0

interface QuestionOption {
  label: string
  is_correct?: boolean
  match_target?: string
}

interface Question {
  key: number
  type: string
  prompt: string
  options: QuestionOption[]
  correctAnswer: string
}

const form = reactive({
  title: '',
  description: '',
  passingScore: null as number | null,
  questions: [] as Question[],
})

const timeLimitMinutes = ref<number | null>(null)

// Load existing test if editing
if (!isNew) {
  const { data } = await useFetch(`/api/admin/tests/${route.params.id}`)
  if (data.value) {
    const test = data.value as any
    form.title = test.title
    form.description = test.description
    form.passingScore = test.passingScore
    timeLimitMinutes.value = test.timeLimitSeconds
      ? Math.round(test.timeLimitSeconds / 60)
      : null
    form.questions = test.questions.map((q: any) => ({
      key: ++keyCounter,
      type: q.type,
      prompt: q.prompt,
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
    }))
  }
}

function addQuestion() {
  form.questions.push({
    key: ++keyCounter,
    type: 'single_select',
    prompt: '',
    options: [
      { label: '', is_correct: true },
      { label: '', is_correct: false },
    ],
    correctAnswer: '',
  })
}

function removeQuestion(index: number) {
  form.questions.splice(index, 1)
}

function onTypeChange(question: Question) {
  switch (question.type) {
    case 'single_select':
    case 'multi_select':
      question.options = [
        { label: '', is_correct: false },
        { label: '', is_correct: false },
      ]
      question.correctAnswer = ''
      break
    case 'true_false':
      question.options = [
        { label: 'True', is_correct: true },
        { label: 'False', is_correct: false },
      ]
      question.correctAnswer = ''
      break
    case 'free_text':
      question.options = []
      question.correctAnswer = ''
      break
    case 'matching':
      question.options = [
        { label: '', match_target: '' },
        { label: '', match_target: '' },
      ]
      question.correctAnswer = ''
      break
  }
}

function setSingleCorrect(question: Question, correctIndex: number) {
  question.options.forEach((opt, i) => {
    opt.is_correct = i === correctIndex
  })
}

async function saveTest() {
  saving.value = true
  try {
    const payload = {
      title: form.title,
      description: form.description,
      timeLimitSeconds: timeLimitMinutes.value ? timeLimitMinutes.value * 60 : null,
      passingScore: form.passingScore || null,
      questions: form.questions.map((q) => ({
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })),
    }

    if (isNew) {
      const result = await $fetch('/api/admin/tests', {
        method: 'POST',
        body: payload,
      })
      router.push('/admin')
    } else {
      await $fetch(`/api/admin/tests/${route.params.id}`, {
        method: 'PUT',
        body: payload,
      })
      router.push('/admin')
    }
  } catch (e: any) {
    alert('Failed to save test: ' + (e.data?.message || e.message))
  } finally {
    saving.value = false
  }
}
</script>
