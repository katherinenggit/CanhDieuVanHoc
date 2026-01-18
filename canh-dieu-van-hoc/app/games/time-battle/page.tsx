'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import { generateRoomCode } from '@/lib/utils'

interface LiteraryWork {
  id: string
  title: string
  author: string
  genre: string
}

export default function TimeBattleSetupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient() // Khởi tạo client một lần
  
  const [works, setWorks] = useState<LiteraryWork[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedWorks, setSelectedWorks] = useState<string[]>([])
  const [settings, setSettings] = useState({
    questionCount: 15,
    difficulty: 'Hỗn hợp' as 'Dễ' | 'Trung bình' | 'Khó' | 'Hỗn hợp',
    maxPlayers: 100,
    isPublic: true,
  })

  // Hàm tải danh sách tác phẩm
  const fetchWorks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('literary_works')
        .select('id, title, author, genre')
        .order('title')

      if (error) throw error
      setWorks(data || [])
    } catch (error) {
      console.error('Error fetching works:', error)
      toast.error('Không thể tải danh sách tác phẩm.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchWorks()
    }
  }, [authLoading, user, router, fetchWorks])

  const toggleWork = (workId: string) => {
    setSelectedWorks((prev) =>
      prev.includes(workId) ? prev.filter((id) => id !== workId) : [...prev, workId]
    )
  }

  const handleCreateRoom = async () => {
    if (selectedWorks.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tác phẩm.')
      return
    }

    setCreating(true)

    try {
      const roomCode = generateRoomCode()

      // Tạo session game
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          room_code: roomCode,
          created_by: user!.id,
          game_mode: 'competition',
          game_type: 'time_battle',
          competition_type: 'direct',
          settings: {
            workIds: selectedWorks,
            questionCount: settings.questionCount,
            difficulty: settings.difficulty,
            maxPlayers: settings.maxPlayers,
            duration: 120,
          },
          status: 'waiting',
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      toast.success(`Phòng đã được tạo! Mã: ${roomCode}`)
      router.push(`/games/time-battle/lobby/${session.id}`)
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Không thể tạo phòng. Vui lòng thử lại.')
    } finally {
      setCreating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-500 mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Time Battle</h1>
            <p className="text-lg text-muted-foreground">
              Đấu trường thời gian 2 phút - Ai nhanh, ai thắng!
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt phòng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="questionCount">Số câu hỏi (1-100)</Label>
                    <Input
                      id="questionCount"
                      type="number"
                      min={1}
                      max={100}
                      value={settings.questionCount}
                      onChange={(e) =>
                        setSettings({ ...settings, questionCount: Math.min(100, Math.max(1, parseInt(e.target.value) )) || 20 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Độ khó</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Dễ', 'Trung bình', 'Khó', 'Hỗn hợp'] as const).map((diff) => (
                        <Button
                          key={diff}
                          type="button"
                          variant={settings.difficulty === diff ? 'default' : 'outline'}
                          onClick={() => setSettings({ ...settings, difficulty: diff })}
                          size="sm"
                        >
                          {diff}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPlayers">Số người chơi (1-100)</Label>
                    <Input
                      id="maxPlayers"
                      type="number"
                      min={1}
                      max={100}
                      value={settings.maxPlayers}
                      onChange={(e) =>
                        setSettings({ ...settings, maxPlayers: parseInt(e.target.value) || 50})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPublic">Phòng công khai</Label>
                    <Switch
                      id="isPublic"
                      checked={settings.isPublic}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, isPublic: checked })
                      }
                    />
                  </div>

                  <Button onClick={handleCreateRoom} className="w-full" size="lg" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-5 w-5" />
                        Tạo phòng
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Chọn tác phẩm</CardTitle>
                  <CardDescription>
                    Đã chọn: {selectedWorks.length} / {works.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {works.length > 0 ? (
                      works.map((work) => {
                        const isSelected = selectedWorks.includes(work.id)
                        return (
                          <div
                            key={work.id}
                            onClick={() => toggleWork(work.id)}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                              isSelected
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{work.title}</h3>
                                <p className="text-sm text-muted-foreground">{work.author}</p>
                              </div>
                              <Badge variant={isSelected ? 'default' : 'secondary'}>
                                {work.genre}
                              </Badge>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Không có tác phẩm nào.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}