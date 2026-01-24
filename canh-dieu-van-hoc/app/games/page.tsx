'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/Navbar'
import { Zap, Clock, Map, Trophy, Users, Play } from 'lucide-react'

// Thêm các import này vào đầu file
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, LogIn, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const games = [
  {
    id: 'quiz-race',
    title: 'Quiz Race',
    description: 'Trả lời câu hỏi',
    icon: Zap,
    //r-t-[#C2A68C]
    color: 'from-[#7AA874] to-[#7AA874]',
    features: [
      'Streak bonus: x1.5, x2 điểm',
      'Power-ups: 50/50, Time Freeze',
      'Chế độ: Cá nhân',
    ],
    href: '/games/quiz-race',
  },
  {
    id: 'time-battle',
    title: 'Time Battle',
    description: 'Đấu trường thời gian',
    icon: Clock,
    color: 'from-[#7AA874] to-[#7AA874]',
    features: [
    //  'Real-time multiplayer',
      'Trả lời đúng & nhanh để thắng',
      'Bảng xếp hạng trực tiếp',
      'Chế độ: Cá nhân & Thi đấu',
    ],
    href: '/games/time-battle',
    comingSoon: false,
  },
  //{
  //  id: 'literary-map',
  //  title: 'Literary Map',
   // description: 'Hành trình khám phá 15 phút',
  //  icon: Map,
  //  color: 'from-green-500 to-emerald-500',
   // features: [
    //  'Bản đồ với nhiều địa hình',
   //   'Hệ thống trái tim & năng lượng',
    //  'Chìa khóa văn học & power-ups',
    //  'Chế độ: Cá nhân & Thi đấu',
    //],
   // href: '/games/literary-map',
   // comingSoon: false,
  //},
]

export default function GamesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [publicRooms, setPublicRooms] = useState<any[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [joining, setJoining] = useState(false)
  // Logic lấy danh sách phòng từ Supabase
  const fetchPublicRooms = useCallback(async () => {
    setLoadingRooms(true)
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*, profiles:created_by(display_name)')
      .eq('game_mode', 'competition')
      .eq('status', 'waiting')
      .eq('competition_type', 'direct')
      .order('created_at', { ascending: false })
    
    if (!error) setPublicRooms(data || [])
    setLoadingRooms(false)
  }, [supabase])

  useEffect(() => {
    fetchPublicRooms()
  }, [fetchPublicRooms])

  // Logic xử lý vào phòng
  const handleJoinRoom = async (code?: string) => {
    const targetCode = code || roomCodeInput.trim().toUpperCase()
    if (!targetCode) return toast.error('Vui lòng nhập mã phòng')
    
    setJoining(true)
    const { data: session, error } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('room_code', targetCode)
      .eq('status', 'waiting')
      .single()

    if (session) {
      router.push(`/games/time-battle/lobby/${session?.id}`)
    } else {
      toast.error('Phòng không tồn tại hoặc đã bắt đầu')
    }
    setJoining(false)
  }
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-[#FDF2F4] py-12">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Chọn trò chơi</h1>
            <p className="text-lg text-muted-foreground">
              2 chế độ chơi khác nhau để ôn tập văn học
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto">
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
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary mr-2" />
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
        game.id === 'quiz-race' ? 'bg-[#7AA874] hover:[#835151]' :
        game.id === 'time-battle' ? 'bg-[#7AA874] hover:[#835151]' :
        'bg-emerald-600 hover:bg-emerald-700'
      }`}
    >
      <Play className="mr-2 h-5 w-5 " />
      Chơi ngay
    </Button>
  </Link>
)}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Public Games Section - PHẦN ĐÃ CHỈNH SỬA */}
          <div className="mt-16 max-w-6xl mx-auto border-t pt-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Tham gia đấu trường</h2>
              <p className="text-muted-foreground">Vào phòng bằng mã hoặc chọn các phòng đang mở</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Cột 1: Nhập ID phòng */}
              <Card className="border-2 border-primary/20 shadow-md h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LogIn className="h-5 w-5 text-primary" />
                    Vào phòng nhanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="MÃ PHÒNG (VD: ABCD)" 
                    className="text-center font-mono font-bold text-xl uppercase tracking-widest h-12"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                  />
                  <Button 
                    className="w-full h-12 text-lg font-bold" 
                    onClick={() => handleJoinRoom()}
                    disabled={joining}
                  >
                    {joining ? <Loader2 className="animate-spin mr-2" /> : 'VÀO CHƠI'}
                  </Button>
                </CardContent>
              </Card>

              {/* Cột 2 & 3: Danh sách phòng công khai */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Phòng đang chờ ({publicRooms.length})
                  </span>
                  <Button variant="ghost" size="sm" onClick={fetchPublicRooms} className="h-8">
                    <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
                  </Button>
                </div>

                <div className="grid gap-3 overflow-y-auto max-h-[400px] pr-2">
                  {loadingRooms ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                    </div>
                  ) : publicRooms.length > 0 ? (
                    publicRooms.map((room) => (
                      <Card key={room.id} className="hover:border-primary/50 transition-colors shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-black text-primary font-mono">{room.room_code}</span>
                              <Badge className="bg-secondary/80 hover:bg-secondary">ĐANG CHỜ</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Chủ phòng: <span className="text-foreground font-medium">{room.profiles?.display_name || 'Học sĩ'}</span>
                            </p>
                          </div>
                          <Button variant="secondary" onClick={() => handleJoinRoom(room.room_code)}>
                            THAM GIA
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="py-16 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Hiện không có phòng nào đang mở công khai.</p>
                        <p className="text-sm">Hãy tự tạo phòng và chia sẻ mã cho bạn bè!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}