<template>
  <div>
    <header class="bg-indigo-700 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <NuxtLink to="/admin" class="text-xl font-bold text-white hover:text-indigo-200">
              QuizApp Admin
            </NuxtLink>
          </div>
          <nav class="flex items-center space-x-4">
            <NuxtLink to="/admin" class="text-indigo-200 hover:text-white text-sm font-medium">
              Tests
            </NuxtLink>
            <NuxtLink to="/admin/dashboard" class="text-indigo-200 hover:text-white text-sm font-medium">
              Dashboard
            </NuxtLink>
            <NuxtLink to="/" class="text-indigo-200 hover:text-white text-sm font-medium">
              View Site
            </NuxtLink>
            <button
              @click="logout"
              class="text-indigo-200 hover:text-white text-sm font-medium"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  router.push('/admin/login')
}
</script>
