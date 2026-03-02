export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const testId = getRouterParam(event, 'testId')
  const questionId = getRouterParam(event, 'qid')
  const supabase = useServiceSupabase()

  // Fetch all attempts for this test
  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('id, answers, completed_at')
    .eq('test_id', testId)
    .order('completed_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Extract individual question responses
  const responses = (attempts || [])
    .map((a: any) => {
      const answers = a.answers as any[]
      if (!Array.isArray(answers)) return null
      const answer = answers.find((ans: any) => ans.question_id === questionId)
      if (!answer) return null
      return {
        attemptId: a.id,
        userAnswer: answer.user_answer,
        isCorrect: answer.is_correct,
        completedAt: a.completed_at,
      }
    })
    .filter(Boolean)

  // Fetch question details
  const { data: question } = await supabase
    .from('questions')
    .select('id, prompt, type, options, correct_answer')
    .eq('id', questionId)
    .single()

  return {
    question: question
      ? {
          id: question.id,
          prompt: question.prompt,
          type: question.type,
          options: question.options,
          correctAnswer: question.correct_answer,
        }
      : null,
    responses,
    totalResponses: responses.length,
    correctCount: responses.filter((r: any) => r.isCorrect).length,
    incorrectCount: responses.filter((r: any) => !r.isCorrect).length,
  }
})
