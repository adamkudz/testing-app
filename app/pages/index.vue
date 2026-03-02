<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Take a Quiz</h1>
      <p class="text-lg text-gray-600">Choose a test below to get started.</p>
    </div>

    <div v-if="pending" class="text-center py-12 text-gray-500">Loading tests...</div>

    <div v-else-if="!tests?.length" class="text-center py-12">
      <p class="text-gray-500">No tests available yet. Check back later!</p>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2">
      <NuxtLink
        v-for="test in tests"
        :key="test.id"
        :to="`/tests/${test.id}`"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
      >
        <h2 class="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 mb-2">
          {{ test.title }}
        </h2>
        <p class="text-sm text-gray-500 mb-4">{{ test.description || 'No description' }}</p>
        <div class="flex items-center space-x-4 text-sm text-gray-400">
          <span class="flex items-center">
            <span class="mr-1">📝</span> {{ test.questionCount }} questions
          </span>
          <span v-if="test.timeLimitSeconds" class="flex items-center">
            <span class="mr-1">⏱️</span> {{ Math.round(test.timeLimitSeconds / 60) }} min
          </span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: tests, pending } = await useFetch('/api/tests')
</script>
