'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client' // Đảm bảo import đúng
import { Loader2, Copy, Users, Play, Crown, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface GameSession {
  id: string
  room_code: string
  created_by: string
  settings: any
  status: string
}

interface Participant {
  id: string
  player_id: string
  joined_at: string
  profiles: {
    display_name: string
    username: string
    avatar_url: string | null
    level: number
  }
}

export default function TimeBattleLobbyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient() // THÊM DÒNG NÀY ĐỂ FIX LỖI SUPABASE UNDEFINED

  const [session, setSession] = useState<GameSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const initLobby = async () => {
        await fetchSession()
        await joinRoom() // Phải có dòng này thì khách mới được lưu vào DB
      }
      initLobby()
  
      const unsubscribe = subscribeToParticipants()
      return () => {
        unsubscribe()
      }
    }
  }, [params.id, user])

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setSession(data)

      fetchParticipants()
    } catch (error) {
      console.error('Error fetching session:', error)
      toast.error('Lỗi: Không tìm thấy phòng game.') // FIX TOAST
      router.push('/games/time-battle')
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('game_participants')
        .select(`
          id,
          player_id,
          joined_at,
          profiles:player_id (
            display_name,
            username,
            avatar_url,
            level
          )
        `)
        .eq('session_id', params.id)
        .order('joined_at', { ascending: true })

      if (error) throw error
      setParticipants(data as any || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }
// Thêm hàm này bên dưới fetchParticipants
const joinRoom = async () => {
  if (!user || !params.id) return

  try {
    // Kiểm tra xem đã tham gia chưa để tránh duplicate
    const { data: existing, error: checkError } = await supabase
      .from('game_participants')
      .select('id')
      .eq('session_id', params.id)
      .eq('player_id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase
        .from('game_participants')
        .insert({
          session_id: params.id,
          player_id: user.id,
          score: 0,
          correct_count: 0
        })
      
      if (error) {
        console.error("Lỗi join room:", error)
        // Nếu lỗi RLS hoặc bảng thiếu cột, nó sẽ báo ở đây
      }
    }
  } catch (err) {
    console.error("Join room error:", err)
  }
}

  const handleLeaveRoom = async () => {
    if (!session || !user) return;
  
    try {
      // Nếu là chủ phòng (host)
      if (session.created_by === user.id) {
        // Cập nhật status phòng thành 'finished' để đóng phòng hoàn toàn
        const { error } = await supabase
          .from('game_sessions')
          .update({ status: 'finished' })
          .eq('id', session.id);
  
        if (error) throw error;
        toast.success('Bạn đã đóng phòng game.');
      } else {
        // Nếu là người chơi bình thường, chỉ xóa mình ra khỏi danh sách tham gia
        await supabase
          .from('game_participants')
          .delete()
          .eq('session_id', session.id)
          .eq('player_id', user.id);
        
        toast.info('Bạn đã rời khỏi phòng.');
      }
  
      // Sau khi xử lý xong ở DB thì chuyển hướng về trang games
      router.push('/games/time-battle');
    } catch (error) {
      console.error('Lỗi khi rời phòng:', error);
      router.push('/games/time-battle');
    }
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`lobby-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_participants',
          filter: `session_id=eq.${params.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as GameSession
    console.log("Session vừa cập nhật:", updatedSession.status) // Thêm dòng này để debug
 //         fetchParticipants() // Gọi lại hàm để đồng bộ danh sách
 if (updatedSession.status === 'playing') {
  router.push(`/games/time-battle/play/${params.id}`)
}else {
  toast.success('Trận đấu đã bắt đầu, bạn đang theo dõi phòng.')}

        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as GameSession
          // Nếu chủ phòng bắt đầu game
          if (updatedSession.status === 'playing') {
            router.push(`/games/time-battle/play/${params.id}`)
          }
          // Nếu chủ phòng đóng phòng (status thành finished)
        if (updatedSession.status === 'finished') {
          toast.error('Chủ phòng đã đóng phòng này.');
          router.push('/games/time-battle');
        }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleCopyRoomCode = () => {
    if (session) {
      navigator.clipboard.writeText(session.room_code)
      toast.success(`Đã copy mã phòng: ${session.room_code}`) // FIX TOAST
    }
  }

  const handleStartGame = async () => {
    if (participants.length < 0) {
      toast.error('Chưa đủ người chơi: Cần ít nhất 2 người để bắt đầu.') // FIX TOAST
      return
    }

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'playing',
          started_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error
      toast.success('Đang bắt đầu trò chơi...')
      router.push(`/games/time-battle/play/${params.id}`)
    } catch (error) {
      console.error('Error starting game:', error)
      toast.error('Lỗi: Không thể bắt đầu game.') // FIX TOAST
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) return null

  const isHost = session.created_by === user?.id
  const maxPlayers = session.settings?.maxPlayers

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-red-700 p-4">
      {/* Giữ nguyên phần Return UI của bạn vì nó đã khá đẹp rồi */}
      <div className="container mx-auto max-w-4xl py-8">
         {/* ... (Các nội dung UI của bạn) ... */}
         {/* Đảm bảo các nút bấm và hiển thị vẫn giữ nguyên */}
         <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Phòng chờ</h1>
          <p className="text-white/80">Đang chờ người chơi tham gia...</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Mã phòng</p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-4xl font-bold tracking-wider bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  {session.room_code}
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyRoomCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danh sách người chơi */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Người chơi ({participants.length}/{maxPlayers})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={participant.profiles.avatar_url || undefined} />
                      <AvatarFallback>{participant.profiles.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{participant.profiles.display_name}</p>
                      <p className="text-sm text-muted-foreground">Level {participant.profiles.level}</p>
                    </div>
                  </div>
                  {participant.player_id === session.created_by && <Crown className="h-5 w-5 text-yellow-500" />}
                </div>
              ))}
             </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
        <Button variant="outline" className="flex-1 bg-white" onClick={handleLeaveRoom}>
  Rời phòng
</Button>
          {isHost ? (
            <Button className="flex-1 bg-white text-red-600 hover:bg-white/90" size="lg" onClick={handleStartGame}>
              Bắt đầu
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white italic">
              Đợi chủ phòng bắt đầu...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}