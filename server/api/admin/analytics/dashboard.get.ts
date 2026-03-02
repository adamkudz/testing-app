export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = useServiceSupabase()

  // Fetch all tests
  const { data: tests, error: tError } = await supabase
    .from('tests')
    .select('id, title, created_at, questions(id)')
    .order('created_at', { ascending: false })

  if (tError) {
    throw createError({ statusCode: 500, statusMessage: tError.message })
  }

  // Fetch all attempts
  const { data: attempts, error: aError } = await supabase
    .from('attempts')
    .select('id, test_id, score, total, started_at, completed_at')
    .order('completed_at', { ascending: false })

  if (aError) {
    throw createError({ statusCode: 500, statusMessage: aError.message })
  }

  const allAttempts = attempts || []
  const allTests = tests || []

  // Global stats
  const totalTests = allTests.length
  const totalAttempts = allAttempts.length
  const allScores = allAttempts
    .filter((a: any) => a.total > 0)
    .map((a: any) => (a.score / a.total) * 100)
  const overallAvgScore = allScores.length
    ? allScores.reduce((s: number, v: number) => s + v, 0) / allScores.length
    : 0

  // Per-test stats
  const testStats = allTests.map((t: any) => {
    const testAttempts = allAttempts.filter((a: any) => a.test_id === t.id)
    const scores = testAttempts
      .filter((a: any) => a.total > 0)
      .map((a: any) => (a.score / a.total) * 100)
    const avgScore = scores.length
      ? scores.reduce((s: number, v: number) => s + v, 0) / scores.length
      : 0
    const completionTimes = testAttempts
      .filter((a: any) => a.started_at && a.completed_at)
      .map((a: any) => new Date(a.completed_at).getTime() - new Date(a.started_at).getTime())
    const avgCompletionTime = completionTimes.length
      ? completionTimes.reduce((s: number, v: number) => s + v, 0) / completionTimes.length
      : 0

    return {
      id: t.id,
      title: t.title,
      questionCount: t.questions?.length || 0,
      attemptCount: testAttempts.length,
      avgScore: Math.round(avgScore * 10) / 10,
      avgCompletionTimeMs: Math.round(avgCompletionTime),
    }
  })

  // Most popular test
  const mostPopular = [...testStats].sort((a, b) => b.attemptCount - a.attemptCount)[0] || null
  const leastPopular = [...testStats].sort((a, b) => a.attemptCount - b.attemptCount)[0] || null

  // Trend data: attempts per day (last 30 days) and avg score per day
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentAttempts = allAttempts.filter(
    (a: any) => new Date(a.completed_at) >= thirtyDaysAgo
  )

  const dailyData: Record<string, { count: number; scores: number[] }> = {}
  for (let d = 0; d <= 30; d++) {
    const date = new Date(thirtyDaysAgo.getTime() + d * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]!
    dailyData[key] = { count: 0, scores: [] }
  }

  for (const a of recentAttempts) {
    const key = new Date(a.completed_at).toISOString().split('T')[0]!
    if (dailyData[key]) {
      dailyData[key].count++
      if ((a as any).total > 0) {
        dailyData[key].scores.push(((a as any).score / (a as any).total) * 100)
      }
    }
  }

  const trends = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      attempts: data.count,
      avgScore: data.scores.length
        ? Math.round((data.scores.reduce((s, v) => s + v, 0) / data.scores.length) * 10) / 10
        : null,
    }))

  return {
    summary: {
      totalTests,
      totalAttempts,
      overallAvgScore: Math.round(overallAvgScore * 10) / 10,
      mostPopularTest: mostPopular,
      leastPopularTest: leastPopular,
    },
    testStats,
    trends,
  }
})
