'use client'

// Thêm dòng này để Vercel không báo lỗi khi build (vì có dùng params và auth)
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Trophy, Clock, Zap, Home, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import { fetchQuestions, checkAnswer } from '@/lib/game/quiz-race-logic'
import { QuestionWithAnswer } from '@/lib/types/game'
import { formatTime } from '@/lib/utils'
import { useGameSound } from '@/lib/hooks/useGameSound'

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
  const supabase = createClient()
  
  const { 
    playCorrect, playWrong, playClick, playVictory, 
    playBg, stopBg, playTickTock, stopTickTock 
  } = useGameSound()

  const [loading, setLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [gameFinished, setGameFinished] = useState(false)
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([])
  const [myScore, setMyScore] = useState(0)
  const [myCorrectCount, setMyCorrectCount] = useState(0)
  
  // MỚI: Theo dõi trạng thái phòng
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')

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

  // LOAD GAME BAN ĐẦU
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
        
        // Cập nhật trạng thái session ngay từ đầu
        setSessionStatus(session.status)

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

  // REALTIME: Lắng nghe cả Session và Participants
  useEffect(() => {
    const channel = supabase
      .channel(`battle-realtime-${params.id}`)
      // 1. Nghe thay đổi trạng thái phòng (Để biết khi nào chủ phòng bấm Bắt đầu)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${params.id}`,
      }, (payload: any) => { // Fix lỗi đỏ bằng : any
        const newStatus = payload.new.status
        setSessionStatus(newStatus)
        if (newStatus === 'playing') {
          toast.success("Trận đấu bắt đầu!")
        }
      })
      // 2. Nghe thay đổi điểm số của mọi người
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

  // TIMER LOGIC: Chỉ chạy khi status là 'playing'
  useEffect(() => {
    if (gameFinished || loading || sessionStatus !== 'playing') return

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
  }, [gameFinished, loading, sessionStatus])

  // ÂM THANH NỀN
  useEffect(() => {
    if (!loading && sessionStatus === 'playing' && !gameFinished && !isMuted) {
      playBg()
    } else {
      stopBg()
    }
    return () => stopBg()
  }, [loading, sessionStatus, gameFinished, isMuted, playBg, stopBg])

  const finishGame = async () => {
    if (gameFinished) return
    setGameFinished(true)
    stopBg()
    stopTickTock()
    if (!isMuted) playVictory()
    
    try {
      await supabase
        .from('game_sessions')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', params.id)
    } catch (e) { console.error(e) }
  }

  // XỬ LÝ ĐÁP ÁN
  const handleSelectAnswer = (answer: string) => {
    if (hasAnswered) return
    if (!isMuted) playClick()
    setSelectedAnswer(answer)
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || hasAnswered || !user) return
    if (!isMuted) playClick()

    const currentQ = questions[currentIndex]
    const isCorrect = checkAnswer(currentQ, selectedAnswer)
    let earnedScore = isCorrect ? 10 : -3
    
    const newScore = myScore + earnedScore
    const newCorrectCount = isCorrect ? myCorrectCount + 1 : myCorrectCount
    setHasAnswered(true)

    if (isCorrect) {
      if (!isMuted) playCorrect()
      toast.success(`Chính xác! +${earnedScore} điểm`)
    } else {
      if (!isMuted) playWrong()
      toast.error(`Sai rồi! ${earnedScore} điểm`)
    }

    try {
      await supabase
        .from('game_participants')
        .update({ score: newScore, correct_count: newCorrectCount })
        .eq('session_id', params.id)
        .eq('player_id', user.id)

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1)
          setSelectedAnswer(null)
          setHasAnswered(false)
        } else {
          finishGame()
        }
      }, 1500)
    } catch (error) {
      toast.error('Lỗi cập nhật điểm số.')
    }
  }

  // GIAO DIỆN CHỜ (Rất quan trọng)
  if (loading || sessionStatus === 'waiting') return (
    <div className="min-h-screen bg-orange-500 flex flex-col items-center justify-center text-white p-4">
      <Loader2 className="h-12 w-12 animate-spin mb-4" />
      <h2 className="text-2xl font-bold animate-pulse">Đang đợi chủ phòng bắt đầu...</h2>
      <p className="mt-2 opacity-80 text-center">Tất cả người chơi sẽ cùng vào trận ngay khi chủ phòng bấm nút.</p>
    </div>
  )

  // GIAO DIỆN KẾT THÚC
  if (gameFinished) {
    const myRank = playerScores.findIndex((p) => p.player_id === user?.id) + 1
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-red-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardContent className="pt-10 text-center">
            <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-black mb-2">Hạng #{myRank}</h1>
            <p className="text-muted-foreground mb-8 text-lg">Trận đấu đã kết thúc!</p>
            <div className="space-y-3 mb-8">
              {playerScores.map((p, i) => (
                <div key={p.player_id} className={`flex items-center justify-between p-4 rounded-xl ${p.player_id === user?.id ? 'bg-orange-100 border-2 border-orange-400' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-gray-400">#{i+1}</span>
                    <Avatar><AvatarImage src={p.avatar_url || ''} /><AvatarFallback>{p.display_name[0]}</AvatarFallback></Avatar>
                    <span className="font-bold">{p.display_name}</span>
                  </div>
                  <span className="font-black text-orange-600 text-xl">{p.score}đ</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => router.push('/')} variant="outline" className="h-12 font-bold"><Home className="mr-2" /> Trang chủ</Button>
              <Button onClick={() => router.push('/games/time-battle')} className="h-12 font-bold bg-orange-600 hover:bg-orange-700"><RotateCcw className="mr-2" /> Chơi lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // GIAO DIỆN CHƠI GAME CHÍNH
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-red-700 p-4">
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 right-4 text-white hover:bg-white/20 z-50"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? <VolumeX /> : <Volume2 />}
      </Button>

      <div className="container mx-auto max-w-6xl py-8">
        <div className="flex justify-between items-end text-white mb-8">
          <div className="space-y-1">
            <p className="text-xs uppercase font-bold opacity-70">Thời gian</p>
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 ${timeRemaining <= 10 ? 'bg-red-500 border-white animate-pulse' : 'bg-black/20 border-white/20'}`}>
              <Clock className="h-5 w-5" />
              <span className="text-2xl font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase font-bold opacity-70">Điểm của bạn</p>
            <div className="text-5xl font-black text-yellow-300 drop-shadow-md">{myScore}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-8 border-none shadow-2xl rounded-3xl">
            <Badge className="mb-4 px-4 py-1 bg-blue-100 text-blue-700 border-none">{questions[currentIndex]?.difficulty}</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight mb-10">{questions[currentIndex]?.content}</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {(questions[currentIndex]?.answer_data?.options || []).map((opt, i) => (
                <Button 
                  key={i} 
                  variant={selectedAnswer === opt ? "default" : "outline"}
                  className={`h-auto min-h-[70px] py-4 text-lg justify-start px-6 text-left border-2 transition-all ${
                    hasAnswered && opt === questions[currentIndex]?.answer_data?.correct 
                      ? 'bg-green-500 border-green-500 text-white hover:bg-green-500' 
                      : hasAnswered && selectedAnswer === opt 
                        ? 'bg-red-500 border-red-500 text-white hover:bg-red-500' 
                        : selectedAnswer === opt ? 'border-orange-500 bg-orange-50' : 'hover:border-orange-200'
                  }`}
                  onClick={() => handleSelectAnswer(opt)}
                  disabled={hasAnswered}
                >
                  <span className={`mr-4 w-8 h-8 rounded-full flex items-center justify-center font-black ${selectedAnswer === opt ? 'bg-white text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </Button>
              ))}
            </div>

            {!hasAnswered && (
              <Button 
                className="w-full mt-10 h-14 bg-orange-600 hover:bg-orange-700 text-xl font-black rounded-2xl shadow-lg shadow-orange-200" 
                onClick={handleSubmitAnswer} 
                disabled={!selectedAnswer}
              >
                XÁC NHẬN ĐÁP ÁN
              </Button>
            )}
          </Card>

          <Card className="p-6 border-none shadow-xl rounded-3xl h-fit">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-orange-800">
              <Zap className="h-6 w-6 text-orange-500 fill-orange-500"/> BXH TRỰC TIẾP
            </h3>
            <div className="space-y-3">
              {playerScores.map((p, i) => (
                <div key={p.player_id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${p.player_id === user?.id ? 'bg-orange-50 ring-1 ring-orange-200 shadow-sm' : ''}`}>
                  <span className={`font-black w-6 text-center ${i === 0 ? 'text-yellow-500' : 'text-gray-400'}`}>{i+1}</span>
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={p.avatar_url || ''} />
                    <AvatarFallback className="bg-orange-200 text-orange-700">{p.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className={`flex-1 truncate font-bold ${p.player_id === user?.id ? 'text-orange-900' : 'text-gray-700'}`}>{p.display_name}</span>
                  <span className="font-black text-orange-600">{p.score}đ</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}