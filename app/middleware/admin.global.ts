export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for the login page itself
  if (to.path === '/admin/login') return

  // Only protect /admin routes
  if (!to.path.startsWith('/admin')) return

  try {
    const { authenticated } = await $fetch('/api/admin/check')
    if (!authenticated) {
      return navigateTo('/admin/login')
    }
  } catch {
    return navigateTo('/admin/login')
  }
})
