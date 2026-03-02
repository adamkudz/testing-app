export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  if (body.password === config.adminPassword) {
    setCookie(event, 'admin_token', config.adminPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })
    return { success: true }
  }

  throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
})
