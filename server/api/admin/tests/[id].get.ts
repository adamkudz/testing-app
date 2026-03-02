export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = useServiceSupabase()

  const { data: test, error } = await supabase
    .from('tests')
    .select(`
      id,
      title,
      description,
      time_limit_seconds,
      passing_score,
      created_at,
      updated_at,
      questions(id, type, prompt, sort_order, options, correct_answer)
    `)
    .eq('id', id)
    .single()

  if (error || !test) {
    throw createError({ statusCode: 404, statusMessage: 'Test not found' })
  }

  return {
    id: test.id,
    title: (test as any).title,
    description: (test as any).description,
    timeLimitSeconds: (test as any).time_limit_seconds,
    passingScore: (test as any).passing_score,
    createdAt: (test as any).created_at,
    updatedAt: (test as any).updated_at,
    questions: ((test as any).questions || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((q: any) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        sortOrder: q.sort_order,
        options: q.options || [],
        correctAnswer: q.correct_answer,
      })),
  }
})
