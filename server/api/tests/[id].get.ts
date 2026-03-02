export default defineEventHandler(async (event) => {
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
      questions(id, type, prompt, sort_order, options)
    `)
    .eq('id', id)
    .single()

  if (error || !test) {
    throw createError({ statusCode: 404, statusMessage: 'Test not found' })
  }

  // Strip correct answers from options before sending to client
  const sanitizedQuestions = (test as any).questions
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((q: any) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      sortOrder: q.sort_order,
      options: q.type === 'free_text'
        ? []
        : (q.options || []).map((opt: any) => ({
            label: opt.label,
            ...(q.type === 'matching' ? { matchTarget: opt.match_target } : {}),
          })),
    }))

  return {
    id: test.id,
    title: (test as any).title,
    description: (test as any).description,
    timeLimitSeconds: (test as any).time_limit_seconds,
    passingScore: (test as any).passing_score,
    questions: sanitizedQuestions,
  }
})
