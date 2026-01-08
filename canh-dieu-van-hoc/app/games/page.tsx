'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/Navbar'
import { Zap, Clock, Map, Trophy, Users, Play } from 'lucide-react'

const games = [
  {
    id: 'quiz-race',
    title: 'Quiz Race',
    description: 'Trả lời câu hỏi nhanh nhất có thể',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Streak bonus: x1.5, x2 điểm',
      'Power-ups: 50/50, Time Freeze',
      'Chế độ: Cá nhân & Thi đấu',
    ],
    href: '/games/quiz-race',
  },
  {
    id: 'time-battle',
    title: 'Time Battle',
    description: 'Đấu trường thời gian 2 phút',
    icon: Clock,
    color: 'from-red-500 to-orange-500',
    features: [
      'Real-time multiplayer',
      'Trả lời đúng & nhanh để thắng',
      'Live leaderboard',
    ],
    href: '/games/time-battle',
    comingSoon: false,
  },
  {
    id: 'literary-map',
    title: 'Literary Map',
    description: 'Hành trình khám phá 15 phút',
    icon: Map,
    color: 'from-green-500 to-emerald-500',
    features: [
      'Bản đồ với nhiều địa hình',
      'Hệ thống trái tim & năng lượng',
      'Chìa khóa văn học & power-ups',
    ],
    href: '/games/literary-map',
    comingSoon: false,
  },
]

export default function GamesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Chọn trò chơi</h1>
            <p className="text-lg text-muted-foreground">
              3 chế độ chơi khác nhau để ôn tập văn học
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {games.map((game) => {
              const Icon = game.icon
              return (
                <Card key={game.id} className="relative overflow-hidden hover:shadow-xl transition-shadow">
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${game.color}`} />
                  
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${game.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{game.title}</CardTitle>
                    <CardDescription className="text-base">{game.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {game.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {game.comingSoon ? (
  <Button disabled className="w-full" size="lg">
    Sắp ra mắt
  </Button>
) : (
  <Link href={game.href} className="w-full">
    <Button 
      size="lg"
      className={`w-full font-bold transition-all hover:scale-[1.02] active:scale-95 ${
        game.id === 'quiz-race' ? 'bg-orange-600 hover:bg-orange-700' :
        game.id === 'time-battle' ? 'bg-red-600 hover:bg-red-700' :
        'bg-emerald-600 hover:bg-emerald-700'
      }`}
    >
      <Play className="mr-2 h-5 w-5" />
      Chơi ngay
    </Button>
  </Link>
)}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Public Games Section */}
          <div className="mt-16 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Phòng công khai</h2>
                <p className="text-muted-foreground">Tham gia các game do người dùng khác tạo</p>
              </div>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Tạo phòng
              </Button>
            </div>

            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có phòng công khai nào</p>
                  <p className="text-sm mt-2">Tạo phòng đầu tiên để mời bạn bè thi đấu!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}