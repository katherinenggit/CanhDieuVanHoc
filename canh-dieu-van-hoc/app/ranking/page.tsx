'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { getBadgeColor } from '@/lib/utils'
import { Trophy, Medal, Crown, Loader2, TrendingUp } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  username: string
  avatar_url: string | null
  badge: string
  score: number
  total_games: number
  accuracy: number
}

export default function RankingPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [totalLeaderboard, setTotalLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'total'>('weekly')

  useEffect(() => {
    loadLeaderboards()
  }, [])

  const loadLeaderboards = async () => {
    try {
      // Weekly leaderboard
      const { data: weekly } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, badge, weekly_score, total_games, total_correct_answers, total_questions_answered')
        .order('weekly_score', { ascending: false })
        .limit(50)

      // Monthly leaderboard
      const { data: monthly } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, badge, monthly_score, total_games, total_correct_answers, total_questions_answered')
        .order('monthly_score', { ascending: false })
        .limit(50)

      // Total leaderboard
      const { data: total } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, badge, total_score, total_games, total_correct_answers, total_questions_answered')
        .order('total_score', { ascending: false })
        .limit(50)

      // Format data
      setWeeklyLeaderboard(
        (weekly || []).map((entry, index) => ({
          rank: index + 1,
          user_id: entry.id,
          display_name: entry.display_name,
          username: entry.username,
          avatar_url: entry.avatar_url,
          badge: entry.badge,
          score: entry.weekly_score || 0,
          total_games: entry.total_games || 0,
          accuracy: entry.total_questions_answered > 0
            ? Math.round((entry.total_correct_answers / entry.total_questions_answered) * 100)
            : 0
        }))
      )

      setMonthlyLeaderboard(
        (monthly || []).map((entry, index) => ({
          rank: index + 1,
          user_id: entry.id,
          display_name: entry.display_name,
          username: entry.username,
          avatar_url: entry.avatar_url,
          badge: entry.badge,
          score: entry.monthly_score || 0,
          total_games: entry.total_games || 0,
          accuracy: entry.total_questions_answered > 0
            ? Math.round((entry.total_correct_answers / entry.total_questions_answered) * 100)
            : 0
        }))
      )

      setTotalLeaderboard(
        (total || []).map((entry, index) => ({
          rank: index + 1,
          user_id: entry.id,
          display_name: entry.display_name,
          username: entry.username,
          avatar_url: entry.avatar_url,
          badge: entry.badge,
          score: entry.total_score || 0,
          total_games: entry.total_games || 0,
          accuracy: entry.total_questions_answered > 0
            ? Math.round((entry.total_correct_answers / entry.total_questions_answered) * 100)
            : 0
        }))
      )
    } catch (error) {
      console.error('Error loading leaderboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />
    return null
  }

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600'
    return 'bg-gray-100'
  }

  const renderLeaderboard = (data: LeaderboardEntry[]) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có dữ liệu xếp hạng</p>
        </div>
      )
    }

    // Top 3
    const topThree = data.slice(0, 3)
    // Rest
    const rest = data.slice(3, 50)

    return (
      <>
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-3">
                <Avatar className="h-16 w-16 border-4 border-gray-400">
                  <AvatarImage src={topThree[1].avatar_url || ''} />
                  <AvatarFallback>{topThree[1].display_name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-gray-400 rounded-full p-1">
                  <Medal className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="font-bold text-sm truncate max-w-full">{topThree[1].display_name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-full">@{topThree[1].username}</p>
              <Badge className={`mt-2 text-yellow-600 ${getBadgeColor(topThree[1].badge)}`}>
                {topThree[1].badge}
              </Badge>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-600">{topThree[1].score.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">điểm</p>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <Avatar className="h-20 w-20 border-4 border-yellow-500 ring-4 ring-yellow-200">
                  <AvatarImage src={topThree[0].avatar_url || ''} />
                  <AvatarFallback>{topThree[0].display_name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <p className="font-bold truncate max-w-full">{topThree[0].display_name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-full">@{topThree[0].username}</p>
              <Badge className={`mt-2 text-red-600 ${getBadgeColor(topThree[0].badge)}`}>
                {topThree[0].badge}
              </Badge>
              <div className="mt-3 text-center">
                <p className="text-3xl font-bold text-yellow-600">{topThree[0].score.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">điểm</p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="flex flex-col items-center pt-12">
              <div className="relative mb-3">
                <Avatar className="h-14 w-14 border-4 border-orange-600">
                  <AvatarImage src={topThree[2].avatar_url || ''} />
                  <AvatarFallback>{topThree[2].display_name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-orange-600 rounded-full p-1">
                  <Medal className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="font-bold text-sm truncate max-w-full">{topThree[2].display_name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-full">@{topThree[2].username}</p>
              <Badge className={`mt-2 text-orange-600 ${getBadgeColor(topThree[2].badge)}`}>
                {topThree[2].badge}
              </Badge>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{topThree[2].score.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">điểm</p>
              </div>
            </div>
          )}
        </div>

        {/* Rest of rankings */}
        <div className="space-y-2">
          {rest.map((entry) => (
            <Card
              key={entry.user_id}
              className={`transition-all hover:shadow-md ${
                entry.user_id === user?.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 font-bold text-lg">
                    #{entry.rank}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={entry.avatar_url || ''} />
                    <AvatarFallback>{entry.display_name[0]}</AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{entry.display_name}</p>
                      {entry.user_id === user?.id && (
                        <Badge variant="outline" className="text-xs">Bạn</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">@{entry.username}</p>
                  </div>

                  {/* Badge */}
                  <Badge className={getBadgeColor(entry.badge)}>
                    {entry.badge}
                  </Badge>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-xl font-bold">{entry.score.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.total_games} trận • {entry.accuracy}% đúng
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-[#FDF2F4] py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-10 w-10 text-yellow-500" />
              <h1 className="text-4xl font-bold">Bảng Xếp Hạng</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Top người chơi xuất sắc nhất
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-1 mb-8">
              <TabsTrigger value="total">
                <Trophy className="h-4 w-4 mr-2" />
                Tổng
              </TabsTrigger>
            </TabsList>
            

            <TabsContent value="total">
              <Card>
                <CardHeader>
                  <CardTitle>Xếp hạng tổng</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderLeaderboard(totalLeaderboard)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}