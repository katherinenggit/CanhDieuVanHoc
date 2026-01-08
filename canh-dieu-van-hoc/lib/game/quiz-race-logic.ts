import { QuestionWithAnswer, AnswerRecord, GameResult } from '@/lib/types/game'
import { createClient } from '@/lib/supabase/client'
import { shuffleArray } from '@/lib/utils'

/**
 * Fetch random questions based on settings
 */
export async function fetchQuestions(
  workIds: string[],
  count: number,
  difficulty: 'Dễ' | 'Trung bình' | 'Khó' | 'Hỗn hợp'
): Promise<QuestionWithAnswer[]> {
  try {
    let query = createClient()
      .from('questions')
      .select('*')
      .eq('is_public', true)
      .in('work_id', workIds)

    // Filter by difficulty if not mixed
    if (difficulty !== 'Hỗn hợp') {
      query = query.eq('difficulty', difficulty)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error('No questions found for selected criteria')
    }

    // Shuffle and take requested count
    const shuffled = shuffleArray(data)
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))

    return selected as QuestionWithAnswer[]
  } catch (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
}

/**
 * Calculate score for a single answer
 * Score = Base Points × Time Factor × Streak Multiplier
 */
export function calculateAnswerScore(
  isCorrect: boolean,
  timeLeft: number,
  totalTime: number,
  streak: number,
  difficulty: 'Dễ' | 'Trung bình' | 'Khó'
): number {
  if (!isCorrect) return 0

  // Base points by difficulty
  const basePoints = {
    Dễ: 100,
    'Trung bình': 150,
    Khó: 200,
  }

  // Time factor (0.5 to 1.0)
  const timeFactor = Math.max(0.5, timeLeft / totalTime)

  // Streak multiplier
  let streakMultiplier = 1
  if (streak >= 10) {
    streakMultiplier = 2.0
  } else if (streak >= 5) {
    streakMultiplier = 1.5
  }

  const score = Math.round(basePoints[difficulty] * timeFactor * streakMultiplier)
  return score
}

/**
 * Check if answer is correct
 */
export function checkAnswer(
  question: QuestionWithAnswer,
  userAnswer: string
): boolean {
  if (question.question_type === 'multiple_choice') {
    return userAnswer.toUpperCase() === question.answer_data.correct?.toUpperCase()
  } else {
    // Fill in blank - check against all acceptable answers
    const correctAnswers = question.answer_data.correct_answers || []
    const caseSensitive = question.answer_data.case_sensitive || false

    return correctAnswers.some((correctAnswer) => {
      if (caseSensitive) {
        return userAnswer.trim() === correctAnswer.trim()
      } else {
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      }
    })
  }
}

/**
 * Apply 50/50 power-up to multiple choice question
 * Returns indices of 2 wrong answers to remove
 */
export function applyFiftyFifty(question: QuestionWithAnswer): number[] {
  if (question.question_type !== 'multiple_choice') {
    return []
  }

  const options = question.answer_data.options || []
  const correct = question.answer_data.correct || ''
  const correctIndex = options.indexOf(correct)

  // Get all wrong answer indices
  const wrongIndices = options
    .map((_, index) => index)
    .filter((index) => index !== correctIndex)

  // Randomly select 2 to remove
  const shuffled = shuffleArray(wrongIndices)
  return shuffled.slice(0, 2)
}

/**
 * Calculate final game result
 */
export function calculateGameResult(
  answers: AnswerRecord[],
  totalQuestions: number,
  totalScore: number,
  longestStreak: number
): GameResult {
  const correctAnswers = answers.filter((a) => a.is_correct).length
  const wrongAnswers = answers.filter((a) => !a.is_correct).length
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  
  const totalTime = answers.reduce((sum, a) => sum + a.time_taken, 0)
  const averageTime = answers.length > 0 ? totalTime / answers.length : 0

  return {
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    accuracy: Math.round(accuracy),
    totalScore,
    longestStreak,
    averageTime: Math.round(averageTime * 10) / 10,
    answers,
  }
}

/**
 * Save game session to database
 */
