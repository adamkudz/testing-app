export default defineEventHandler(async (event) => {
  const testId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = useServiceSupabase()

  // Fetch test questions with correct answers
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, type, prompt, options, correct_answer, sort_order')
    .eq('test_id', testId)
    .order('sort_order')

  if (qError || !questions) {
    throw createError({ statusCode: 404, statusMessage: 'Test not found' })
  }

  const userAnswers: Record<string, any> = body.answers || {}
  let score = 0
  const total = questions.length
  const results: any[] = []

  for (const q of questions) {
    const userAnswer = userAnswers[q.id]
    let isCorrect = false

    switch (q.type) {
      case 'single_select':
      case 'true_false': {
        const correctOption = (q.options as any[]).find((o: any) => o.is_correct)
        isCorrect = correctOption && userAnswer === correctOption.label
        results.push({
          questionId: q.id,
          prompt: q.prompt,
          type: q.type,
          userAnswer,
          correctAnswer: correctOption?.label || '',
          isCorrect,
          options: q.options,
        })
        break
      }
      case 'multi_select': {
        const correctLabels = (q.options as any[])
          .filter((o: any) => o.is_correct)
          .map((o: any) => o.label)
          .sort()
        const userLabels = (Array.isArray(userAnswer) ? userAnswer : []).sort()
        isCorrect =
          correctLabels.length === userLabels.length &&
          correctLabels.every((l: string, i: number) => l === userLabels[i])
        results.push({
          questionId: q.id,
          prompt: q.prompt,
          type: q.type,
          userAnswer: userLabels,
          correctAnswer: correctLabels,
          isCorrect,
          options: q.options,
        })
        break
      }
      case 'free_text': {
        const expected = (q.correct_answer || '').trim().toLowerCase()
        const given = (userAnswer || '').trim().toLowerCase()
        isCorrect = given === expected
        results.push({
          questionId: q.id,
          prompt: q.prompt,
          type: q.type,
          userAnswer: userAnswer || '',
          correctAnswer: q.correct_answer || '',
          isCorrect,
        })
        break
      }
      case 'matching': {
        // userAnswer is an object: { leftLabel: chosenRightLabel }
        const pairs = q.options as any[]
        const userPairs = userAnswer || {}
        isCorrect = pairs.every(
          (p: any) => userPairs[p.label] === p.match_target
        )
        results.push({
          questionId: q.id,
          prompt: q.prompt,
          type: q.type,
          userAnswer: userPairs,
          correctAnswer: Object.fromEntries(pairs.map((p: any) => [p.label, p.match_target])),
          isCorrect,
          options: q.options,
        })
        break
      }
    }

    if (isCorrect) score++
  }

  // Save attempt to database
  const { error: insertError } = await supabase.from('attempts').insert({
    test_id: testId,
    score,
    total,
    answers: results.map((r) => ({
      question_id: r.questionId,
      user_answer: r.userAnswer,
      is_correct: r.isCorrect,
    })),
    started_at: body.startedAt || new Date().toISOString(),
    completed_at: new Date().toISOString(),
  })

  if (insertError) {
    console.error('Failed to save attempt:', insertError)
  }

  return {
    score,
    total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    results,
  }
})
