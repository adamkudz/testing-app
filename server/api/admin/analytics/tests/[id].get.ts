export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const testId = getRouterParam(event, 'id')
  if (!testId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing test ID' })
  }
  const query = getQuery(event)
  const supabase = useServiceSupabase()

  // Build query with filters
  let attemptsQuery = supabase
    .from('attempts')
    .select('*')
    .eq('test_id', testId)

  if (query.date_from) {
    attemptsQuery = attemptsQuery.gte('completed_at', query.date_from as string)
  }
  if (query.date_to) {
    attemptsQuery = attemptsQuery.lte('completed_at', query.date_to as string)
  }

  attemptsQuery = attemptsQuery.order('completed_at', { ascending: false })

  const { data: attempts, error } = await attemptsQuery

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Apply score filters client-side (Supabase doesn't support computed filters easily)
  let filtered = attempts || []
  if (query.score_min !== undefined) {
    const min = Number(query.score_min)
    filtered = filtered.filter((a: any) => a.total > 0 && (a.score / a.total) * 100 >= min)
  }
  if (query.score_max !== undefined) {
    const max = Number(query.score_max)
    filtered = filtered.filter((a: any) => a.total > 0 && (a.score / a.total) * 100 <= max)
  }

  // Fetch test info for passing_score
  const { data: test } = await supabase
    .from('tests')
    .select('passing_score')
    .eq('id', testId)
    .single()

  const passingScore = test?.passing_score

  if (query.passed === 'true' && passingScore) {
    filtered = filtered.filter((a: any) => a.total > 0 && (a.score / a.total) * 100 >= passingScore)
  } else if (query.passed === 'false' && passingScore) {
    filtered = filtered.filter((a: any) => a.total > 0 && (a.score / a.total) * 100 < passingScore)
  }

  // Compute summary stats
  const totalAttempts = filtered.length
  const scores = filtered.map((a: any) => (a.total > 0 ? (a.score / a.total) * 100 : 0))
  const avgScore = scores.length ? scores.reduce((s: number, v: number) => s + v, 0) / scores.length : 0
  const sortedScores = [...scores].sort((a, b) => a - b)
  const medianScore = sortedScores.length
    ? sortedScores.length % 2 === 0
      ? ((sortedScores[sortedScores.length / 2 - 1] ?? 0) + (sortedScores[sortedScores.length / 2] ?? 0)) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)] ?? 0
    : 0
  const highestScore = scores.length ? Math.max(...scores) : 0
  const lowestScore = scores.length ? Math.min(...scores) : 0

  // Average completion time
  const completionTimes = filtered
    .filter((a: any) => a.started_at && a.completed_at)
    .map((a: any) => new Date(a.completed_at).getTime() - new Date(a.started_at).getTime())
  const avgCompletionTime = completionTimes.length
    ? completionTimes.reduce((s: number, v: number) => s + v, 0) / completionTimes.length
    : 0

  // Per-question miss rates
  const questionStats: Record<string, { total: number; missed: number; wrongAnswers: Record<string, number> }> = {}

  for (const attempt of filtered) {
    const answers = attempt.answers as any[]
    if (!Array.isArray(answers)) continue
    for (const ans of answers) {
      if (!questionStats[ans.question_id]) {
        questionStats[ans.question_id] = { total: 0, missed: 0, wrongAnswers: {} }
      }
      const qStat = questionStats[ans.question_id]!
      qStat.total++
      if (!ans.is_correct) {
        qStat.missed++
        const wrongKey = typeof ans.user_answer === 'object'
          ? JSON.stringify(ans.user_answer)
          : String(ans.user_answer || 'No answer')
        qStat.wrongAnswers[wrongKey] = (qStat.wrongAnswers[wrongKey] || 0) + 1
      }
    }
  }

  // Fetch question prompts
  const { data: questions } = await supabase
    .from('questions')
    .select('id, prompt, type, sort_order')
    .eq('test_id', testId)
    .order('sort_order')

  const questionMissRates = (questions || []).map((q: any) => {
    const stats = questionStats[q.id] || { total: 0, missed: 0, wrongAnswers: {} }
    const missRate = stats.total > 0 ? (stats.missed / stats.total) * 100 : 0
    // Sort wrong answers by frequency
    const commonWrongAnswers = Object.entries(stats.wrongAnswers)
      .map(([answer, count]) => ({ answer, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)

    return {
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      sortOrder: q.sort_order,
      timesAnswered: stats.total,
      timesMissed: stats.missed,
      missRate: Math.round(missRate * 10) / 10,
      commonWrongAnswers,
    }
  }).sort((a: any, b: any) => b.missRate - a.missRate)

  return {
    summary: {
      totalAttempts,
      avgScore: Math.round(avgScore * 10) / 10,
      medianScore: Math.round(medianScore * 10) / 10,
      highestScore: Math.round(highestScore * 10) / 10,
      lowestScore: Math.round(lowestScore * 10) / 10,
      avgCompletionTimeMs: Math.round(avgCompletionTime),
      passingScore,
    },
    questionMissRates,
    attempts: filtered.map((a: any) => ({
      id: a.id,
      score: a.score,
      total: a.total,
      percentage: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
      startedAt: a.started_at,
      completedAt: a.completed_at,
    })),
  }
})