export async function saveGameSession(
  userId: string,
  gameType: 'quiz_race' | 'time_battle' | 'literary_map',
  gameMode: 'personal' | 'competition',
  settings: any,
  result: GameResult
) {
  try {
    // 1. Create game session
    const { data: session, error: sessionError } = await createClient()
      .from('game_sessions')
      .insert({
        created_by: userId,
        game_mode: gameMode,
        game_type: gameType,
        settings,
        status: 'finished',
        room_code: '', // Empty for personal games
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // 2. Save game history
    const { error: historyError } = await createClient().from('game_history').insert({
      user_id: userId,
      session_id: session.id,
      game_type: gameType,
      game_mode: gameMode,
      score: result.totalScore,
      correct_count: result.correctAnswers,
      total_questions: result.totalQuestions,
      time_spent: Math.round(result.averageTime * result.totalQuestions),
      average_time: result.averageTime,
      works_covered: settings.workIds || [],
    })

    if (historyError) throw historyError

    // 3. Update user profile stats
    const { data: profile, error: profileFetchError } = await createClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileFetchError) throw profileFetchError

    const newTotalGames = profile.total_games + 1
    const newTotalQuestions = profile.total_questions_answered + result.totalQuestions
    const newCorrectAnswers = profile.total_correct_answers + result.correctAnswers
    const newWrongAnswers = profile.total_wrong_answers + result.wrongAnswers
    const newTotalScore = profile.total_score + result.totalScore
    const newLongestStreak = Math.max(profile.longest_streak, result.longestStreak)

    // Calculate XP gained (1 XP per point)
    const xpGained = result.totalScore
    const newXP = profile.xp + xpGained

    // Calculate new level
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1

    // Update badge based on level
    let newBadge = profile.badge
    if (newLevel >= 50) {
      newBadge = 'Kim cương'
    } else if (newLevel >= 30) {
      newBadge = 'Hồng ngọc'
    } else if (newLevel >= 20) {
      newBadge = 'Vàng'
    } else if (newLevel >= 10) {
      newBadge = 'Bạc'
    }

    const { error: updateError } = await createClient()
      .from('profiles')
      .update({
        total_games: newTotalGames,
        total_questions_answered: newTotalQuestions,
        total_correct_answers: newCorrectAnswers,
        total_wrong_answers: newWrongAnswers,
        total_score: newTotalScore,
        longest_streak: newLongestStreak,
        xp: newXP,
        level: newLevel,
        badge: newBadge,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) throw updateError

    return { success: true, sessionId: session.id, xpGained, levelUp: newLevel > profile.level }
  } catch (error) {
    console.error('Error saving game session:', error)
    return { success: false, error }
  }
}

/**
 * Generate AI feedback based on wrong answers
 */
export async function generateAIFeedback(
  wrongAnswers: AnswerRecord[],
  questions: QuestionWithAnswer[]
): Promise<string> {
  if (wrongAnswers.length === 0) {
    return 'Bạn đã trả lời đúng tất cả câu hỏi! Xuất sắc!'
  }

  try {
    // Get works from wrong answers
    const wrongQuestions = wrongAnswers.map((ans) =>
      questions.find((q) => q.id === ans.question_id)
    )

    const workIds = [...new Set(wrongQuestions.map((q) => q?.work_id).filter(Boolean))]

    if (workIds.length === 0) {
      return 'Hãy ôn tập thêm để nắm vững kiến thức hơn!'
    }

    // Fetch work names
    const { data: works } = await createClient()
      .from('literary_works')
      .select('title')
      .in('id', workIds as string[])

    const workTitles = works?.map((w) => w.title).join(', ') || ''

    // Simple feedback based on patterns
    if (wrongAnswers.length === 1) {
      return `Bạn cần ôn lại một chút về "${workTitles}".`
    } else if (wrongAnswers.length <= 3) {
      return `Hãy dành thêm thời gian ôn tập các tác phẩm: ${workTitles}.`
    } else {
      return `Bạn nên ôn lại kỹ hơn các kiến thức về: ${workTitles}. Đừng nản lòng, cố gắng lên!`
    }
  } catch (error) {
    console.error('Error generating AI feedback:', error)
    return 'Hãy tiếp tục luyện tập để cải thiện kết quả!'
  }
}