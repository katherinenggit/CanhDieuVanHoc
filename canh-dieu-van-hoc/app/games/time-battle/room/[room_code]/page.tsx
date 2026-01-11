'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { fetchQuestions, checkAnswer } from '@/lib/game/quiz-race-logic'
import { QuestionWithAnswer } from '@/lib/types/game'
import { Copy, Users, Clock, Trophy, Loader2, Play, Home } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  id: string
  player_id: string
  score: number
  correct_count: number
  profiles: {
    display_name: string
    username: string
    avatar_url: string | null
  }
}

interface GameSession {
  id: string
  room_code: string
  created_by: string
  settings: any
  status: string
}

export default function TimeBattleRoomPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()

  const roomCode = params?.roomCode as string

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<GameSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isHost, setIsHost] = useState(false)

  // Game state
  const [gameStarted, setGameStarted] = useState(false)
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [myScore, setMyScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [gameFinished, setGameFinished] = useState(false)

  useEffect(() => {
    if (!roomCode) return
    loadRoom()
    subscribeToUpdates()
  }, [roomCode])

  useEffect(() => {
    if (gameStarted && !gameFinished) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            finishGame()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [gameStarted, gameFinished])

  const loadRoom = async () => {
    try {
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (sessionError || !sessionData) {
        toast.error('Không tìm thấy phòng')
        router.push('/games/time-battle')
        return
      }

      setSession(sessionData)
      setIsHost(user?.id === sessionData.created_by)

      // Load participants
      const { data: participantsData } = await supabase
        .from('game_participants')
        .select(`
          *,
          profiles:player_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('session_id', sessionData.id)

      setParticipants(participantsData || [])

      // Join if not already joined
      if (user && !participantsData?.some(p => p.player_id === user.id)) {
        await supabase
          .from('game_participants')
          .insert({
            session_id: sessionData.id,
            player_id: user.id,
            score: 0,
            correct_count: 0
          })
      }

    } catch (error) {
      console.error('Error loading room:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSession(payload.new as GameSession)
            if (payload.new.status === 'playing' && !gameStarted) {
              startGame()
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants'
        },
        () => {
          loadRoom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleStartGame = async () => {
    if (!session || !isHost) return

    try {
      // Load questions
      const settings = session.settings
      const fetchedQuestions = await fetchQuestions(
        settings.workIds,
        settings.questionCount,
        settings.difficulty
      )

      // Insert game questions
      for (let i = 0; i < fetchedQuestions.length; i++) {
        await supabase.from('game_questions').insert({
          session_id: session.id,
          question_id: fetchedQuestions[i].id,
          order_index: i
        })
      }

      // Update session status
      await supabase
        .from('game_sessions')
        .update({ status: 'playing', started_at: new Date().toISOString() })
        .eq('id', session.id)

      toast.success('Game đã bắt đầu!')
    } catch (error) {
      console.error('Error starting game:', error)
      toast.error('Không thể bắt đầu game')
    }
  }

  const startGame = async () => {
    if (!session) return

    try {
      const { data: gameQuestions } = await supabase
        .from('game_questions')
        .select(`
          *,
          questions:question_id (
            id,
            content,
            answer_data,
            difficulty,
            work_id
          )
        `)
        .eq('session_id', session.id)
        .order('order_index', { ascending: true })

      const qs = (gameQuestions || []).map(gq => gq.questions) as QuestionWithAnswer[]
      setQuestions(qs)
      setGameStarted(true)
      setTimeRemaining(120)
    } catch (error) {
      console.error('Error loading game questions:', error)
    }
  }

  const handleSubmitAnswer = async (answer: string) => {
    if (!user || !session || isAnswered) return

    const currentQ = questions[currentQuestionIndex]
    const isCorrect = checkAnswer(currentQ, answer)

    setIsAnswered(true)
    setSelectedAnswer(answer)

    // Calculate score
    const earnedPoints = isCorrect ? 10 : -5

    // Update participant score
    const myParticipant = participants.find(p => p.player_id === user.id)
    if (myParticipant) {
      const newScore = myParticipant.score + earnedPoints
      setMyScore(newScore)

      await supabase
        .from('game_participants')
        .update({
          score: newScore,
          correct_count: isCorrect ? myParticipant.correct_count + 1 : myParticipant.correct_count
        })
        .eq('id', myParticipant.id)
    }

    // Move to next question
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer(null)
        setIsAnswered(false)
      } else {
        finishGame()
      }
    }, 1500)
  }

  const finishGame = async () => {
    setGameFinished(true)

    if (session) {
      await supabase
        .from('game_sessions')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', session.id)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    toast.success('Đã sao chép mã phòng')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Không tìm thấy phòng</p>
            <Button onClick={() => router.push('/games/time-battle')}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Waiting room
  if (!gameStarted && session.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-red-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Phòng chờ</h1>
              <div className="flex items-center justify-center gap-3">
                <Badge variant="outline" className="text-2xl font-mono px-4 py-2">
                  {roomCode}
                </Badge>
                <Button size="sm" variant="outline" onClick={copyRoomCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Participants */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Người chơi ({participants.length})
              </h3>
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar>
                      <AvatarImage src={p.profiles.avatar_url || ''} />
                      <AvatarFallback>{p.profiles.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{p.profiles.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{p.profiles.username}</p>
                    </div>
                    {p.player_id === session.created_by && (
                      <Badge>Host</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {isHost ? (
              <Button
                size="lg"
                className="w-full"
                onClick={handleStartGame}
                disabled={participants.length < 2}
              >
                <Play className="mr-2 h-5 w-5" />
                Bắt đầu game ({participants.length >= 2 ? 'Ready' : `Cần ${2 - participants.length} người`})
              </Button>
            ) : (
              <div className="text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>Đang chờ host bắt đầu...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Game finished
  if (gameFinished) {
    const sortedParticipants = [...participants].sort((a, b) => b.score - a.score)

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-red-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Kết thúc!</h1>
            </div>

            {/* Leaderboard */}
            <div className="space-y-3 mb-8">
              {sortedParticipants.map((p, index) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="text-2xl font-bold">#{index + 1}</div>
                  <Avatar>
                    <AvatarImage src={p.profiles.avatar_url || ''} />
                    <AvatarFallback>{p.profiles.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{p.profiles.display_name}</p>
                    <p className="text-sm opacity-90">
                      {p.correct_count} câu đúng
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{p.score}</p>
                    <p className="text-xs opacity-90">điểm</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Button>
              <Button onClick={() => router.push('/games/time-battle')} className="flex-1">
                Chơi lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Playing game
  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-red-600 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between text-white mb-6">
          <div className="text-2xl font-bold">{myScore} điểm</div>
          <div className="flex items-center gap-2 text-xl font-mono">
            <Clock className="h-6 w-6" />
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-sm">
            {currentQuestionIndex + 1}/{questions.length}
          </div>
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardContent className="pt-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {currentQuestion?.content}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion?.answer_data.options?.map((option, idx) => {
                const isCorrect = currentQuestion.answer_data.correct === option
                const isSelected = selectedAnswer === option

                return (
                  <Button
                    key={idx}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`h-auto py-4 text-lg ${
                      isAnswered && isCorrect
                        ? 'bg-green-500 hover:bg-green-500 text-white'
                        : isAnswered && isSelected
                        ? 'bg-red-500 hover:bg-red-500 text-white'
                        : ''
                    }`}
                    onClick={() => !isAnswered && handleSubmitAnswer(option)}
                    disabled={isAnswered}
                  >
                    {String.fromCharCode(65 + idx)}. {option}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live scores */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              {participants.map((p) => (
                <div key={p.id} className="text-center">
                  <Avatar className="h-8 w-8 mx-auto mb-1">
                    <AvatarImage src={p.profiles.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {p.profiles.display_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-bold">{p.score}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}