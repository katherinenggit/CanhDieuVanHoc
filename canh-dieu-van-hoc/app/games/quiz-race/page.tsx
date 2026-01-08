'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner' // Sửa: Dùng sonner
import {
  fetchQuestions,
  calculateAnswerScore,
  checkAnswer,
  applyFiftyFifty,
  calculateGameResult,
  saveGameSession,
  generateAIFeedback,
} from '@/lib/game/quiz-race-logic'
import { QuestionWithAnswer, AnswerRecord, GameResult } from '@/lib/types/game'
import { getDifficultyColor, formatTime, getPerformanceMessage } from '@/lib/utils'
import { Loader2, Flame, Clock, Zap, Award, Home, RotateCcw, ChevronRight } from 'lucide-react'
import confetti from 'canvas-confetti'

// Tách nội dung game ra một component riêng để bọc Suspense
function QuizRaceGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string>('')
  const [removedOptions, setRemovedOptions] = useState<number[]>([])

  const workIds = searchParams.get('works')?.split(',') || []
  const questionCount = parseInt(searchParams.get('count') || '10')
  const difficulty = (searchParams.get('difficulty') || 'Hỗn hợp') as any
  const timeLimit = searchParams.get('timeLimit') === 'true'
  const timePerQuestion = parseInt(searchParams.get('timePerQuestion') || '30')

  const [powerUps, setPowerUps] = useState({
    fiftyFifty: 1,
    timeFreeze: 1,
    skip: 2,
  })

  useEffect(() => {
    loadQuestions()
  }, [])

  useEffect(() => {
    if (!timeLimit || isAnswered || gameFinished || loading) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLimit, isAnswered, gameFinished, loading])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const fetchedQuestions = await fetchQuestions(workIds, questionCount, difficulty)
      if (!fetchedQuestions || fetchedQuestions.length === 0) throw new Error('No questions found')
      
      setQuestions(fetchedQuestions)
      setQuestionStartTime(Date.now())
      setTimeRemaining(timePerQuestion)
    } catch (error) {
      toast.error('Không thể tải câu hỏi. Vui lòng thử lại.')
      router.push('/games/quiz-race')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeout = () => {
    if (isAnswered) return
    handleSubmitAnswer('') 
  }

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return
    setSelectedAnswer(answer)
  }

  const handleSubmitAnswer = (answer: string = selectedAnswer || '') => {
    if (isAnswered || gameFinished) return

    const currentQ = questions[currentIndex]
    const timeTaken = (Date.now() - questionStartTime) / 1000
    const isCorrect = checkAnswer(currentQ, answer)

    const earnedScore = calculateAnswerScore(
      isCorrect,
      timeRemaining,
      timePerQuestion,
      streak,
      currentQ.difficulty
    )

    const newStreak = isCorrect ? streak + 1 : 0
    const newLongestStreak = Math.max(longestStreak, newStreak)

    const answerRecord: AnswerRecord = {
      question_id: currentQ.id,
      answer,
      is_correct: isCorrect,
      time_taken: timeTaken,
      timestamp: new Date().toISOString(),
    }

    const updatedAnswers = [...answers, answerRecord]
    setAnswers(updatedAnswers)
    setScore(prev => prev + earnedScore)
    setStreak(newStreak)
    setLongestStreak(newLongestStreak)
    setIsAnswered(true)

    if (isCorrect && newStreak >= 3) {
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } })
    }

    // Tự động chuyển câu sau 1.5s
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setIsAnswered(false)
        setTimeRemaining(timePerQuestion)
        setQuestionStartTime(Date.now())
        setRemovedOptions([])
      } else {
        finishGame(updatedAnswers, score + earnedScore, newLongestStreak)
      }
    }, 1500)
  }

  const finishGame = async (finalAnswers: AnswerRecord[], finalScore: number, finalLongestStreak: number) => {
    setLoading(true) // Hiện loading trong khi xử lý kết quả AI và lưu DB
    const result = calculateGameResult(finalAnswers, questions.length, finalScore, finalLongestStreak)
    setGameResult(result)
    setGameFinished(true)

    try {
      // 1. Lưu vào Database nếu có user
      if (user) {
        await saveGameSession(
          user.id,
          'quiz_race',
          'personal',
          { workIds, questionCount, difficulty, timeLimit, timePerQuestion },
          result
        )
      }

      // 2. Gọi AI Feedback
      const wrongAnswers = finalAnswers.filter((a) => !a.is_correct)
      if (wrongAnswers.length > 0) {
        const feedback = await generateAIFeedback(wrongAnswers, questions)
        setAiFeedback(feedback)
      }

      if (result.accuracy >= 80) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } })
      }
    } catch (err) {
      console.error("Finish game error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Power-up handlers
  const handleUseFiftyFifty = () => {
    if (powerUps.fiftyFifty <= 0 || isAnswered || questions[currentIndex].question_type !== 'multiple_choice') return
    const toRemove = applyFiftyFifty(questions[currentIndex])
    setRemovedOptions(toRemove)
    setPowerUps(prev => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }))
    toast.info('Đã loại bỏ 2 đáp án sai')
  }

  const handleTimeFreeze = () => {
    if (powerUps.timeFreeze <= 0 || isAnswered || !timeLimit) return
    setTimeRemaining(prev => prev + 10)
    setPowerUps(prev => ({ ...prev, timeFreeze: prev.timeFreeze - 1 }))
    toast.info('Đã đóng băng thời gian (+10s)')
  }

  const handleSkip = () => {
    if (powerUps.skip <= 0 || isAnswered) return
    setPowerUps(prev => ({ ...prev, skip: prev.skip - 1 }))
    handleSubmitAnswer('SKIPPED_BY_USER')
  }

  if (loading && !gameFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải câu hỏi...</p>
        </div>
      </div>
    )
  }

  if (gameFinished && gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardContent className="pt-8">
             {/* Nội dung kết quả giữ nguyên như code của bạn nhưng bọc trong UI sạch hơn */}
             <div className="text-center mb-6">
                <Award className="h-16 w-16 text-yellow-500 mx-auto mb-2" />
                <h1 className="text-3xl font-bold">{getPerformanceMessage(gameResult.accuracy)}</h1>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold">{gameResult.totalScore}</p>
                    <p className="text-xs text-muted-foreground uppercase">Điểm số</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-500">{gameResult.correctAnswers}</p>
                    <p className="text-xs text-muted-foreground uppercase">Đúng</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-500">{gameResult.accuracy}%</p>
                    <p className="text-xs text-muted-foreground uppercase">Tỉ lệ</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-orange-500">{gameResult.longestStreak}</p>
                    <p className="text-xs text-muted-foreground uppercase">Chuỗi</p>
                </div>
             </div>

             {aiFeedback && (
               <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                 <p className="text-sm italic">" {aiFeedback} "</p>
               </div>
             )}

             <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>Trang chủ</Button>
                <Button className="flex-1" onClick={() => window.location.reload()}>Chơi lại</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between text-white">
          <div className="flex-1 max-w-[200px]">
            <div className="flex justify-between text-xs mb-1">
                <span>Câu {currentIndex + 1}/{questions.length}</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold leading-none">{score}</p>
              <p className="text-[10px] uppercase opacity-80">Điểm số</p>
            </div>
            {streak > 2 && (
              <div className="flex items-center bg-orange-500 px-3 py-1 rounded-full animate-bounce">
                <Flame className="h-4 w-4 mr-1" />
                <span className="font-bold">{streak}</span>
              </div>
            )}
            {timeLimit && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-black/20 ${timeRemaining < 10 ? 'text-red-400 animate-pulse' : ''}`}>
                <Clock className="h-5 w-5" />
                <span className="text-xl font-mono font-bold">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
        </div>

        <Card className="mb-6 shadow-2xl border-none">
          <CardContent className="pt-10 pb-10">
            <div className="text-center mb-8">
              <Badge variant="outline" className={`mb-4 ${getDifficultyColor(currentQuestion?.difficulty)}`}>
                {currentQuestion?.difficulty}
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold px-4">{currentQuestion?.content}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion?.question_type === 'multiple_choice' ? (
                currentQuestion.answer_data.options?.map((option, idx) => {
                  const isRemoved = removedOptions.includes(idx)
                  const isCorrect = isAnswered && currentQuestion.answer_data.correct === option
                  const isWrong = isAnswered && selectedAnswer === option && !isCorrect

                  return (
                    <Button
                      key={idx}
                      disabled={isAnswered || isRemoved}
                      variant={selectedAnswer === option ? "default" : "outline"}
                      className={`h-auto py-6 text-lg justify-start px-6 transition-all ${
                        isCorrect ? 'bg-green-500 hover:bg-green-500 text-white border-green-600' : 
                        isWrong ? 'bg-red-500 hover:bg-red-500 text-white border-red-600' : 
                        isRemoved ? 'opacity-0 pointer-events-none' : ''
                      }`}
                      onClick={() => handleSelectAnswer(option)}
                    >
                      <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center mr-4 text-sm">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </Button>
                  )
                })
              ) : (
                <div className="col-span-full max-w-md mx-auto w-full">
                    <input 
                        className="w-full p-4 text-center text-xl border-2 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Nhập đáp án của bạn..."
                        value={selectedAnswer || ''}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        disabled={isAnswered}
                        autoFocus
                    />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleUseFiftyFifty} disabled={isAnswered || powerUps.fiftyFifty === 0 || currentQuestion?.question_type !== 'multiple_choice'}>
                   🪄 50:50 ({powerUps.fiftyFifty})
                </Button>
                <Button variant="secondary" size="sm" onClick={handleTimeFreeze} disabled={isAnswered || powerUps.timeFreeze === 0}>
                   ❄️ +10s ({powerUps.timeFreeze})
                </Button>
                <Button variant="secondary" size="sm" onClick={handleSkip} disabled={isAnswered || powerUps.skip === 0}>
                   ⏭️ Bỏ qua ({powerUps.skip})
                </Button>
            </div>

            {!isAnswered && (
                <Button size="lg" className="px-10 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg" onClick={() => handleSubmitAnswer()} disabled={!selectedAnswer}>
                    XÁC NHẬN <ChevronRight className="ml-2" />
                </Button>
            )}
        </div>
      </div>
    </div>
  )
}

// Export trang chính bọc trong Suspense
export default function QuizRacePlayPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <QuizRaceGame />
        </Suspense>
    )
}