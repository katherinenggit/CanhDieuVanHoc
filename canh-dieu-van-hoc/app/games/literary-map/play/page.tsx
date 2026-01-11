'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client' 
import { 
  fetchQuestions, 
  checkAnswer, 
  calculateAnswerScore,
  saveGameSession,
  generateAIFeedback,
  calculateGameResult
} from '@/lib/game/quiz-race-logic'
import {
  generateMapNodes,
  checkKeyReward,
  usePowerUp,
  processWaterfallRecovery,
  isRegionCompleted,
  calculateRegionBonus,
  getNextNode,
  calculateLiteraryMapResult
} from '@/lib/game/literary-map-logic'
import { QuestionWithAnswer, AnswerRecord, MapNode } from '@/lib/types/game'
import { Loader2, Heart, Zap, Key, Shield, Home, RotateCcw, Award, Map as MapIcon } from 'lucide-react'
import { getDifficultyColor, formatTime } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface Region {
  workId: string
  workName: string
  nodes: MapNode[]
  currentNodeIndex: number
  completed: boolean
}

function LiteraryMapPlayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const supabase = createClient() // Khởi tạo client một lần

  // Settings from URL
  const workIds = searchParams.get('works')?.split(',') || []
  const startingHearts = parseInt(searchParams.get('hearts') || '3')
  const difficulty = (searchParams.get('difficulty') || 'Hỗn hợp') as 'Dễ' | 'Trung bình' | 'Khó' | 'Hỗn hợp'

  // Game state
  const [loading, setLoading] = useState(true)
  const [regions, setRegions] = useState<Region[]>([])
  const [currentRegionIndex, setCurrentRegionIndex] = useState(0)
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  
  // Player stats
  const [hearts, setHearts] = useState(startingHearts)
  const [maxHearts] = useState(startingHearts)
  const [keys, setKeys] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  
  // Power-ups
  const [powerUps, setPowerUps] = useState({
    shield: 0,
    fifty_fifty: 0,
    special_box: 0,
    secret_path: 0,
  })
  const [shieldActive, setShieldActive] = useState(false)
  const [removedOptions, setRemovedOptions] = useState<number[]>([])
  
  // Game control
  const [gameFinished, setGameFinished] = useState(false)
  const [showWaterfallModal, setShowWaterfallModal] = useState(false)
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [timeRemaining, setTimeRemaining] = useState(900) // 15 minutes

  useEffect(() => {
    loadGame()
  }, [])

  // Timer
  useEffect(() => {
    if (gameFinished || loading) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          finishGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameFinished, loading])

  const loadGame = async () => {
    try {
      // Fetch work names
      const { data: works, error: worksError } = await supabase
        .from('literary_works')
        .select('id, title')
        .in('id', workIds)

      if (worksError) throw worksError

      // Generate regions with nodes
      const newRegions: Region[] = (works || []).map((work) => ({
        workId: work.id,
        workName: work.title,
        nodes: generateMapNodes(work.id, work.title),
        currentNodeIndex: 0,
        completed: false,
      }))

      setRegions(newRegions)

      // Load questions for first region
      await loadQuestionsForRegion(newRegions[0])
    } catch (error) {
      console.error('Error loading game:', error)
      toast.error('Lỗi: Không thể tải game.')
      router.push('/games/literary-map')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestionsForRegion = async (region: Region) => {
    try {
      const fetchedQuestions = await fetchQuestions([region.workId], 30, difficulty)
      setQuestions(fetchedQuestions)
      setCurrentQuestionIndex(0)
      setQuestionStartTime(Date.now())
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Lỗi: Không thể tải câu hỏi.')
    }
  }

  const handleNodeClick = (nodeIndex: number) => {
    const currentRegion = regions[currentRegionIndex]
    const node = currentRegion.nodes[nodeIndex]

    if (node.locked || node.completed) return

    if (node.type === 'waterfall') {
      setShowWaterfallModal(true)
    } else {
      setShowNodeModal(true)
    }
  }

  const handleStartNode = () => {
    setShowNodeModal(false)
    // Question will be displayed automatically
  }

  const handleWaterfallChoice = (choice: 'heart' | 'keys') => {
    const result = processWaterfallRecovery(choice, hearts, maxHearts, keys)
    setHearts(result.hearts)
    setKeys(result.keys)
    
    toast.success(
        <div>
          <div className="font-bold">{choice === 'heart' ? 'Hồi phục!' : 'Nhận chìa khóa!'}</div>
          <div className="text-xs opacity-90">{choice === 'heart' ? '+1 ❤️ Trái tim' : '+1 🔑 Chìa khóa'}</div>
        </div>
      )

    completeCurrentNode()
    setShowWaterfallModal(false)
  }

  const handleSubmitAnswer = (answer: string = selectedAnswer || '') => {
    if (isAnswered) return

    const currentQ = questions[currentQuestionIndex]
    const currentRegion = regions[currentRegionIndex]
    const currentNode = currentRegion.nodes[currentRegion.currentNodeIndex]
    const timeTaken = (Date.now() - questionStartTime) / 1000
    const isCorrect = checkAnswer(currentQ, answer)

    // Handle shield
    if (!isCorrect && shieldActive) {
      setShieldActive(false)
      toast('🛡️ Shield kích hoạt! : Bạn được bảo vệ khỏi câu sai này.')
      // Continue to next without losing heart
      setIsAnswered(true)
      setTimeout(() => handleNextQuestion(), 2000)
      return
    }

    // Calculate score
    const earnedScore = isCorrect ? currentNode.points : 0
    const newScore = score + earnedScore
    const newStreak = isCorrect ? streak + 1 : 0
    const newLongestStreak = Math.max(longestStreak, newStreak)

    // Check for key rewards
    const keysEarned = isCorrect ? checkKeyReward(newStreak, currentNode.type, timeTaken, currentQ.difficulty) : 0
    if (keysEarned > 0) {
      setKeys(keys + keysEarned)
      toast.success(`+${keysEarned} 🔑 Chìa khóa!`, {
        description: newStreak % 5 === 0 ? 'Phần thưởng chuỗi thắng (Streak)!' : 'Phản xạ siêu tốc!',
      });
      
    }

    // Lose heart if wrong
    if (!isCorrect) {
      const newHearts = hearts - 1
      setHearts(newHearts)
      
      if (newHearts <= 0) {
        toast.info('💔 Game Over: Bạn đã hết trái tim!')
        setTimeout(() => finishGame(), 1500)
        return
      }
    }

    // Save answer record
    const answerRecord: AnswerRecord = {
      question_id: currentQ.id,
      answer,
      is_correct: isCorrect,
      time_taken: timeTaken,
      timestamp: new Date().toISOString(),
    }

    setAnswers([...answers, answerRecord])
    setScore(newScore)
    setStreak(newStreak)
    setLongestStreak(newLongestStreak)
    setIsAnswered(true)

    // Confetti for correct
    if (isCorrect && newStreak >= 3) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      })
    }

    setTimeout(() => handleNextQuestion(), 2000)
  }

  const handleNextQuestion = () => {
    completeCurrentNode()
    setSelectedAnswer(null)
    setIsAnswered(false)
    setRemovedOptions([])
    setQuestionStartTime(Date.now())
  }

  const completeCurrentNode = () => {
    const newRegions = [...regions]
    const currentRegion = newRegions[currentRegionIndex]
    const currentNode = currentRegion.nodes[currentRegion.currentNodeIndex]
    
    currentNode.completed = true

    // Unlock next node
    if (currentRegion.currentNodeIndex + 1 < currentRegion.nodes.length) {
      currentRegion.nodes[currentRegion.currentNodeIndex + 1].locked = false
      currentRegion.currentNodeIndex++
    }

    // Check if region completed
    if (isRegionCompleted(currentRegion.nodes)) {
      currentRegion.completed = true
      const heartsLost = maxHearts - hearts
      const bonus = calculateRegionBonus(currentRegion.nodes.length, heartsLost, difficulty)
      
      setScore(score + bonus.points)
      setKeys(keys + bonus.keys)

      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-bold text-lg text-emerald-600">🎉 Hoàn thành khu vực!</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
              +{bonus.points} điểm
            </span>
            {bonus.keys > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                +{bonus.keys} 🔑
              </span>
            )}
          </div>
        </div>,
        {
          duration: 4000, // Để lâu hơn chút cho người dùng kịp mừng
        }
      )

      // Move to next region
      if (currentRegionIndex + 1 < regions.length) {
        setCurrentRegionIndex(currentRegionIndex + 1)
        loadQuestionsForRegion(newRegions[currentRegionIndex + 1])
      } else {
        // All regions completed!
        finishGame()
        return
      }
    }

    setRegions(newRegions)
    
    // Move to next question
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleUsePowerUp = (type: 'shield' | 'fifty_fifty' | 'secret_path') => {
    if (type === 'fifty_fifty' && isAnswered) return
    
    const result = usePowerUp(type, keys, powerUps)
    
    if (!result.success) {
        toast.error(
            <div>
              <div className="font-bold text-red-600">Không đủ chìa khóa</div>
              <div className="text-xs opacity-90">
                Cần {type === 'shield' ? '2' : type === 'fifty_fifty' ? '1' : '2'} 🔑 để sử dụng vật phẩm này
              </div>
            </div>
          )
      return
    }

    setKeys(keys - result.keysUsed)
    setPowerUps(result.newPowerUps as any)

    if (type === 'shield') {
      setShieldActive(true)
      toast.info('🛡️ Shield kích hoạt!: Bạn được bảo vệ ở câu tiếp theo' )
    } else if (type === 'fifty_fifty') {
      const currentQ = questions[currentQuestionIndex]
      if (currentQ.question_type === 'multiple_choice') {
        const options = currentQ.answer_data.options || []
        const correctIndex = options.indexOf(currentQ.answer_data.correct || '')
        const wrongIndices = options.map((_, i) => i).filter((i) => i !== correctIndex)
        const toRemove = wrongIndices.slice(0, 2)
        setRemovedOptions(toRemove)
        toast.info('➗ 50/50 đã dùng: Loại bỏ 2 đáp án sai' )
      }
    } else if (type === 'secret_path') {
      completeCurrentNode()
      toast.info('🚪 Đường tắt!: Bỏ qua node này')
    }
  }

  const finishGame = async () => {
    setGameFinished(true)

    const result = calculateGameResult(answers, answers.length, score, longestStreak)
    const mapResult = calculateLiteraryMapResult(
      score,
      answers.length,
      result.correctAnswers,
      result.wrongAnswers,
      regions.filter((r) => r.completed).length,
      hearts,
      Object.values(powerUps).reduce((a, b) => a + b, 0)
    )

    if (user) {
      await saveGameSession(
        user.id,
        'literary_map',
        'personal',
        { workIds, difficulty, hearts: startingHearts },
        result
      )
    }

    if (mapResult.grade === 'S') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (gameFinished) {
    const regionsCompleted = regions.filter((r) => r.completed).length
    const totalRegions = regions.length
    const accuracy = answers.length > 0 
      ? Math.round((answers.filter((a) => a.is_correct).length / answers.length) * 100)
      : 0

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-6">
                  <Award className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Hành trình hoàn thành!</h1>
              <p className="text-lg text-muted-foreground">
                Kết quả của bạn
              </p>
            </div>

            {/* Score Display */}
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-primary mb-2">{score}</div>
              <p className="text-muted-foreground">Điểm</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{regionsCompleted}/{totalRegions}</div>
                <div className="text-sm text-muted-foreground">Khu vực</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Độ chính xác</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  {Array.from({ length: hearts }).map((_, i) => (
                    <Heart key={i} className="h-5 w-5 fill-red-500 text-red-500" />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">Trái tim còn lại</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{longestStreak}</div>
                <div className="text-sm text-muted-foreground">Streak dài nhất</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={() => router.push('/')} variant="outline" className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Button>
              <Button onClick={() => router.push('/games/literary-map')} className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Chơi lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentRegion = regions[currentRegionIndex]
  const currentNode = currentRegion?.nodes[currentRegion.currentNodeIndex]
  const currentQuestion = questions[currentQuestionIndex]
  const energyPercentage = 100 // Simplified - no energy system

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 p-4">
      <div className="container mx-auto max-w-6xl py-8">
        {/* Top Stats Bar */}
        <div className="mb-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {Array.from({ length: maxHearts }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-6 w-6 ${
                    i < hearts ? 'fill-red-500 text-red-500' : 'fill-gray-400 text-gray-400'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <span className="text-lg font-bold">{keys}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold">{score}</div>
            <div className="text-xs">Điểm</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold">{formatTime(timeRemaining)}</div>
            <div className="text-xs">Thời gian</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <MapIcon className="h-4 w-4" />
                  {currentRegion?.workName}
                </h3>
                
                {/* Map Nodes */}
                <div className="space-y-3">
                  {currentRegion?.nodes.map((node, index) => {
                    const isCurrent = index === currentRegion.currentNodeIndex
                    const icon = node.type === 'plains' ? '🏞️' 
                      : node.type === 'forest' ? '🌳'
                      : node.type === 'mountain' ? '⛰️'
                      : '💧'

                    return (
                      <button
                        key={index}
                        onClick={() => handleNodeClick(index)}
                        disabled={node.locked || node.completed}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          node.completed
                            ? 'bg-green-100 border-green-500'
                            : isCurrent
                            ? 'bg-primary border-primary text-white animate-pulse'
                            : node.locked
                            ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                            : 'bg-white border-gray-300 hover:border-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{icon}</span>
                            <div>
                              <div className="font-semibold text-sm">
                                Node {index + 1}
                              </div>
                              <div className="text-xs opacity-75">
                                {node.type === 'waterfall' ? 'Recovery' : `${node.points} pts`}
                              </div>
                            </div>
                          </div>
                          {node.completed && <span className="text-lg">✓</span>}
                          {node.locked && <span className="text-lg">🔒</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Power-ups */}
                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold text-sm mb-3">Power-ups</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleUsePowerUp('shield')}
                    disabled={shieldActive || keys < 2}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Shield (2 🔑)
                    {shieldActive && ' - Active'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleUsePowerUp('fifty_fifty')}
                    disabled={isAnswered || keys < 1 || removedOptions.length > 0}
                  >
                    ➗ 50/50 (1 🔑)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleUsePowerUp('secret_path')}
                    disabled={keys < 2}
                  >
                    🚪 Secret Path (2 🔑)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-8 pb-6">
                {currentNode?.type !== 'waterfall' && currentQuestion && (
                  <>
                    <div className="flex items-start justify-between mb-6">
                      <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty}
                      </Badge>
                      {streak > 0 && (
                        <Badge className="bg-orange-500">
                          🔥 Streak: {streak}
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold mb-8 text-center">
                      {currentQuestion.content}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(currentQuestion.answer_data.options || []).map((option, index) => {
                        const isRemoved = removedOptions.includes(index)
                        const isSelected = selectedAnswer === option
                        const isCorrect = currentQuestion.answer_data.correct === option

                        let buttonClass = 'h-auto py-4 text-left justify-start px-6 whitespace-normal break-words'
                        
                        if (isRemoved) {
                          buttonClass += ' opacity-30 cursor-not-allowed'
                        } else if (isAnswered) {
                          if (isCorrect) {
                            buttonClass += ' bg-green-500 hover:bg-green-500 text-white'
                          } else if (isSelected) {
                            buttonClass += ' bg-red-500 hover:bg-red-500 text-white'
                          }
                        } else if (isSelected) {
                          buttonClass += ' ring-2 ring-primary ring-offset-2'
                        }

                        return (
                          <Button
                            key={index}
                            variant={isSelected && !isAnswered ? 'default' : 'outline'}
                            className={buttonClass}
                            onClick={() => !isRemoved && !isAnswered && setSelectedAnswer(option)}
                            disabled={isAnswered || isRemoved}
                          >
                            <span className="mr-3 text-xl font-bold">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            {option}
                          </Button>
                        )
                      })}
                    </div>

                    {!isAnswered && (
                      <Button
                        size="lg"
                        onClick={() => handleSubmitAnswer()}
                        disabled={!selectedAnswer}
                        className="w-full mt-6 bg-green-600 hover:bg-green-700"
                      >
                        Trả lời
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        {showWaterfallModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">💧</div>
                  <h3 className="text-2xl font-bold mb-2">Thác nước!</h3>
                  <p className="text-muted-foreground">Chọn phần thưởng</p>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleWaterfallChoice('heart')}
                    disabled={hearts >= maxHearts}
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    +1 Trái tim
                  </Button>
                  <Button
                    className="w-full"
                    size="lg"
                    variant="outline"
                    onClick={() => handleWaterfallChoice('keys')}
                  >
                    <Key className="mr-2 h-5 w-5" />
                    +1 Chìa khóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showNodeModal && currentNode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">
                    {currentNode.type === 'plains' ? '🏞️' 
                      : currentNode.type === 'forest' ? '🌳'
                      : '⛰️'}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {currentNode.type === 'plains' ? 'Đồng bằng'
                      : currentNode.type === 'forest' ? 'Rừng rậm'
                      : 'Núi cao'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Độ khó: {currentNode.difficulty} • Điểm: {currentNode.points}
                  </p>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartNode}
                >
                  Bắt đầu
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LiteraryMapPlayPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <LiteraryMapPlayContent />
    </Suspense>
  )
}