'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { Trophy, TrendingUp, Medal, Loader2 } from 'lucide-react'
import { formatScore, getBadgeColor } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  display_name: string
  username: string
  avatar_url: string | null
  total_score: number
  level: number
  badge: string
  total_games: number
  total_correct_answers: number
  total_questions_answered: number
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [globalLeaders, setGlobalLeaders] = useState<LeaderboardEntry[]>([])
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  const fetchLeaderboards = async () => {
    try {
      // Fetch global leaderboard
      const { data: global, error: globalError } = await createClient()
        .from('profiles')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(100)

      if (globalError) throw globalError
      setGlobalLeaders(global || [])

      // Fetch weekly leaderboard
      const { data: weekly, error: weeklyError } = await createClient()
        .from('profiles')
        .select('*')
        .order('weekly_score', { ascending: false })
        .limit(100)

      if (weeklyError) throw weeklyError
      setWeeklyLeaders(weekly || [])
    } catch (error) {
      console.error('Error fetching leaderboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderPodium = (leaders: LeaderboardEntry[]) => {
    const top3 = leaders.slice(0, 3)
    if (top3.length === 0) return null

    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
    const heights = ['h-32', 'h-40', 'h-24']
    const colors = ['bg-gray-400', 'bg-yellow-400', 'bg-orange-400']
    const ranks = ['2nd', '1st', '3rd']

    return (
      <div className="flex items-end justify-center gap-4 mb-12">
        {podiumOrder.map((leader, index) => {
          if (!leader) return null
          const actualRank = index === 1 ? 0 : index === 0 ? 1 : 2

          return (
            <div key={leader.id} className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={leader.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl font-bold">
                    {leader.display_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${colors[index]} flex items-center justify-center border-2 border-white`}>
                  <span className="text-xs font-bold text-white">{actualRank + 1}</span>
                </div>
              </div>
              <div className="text-center mb-2">
                <p className="font-semibold">{leader.display_name}</p>
                <p className="text-sm text-muted-foreground">@{leader.username}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {formatScore(leader.total_score)}
                </p>
              </div>
              <div className={`${heights[index]} w-32 ${colors[index]} rounded-t-xl flex items-center justify-center`}>
                <span className="text-white font-bold text-xl">{ranks[index]}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderLeaderboardTable = (leaders: LeaderboardEntry[], startRank: number = 4) => {
    const tableLeaders = leaders.slice(3)
    
    if (tableLeaders.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có dữ liệu xếp hạng</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {tableLeaders.map((leader, index) => {
          const rank = startRank + index
          const accuracy = leader.total_questions_answered > 0
            ? Math.round((leader.total_correct_answers / leader.total_questions_answered) * 100)
            : 0

          return (
            <div
              key={leader.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-center font-bold text-muted-foreground">
                  #{rank}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={leader.avatar_url || undefined} />
                  <AvatarFallback>
                    {leader.display_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{leader.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{leader.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold">{formatScore(leader.total_score)}</p>
                  <p className="text-xs text-muted-foreground">{leader.total_games} games</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{accuracy}%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
                <Badge className={getBadgeColor(leader.badge)}>
                  Lv.{leader.level}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Bảng xếp hạng</h1>
            <p className="text-lg text-muted-foreground">
              Top người chơi xuất sắc nhất
            </p>
          </div>

          <Tabs defaultValue="global" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="global">
                <Trophy className="h-4 w-4 mr-2" />
                Toàn cầu
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <TrendingUp className="h-4 w-4 mr-2" />
                Tuần này
              </TabsTrigger>
              <TabsTrigger value="monthly" disabled>
                <Medal className="h-4 w-4 mr-2" />
                Tháng này
              </TabsTrigger>
            </TabsList>

            <TabsContent value="global">
              <Card>
                <CardHeader>
                  <CardTitle>Top 100 Toàn cầu</CardTitle>
                  <CardDescription>Xếp hạng dựa trên tổng điểm tích lũy</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderPodium(globalLeaders)}
                  {renderLeaderboardTable(globalLeaders)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly">
              <Card>
                <CardHeader>
                  <CardTitle>Top 100 Tuần này</CardTitle>
                  <CardDescription>Xếp hạng dựa trên điểm tuần này</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderPodium(weeklyLeaders)}
                  {renderLeaderboardTable(weeklyLeaders)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}