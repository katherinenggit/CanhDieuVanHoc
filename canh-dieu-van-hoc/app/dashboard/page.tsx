'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Gamepad2,
  Award,
  BookOpen,
  Loader2,
} from 'lucide-react'
import { calculateLevel, calculateXPForNextLevel, formatScore, getBadgeColor } from '@/lib/utils'

interface GameHistory {
  id: string
  game_type: string
  score: number
  accuracy: number
  played_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchGameHistory()
    }
  }, [user, authLoading, router])

  const fetchGameHistory = async () => {
    try {
      const { data, error } = await createClient()
        .from('game_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('played_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setGameHistory(data || [])
    } catch (error) {
      console.error('Error fetching game history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const currentLevel = profile.level
  const currentXP = profile.xp
  const nextLevelXP = calculateXPForNextLevel(currentLevel)
  const xpProgress = (currentXP / nextLevelXP) * 100

  const stats = [
    {
      label: 'Tổng điểm',
      value: formatScore(profile.total_score),
      icon: Trophy,
      color: 'text-yellow-500',
    },
    {
      label: 'Số game đã chơi',
      value: profile.total_games.toString(),
      icon: Gamepad2,
      color: 'text-blue-500',
    },
    {
      label: 'Độ chính xác',
      value:
        profile.total_questions_answered > 0
          ? `${Math.round((profile.total_correct_answers / profile.total_questions_answered) * 100)}%`
          : '0%',
      icon: Target,
      color: 'text-green-500',
    },
    {
      label: 'Streak hiện tại',
      value: profile.current_streak.toString(),
      icon: Flame,
      color: 'text-orange-500',
    },
  ]

  const gameTypeNames: Record<string, string> = {
    quiz_race: 'Quiz Race',
    time_battle: 'Time Battle',
    literary_map: 'Literary Map',
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-2xl font-bold text-white">
                    {profile.display_name[0].toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{profile.display_name}</CardTitle>
                    <CardDescription>@{profile.username}</CardDescription>
                    <div className="mt-2 flex items-center space-x-2">
                      <Badge className={getBadgeColor(profile.badge)}>{profile.badge}</Badge>
                      <span className="text-sm font-semibold text-primary">
                        Level {currentLevel}
                      </span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => router.push('/games')}>
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  Chơi ngay
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>XP: {formatScore(currentXP)} / {formatScore(nextLevelXP)}</span>
                  <span className="text-muted-foreground">{Math.round(xpProgress)}%</span>
                </div>
                <Progress value={xpProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Còn {formatScore(nextLevelXP - currentXP)} XP để lên level {currentLevel + 1}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Recent Games */}
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử chơi gần đây</CardTitle>
                <CardDescription>10 game gần nhất của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {gameHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có lịch sử chơi game</p>
                    <Button onClick={() => router.push('/games')} className="mt-4">
                      Chơi game đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gameHistory.map((game) => (
                      <div
                        key={game.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Gamepad2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {gameTypeNames[game.game_type] || game.game_type}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(game.played_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatScore(game.score)} điểm</p>
                          <p className="text-sm text-muted-foreground">{game.accuracy}% đúng</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Thành tích</CardTitle>
                <CardDescription>Huy hiệu và thành tựu của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Tính năng đang được phát triển</p>
                  <p className="text-sm text-muted-foreground">
                    Chơi nhiều game để mở khóa các thành tích đặc biệt!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}