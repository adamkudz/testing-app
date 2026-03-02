export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  const supabase = useServiceSupabase()

  // Create test
  const { data: test, error: testError } = await supabase
    .from('tests')
    .insert({
      title: body.title,
      description: body.description || '',
      time_limit_seconds: body.timeLimitSeconds || null,
      passing_score: body.passingScore || null,
    })
    .select()
    .single()

  if (testError || !test) {
    throw createError({ statusCode: 500, statusMessage: testError?.message || 'Failed to create test' })
  }

  // Create questions if provided
  if (body.questions?.length) {
    const questions = body.questions.map((q: any, idx: number) => ({
      test_id: test.id,
      type: q.type,
      prompt: q.prompt,
      sort_order: idx,
      options: q.options || [],
      correct_answer: q.correctAnswer || null,
    }))

    const { error: qError } = await supabase.from('questions').insert(questions)
    if (qError) {
      throw createError({ statusCode: 500, statusMessage: qError.message })
    }
  }

  return { id: test.id }
})
