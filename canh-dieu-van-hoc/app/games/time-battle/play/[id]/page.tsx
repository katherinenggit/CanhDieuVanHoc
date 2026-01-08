'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Trophy, Clock, Zap, Home, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { fetchQuestions, checkAnswer } from '@/lib/game/quiz-race-logic'
import { QuestionWithAnswer } from '@/lib/types/game'
import { formatTime, getDifficultyColor } from '@/lib/utils'

interface PlayerScore {
  player_id: string
  display_name: string
  username: string
  avatar_url: string | null
  score: number
  correct_count: number
  answered: boolean
}

export default function TimeBattlePlayPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient() // 1. KHỞI TẠO TẠI ĐÂY

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120) 
  const [gameFinished, setGameFinished] = useState(false)
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([])
  const [myScore, setMyScore] = useState(0)
  const [myCorrectCount, setMyCorrectCount] = useState(0)

  // 2. FETCH SCORES ĐƯỢC TỐI ƯU
  const fetchScores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_participants')
        .select(`
          player_id, score, correct_count,
          profiles:player_id (display_name, username, avatar_url)
        `)
        .eq('session_id', params.id)
        .order('score', { ascending: false })

      if (error) throw error

      const scores = (data as any[]).map((item) => ({
        player_id: item.player_id,
        display_name: item.profiles.display_name,
        username: item.profiles.username,
        avatar_url: item.profiles.avatar_url,
        score: item.score,
        correct_count: item.correct_count,
        answered: false,
      }))

      setPlayerScores(scores)
      const myData = scores.find((s) => s.player_id === user?.id)
      if (myData) {
        setMyScore(myData.score)
        setMyCorrectCount(myData.correct_count)
      }
    } catch (error) {
      console.error('Error scores:', error)
    }
  }, [params.id, user, supabase])

  // 3. LOAD GAME
  useEffect(() => {
    const loadGame = async () => {
      if (!user) return
      try {
        const { data: session, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', params.id)
          .single()

        if (sessionError) throw sessionError

        const fetchedQuestions = await fetchQuestions(
          session.settings.workIds,
          session.settings.questionCount,
          session.settings.difficulty
        )
        setQuestions(fetchedQuestions)
        await fetchScores()
      } catch (error) {
        toast.error('Không thể tải dữ liệu trận đấu.')
        router.push('/games/time-battle')
      } finally {
        setLoading(false)
      }
    }

    loadGame()
  }, [params.id, user, router, supabase, fetchScores])

  // 4. REALTIME SCORES
  useEffect(() => {
    const channel = supabase
      .channel(`battle-${params.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_participants',
        filter: `session_id=eq.${params.id}`,
      }, () => {
        fetchScores()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [params.id, supabase, fetchScores])

  // 5. TIMER
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

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || hasAnswered || !user) return

    const currentQ = questions[currentIndex]
    const isCorrect = checkAnswer(currentQ, selectedAnswer)

    // Tính điểm: Nhanh (+10), Chậm (+5), Sai (-3)
    let earnedScore = isCorrect ? (playerScores.some(p => p.player_id !== user.id && p.score > 0) ? 5 : 10) : -3
    
    const newScore = myScore + earnedScore
    const newCorrectCount = isCorrect ? myCorrectCount + 1 : myCorrectCount

    setHasAnswered(true)

    try {
      // Dùng rpc hoặc cập nhật thông thường
      const { error } = await supabase
        .from('game_participants')
        .update({
          score: newScore,
          correct_count: newCorrectCount,
        })
        .eq('session_id', params.id)
        .eq('player_id', user.id)

      if (error) throw error

      if (isCorrect) toast.success(`Chính xác! +${earnedScore} điểm`)
      else toast.error(`Sai rồi! ${earnedScore} điểm`)

      setTimeout(() => {
        handleNextQuestion()
      }, 1500)
    } catch (error) {
      toast.error('Lỗi cập nhật điểm số.')
    }
  }

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setHasAnswered(false)
    } else {
      finishGame()
    }
  }

  const finishGame = async () => {
    setGameFinished(true)
    try {
      await supabase
        .from('game_sessions')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', params.id)
    } catch (e) { console.error(e) }
  }

  // --- RENDERING UI (Giữ nguyên cấu trúc của bạn nhưng dùng data sạch) ---
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (gameFinished) {
     const myRank = playerScores.findIndex((p) => p.player_id === user?.id) + 1
     return (
        <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-red-700 flex items-center justify-center p-4">
           <Card className="w-full max-w-2xl">
              <CardContent className="pt-10 text-center">
                 <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                 <h1 className="text-3xl font-bold">Hạng #{myRank}</h1>
                 <p className="text-muted-foreground mb-6">Trận đấu đã kết thúc!</p>
                 <div className="space-y-2 mb-8">
                    {playerScores.map((p, i) => (
                       <div key={p.player_id} className={`flex justify-between p-3 rounded ${p.player_id === user?.id ? 'bg-orange-100 border border-orange-300' : 'bg-gray-50'}`}>
                          <span>{i+1}. {p.display_name}</span>
                          <span className="font-bold">{p.score}đ</span>
                       </div>
                    ))}
                 </div>
                 <div className="flex gap-4">
                    <Button className="flex-1" onClick={() => router.push('/')} variant="outline"><Home className="mr-2 h-4" /> Về trang chủ</Button>
                    <Button className="flex-1" onClick={() => router.push('/games/time-battle')}><RotateCcw className="mr-2 h-4" /> Chơi ván mới</Button>
                 </div>
              </CardContent>
           </Card>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-red-700 p-4">
       {/* UI Question & Leaderboard của bạn */}
       <div className="container mx-auto max-w-6xl py-8">
          <div className="flex justify-between items-center text-white mb-8">
             <div className="bg-white/20 p-4 rounded-lg flex items-center gap-3">
                <Clock className="h-6 w-6" />
                <span className="text-2xl font-mono font-bold">{formatTime(timeRemaining)}</span>
             </div>
             <div className="text-right">
                <div className="text-3xl font-black">{myScore}</div>
                <div className="text-xs uppercase opacity-80">Điểm của bạn</div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card className="lg:col-span-2 p-6">
                <Badge className="mb-4">{questions[currentIndex]?.difficulty}</Badge>
                <h2 className="text-2xl font-bold text-center mb-8">{questions[currentIndex]?.content}</h2>
                <div className="grid grid-cols-1 gap-4">
                   {/* Thêm (questions[currentIndex]?.answer_data?.options || []) */}
{(questions[currentIndex]?.answer_data?.options || []).map((opt, i) => (
  <Button 
    key={i} 
    variant={selectedAnswer === opt ? "default" : "outline"}
    className={`h-16 text-lg justify-start px-6 ${
      hasAnswered && opt === questions[currentIndex]?.answer_data?.correct 
        ? 'bg-green-500 text-white hover:bg-green-500' 
        : ''
    } ${
      hasAnswered && selectedAnswer === opt && opt !== questions[currentIndex]?.answer_data?.correct 
        ? 'bg-red-500 text-white hover:bg-red-500' 
        : ''
    }`}
    onClick={() => !hasAnswered && setSelectedAnswer(opt)}
    disabled={hasAnswered}
  >
    <span className="mr-3 font-bold opacity-50">{String.fromCharCode(65 + i)}.</span>
    {opt}
  </Button>
))}
                </div>
                {!hasAnswered && (
                   <Button className="w-full mt-8 h-12 bg-orange-600" onClick={handleSubmitAnswer} disabled={!selectedAnswer}>Gửi đáp án</Button>
                )}
             </Card>

             <Card className="p-4">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-orange-500"/>BXH Trực tiếp</h3>
                <div className="space-y-2">
                   {playerScores.map((p, i) => (
                      <div key={p.player_id} className={`flex items-center gap-3 p-2 rounded ${p.player_id === user?.id ? 'bg-primary/10' : ''}`}>
                         <span className="font-bold w-4">{i+1}</span>
                         <Avatar className="h-8 w-8"><AvatarImage src={p.avatar_url || ''} /><AvatarFallback>{p.display_name[0]}</AvatarFallback></Avatar>
                         <span className="flex-1 truncate text-sm">{p.display_name}</span>
                         <span className="font-bold">{p.score}</span>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
       </div>
    </div>
  )
}