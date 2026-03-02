<template>
  <NuxtLayout name="admin">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Tests</h1>
        <NuxtLink
          to="/admin/tests/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          + Create Test
        </NuxtLink>
      </div>

      <div v-if="pending" class="text-center py-12 text-gray-500">Loading tests...</div>

      <div v-else-if="!tests?.length" class="text-center py-12">
        <p class="text-gray-500 mb-4">No tests yet. Create your first test!</p>
      </div>

      <div v-else class="grid gap-4">
        <div
          v-for="test in tests"
          :key="test.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h2 class="text-lg font-semibold text-gray-900">{{ test.title }}</h2>
              <p class="text-sm text-gray-500 mt-1">{{ test.description || 'No description' }}</p>
              <div class="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <span>{{ test.questionCount }} questions</span>
                <span v-if="test.timeLimitSeconds">
                  {{ Math.round(test.timeLimitSeconds / 60) }} min time limit
                </span>
                <span>Created {{ new Date(test.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2 ml-4">
              <NuxtLink
                :to="`/admin/tests/${test.id}/analytics`"
                class="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Analytics
              </NuxtLink>
              <NuxtLink
                :to="`/admin/tests/${test.id}`"
                class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Edit
              </NuxtLink>
              <button
                @click="deleteTest(test.id)"
                class="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { data: tests, pending, refresh } = await useFetch('/api/admin/tests')

async function deleteTest(id: string) {
  if (!confirm('Are you sure you want to delete this test?')) return
  try {
    await $fetch(`/api/admin/tests/${id}`, { method: 'DELETE' })
    refresh()
  } catch (e: any) {
    alert('Failed to delete test')
  }
}
</script>
