export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = useServiceSupabase()

  // Update test metadata
  const { error: testError } = await supabase
    .from('tests')
    .update({
      title: body.title,
      description: body.description || '',
      time_limit_seconds: body.timeLimitSeconds || null,
      passing_score: body.passingScore || null,
    })
    .eq('id', id)

  if (testError) {
    throw createError({ statusCode: 500, statusMessage: testError.message })
  }

  // Replace all questions: delete existing, insert new
  if (body.questions !== undefined) {
    const { error: delError } = await supabase
      .from('questions')
      .delete()
      .eq('test_id', id)

    if (delError) {
      throw createError({ statusCode: 500, statusMessage: delError.message })
    }

    if (body.questions?.length) {
      const questions = body.questions.map((q: any, idx: number) => ({
        test_id: id,
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
  }

  return { success: true }
})
