export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = useServiceSupabase()

  const { data: tests, error } = await supabase
    .from('tests')
    .select(`
      id,
      title,
      description,
      time_limit_seconds,
      passing_score,
      created_at,
      updated_at,
      questions(id)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return tests.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    timeLimitSeconds: t.time_limit_seconds,
    passingScore: t.passing_score,
    questionCount: t.questions?.length || 0,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }))
})
