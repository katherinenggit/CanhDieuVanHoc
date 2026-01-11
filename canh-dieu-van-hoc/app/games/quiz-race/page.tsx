'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client' 
import { Loader2, Play, Users, User, BookOpen, Layers, Zap } from 'lucide-react'
import { toast } from 'sonner' 

interface LiteraryWork {
  id: string
  title: string
  author: string
  question_count: number
}

export default function QuizRaceSetupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient() 
  
  const [works, setWorks] = useState<LiteraryWork[]>([])
  const [loading, setLoading] = useState(true)
  
  // States cho tùy chỉnh
  const [gameMode, setGameMode] = useState<'solo'>('solo')
  const [selectedWorks, setSelectedWorks] = useState<string[]>([])
  const [settings, setSettings] = useState({
    questionCount: 15,
    difficulty: 'Hỗn hợp' as 'Dễ' | 'Trung bình' | 'Khó' | 'Hỗn hợp',
  })


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    fetchWorks()
  }, [authLoading, user, router])

  const fetchWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('literary_works')
        .select('id, title, author, question_count')
        .order('title')

      if (error) throw error
      setWorks(data || [])
    } catch (error: any) {
      toast.error('Không thể tải danh sách tác phẩm.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (id: string, type: 'work' ) => {
    if (type === 'work') {
      setSelectedWorks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    } 
  }

  const handleStartGame = () => {
    if (selectedWorks.length === 0 ) {
      toast.error('Vui lòng chọn ít nhất một tác phẩm .')
      return
    }

    const params = new URLSearchParams({
      mode: gameMode,
      works: selectedWorks.join(','),
      count: settings.questionCount.toString(),
      difficulty: settings.difficulty,
    })

    router.push(`/games/quiz-race/play?${params.toString()}`)
  }

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <Zap className="text-yellow-500 fill-yellow-500" /> Quiz Race Setup
            </h1>
            <p className="text-muted-foreground">Tùy chỉnh bộ câu hỏi trước khi bắt đầu cuộc đua</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Panel bên trái: Chế độ & Thông số */}
            <div className="space-y-6">
        

              <Card>
                <CardHeader><CardTitle className="text-lg">Tùy chọn câu hỏi</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Số câu hỏi (5-50)</Label>
                    <Input 
                      type="number" 
                      value={settings.questionCount} 
                      onChange={(e) => setSettings({...settings, questionCount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Độ khó</Label>
                    <select 
                      className="w-full p-2 border rounded-md text-sm"
                      value={settings.difficulty}
                      onChange={(e: any) => setSettings({...settings, difficulty: e.target.value})}
                    >
                      <option value="Hỗn hợp">Hỗn hợp kiến thức</option>
                      <option value="Dễ">Cơ bản (Dễ)</option>
                      <option value="Trung bình">Thông hiểu (Vừa)</option>
                      <option value="Khó">Vận dụng (Khó)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleStartGame} className="w-full py-6 text-lg font-bold shadow-lg bg-blue-600 hover:bg-blue-700">
                <Play className="mr-2 fill-current" /> BẮT ĐẦU ĐUA
              </Button>
            </div>

            {/* Panel bên phải: Bộ lọc tác phẩm/thể loại */}
            <div className="md:col-span-2 space-y-6">
                            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-500" /> Chọn theo Tác phẩm
                  </CardTitle>
                  <CardDescription>Bạn có thể chọn nhiều tác phẩm cùng lúc</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {works.map((work) => (
                      <div
                        key={work.id}
                        onClick={() => toggleSelection(work.id, 'work')}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedWorks.includes(work.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <p className="font-semibold text-sm line-clamp-1">{work.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{work.author}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] font-medium text-blue-600">{work.question_count} câu</span>
                        </div>
                      </div>
                    ))}
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