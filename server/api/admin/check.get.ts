export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminToken = getCookie(event, 'admin_token')
  return { authenticated: adminToken === config.adminPassword }
})
