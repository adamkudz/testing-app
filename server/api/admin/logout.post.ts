export default defineEventHandler(async (event) => {
  deleteCookie(event, 'admin_token', { path: '/' })
  return { success: true }
})
