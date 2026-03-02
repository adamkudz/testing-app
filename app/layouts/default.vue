<template>
  <div>
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink to="/" class="text-xl font-bold text-indigo-600 hover:text-indigo-700">
            QuizApp
          </NuxtLink>
          <nav class="flex items-center space-x-4">
            <NuxtLink to="/" class="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Home
            </NuxtLink>
            <NuxtLink to="/admin" class="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Admin
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
