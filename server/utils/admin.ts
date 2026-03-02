import { H3Event } from 'h3'

export function requireAdmin(event: H3Event) {
  const config = useRuntimeConfig()
  const adminToken = getCookie(event, 'admin_token')

  if (adminToken !== config.adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Admin access required',
    })
  }
}
