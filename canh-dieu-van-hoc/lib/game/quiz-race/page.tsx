'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Play } from 'lucide-react'
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
  const [selectedWorks, setSelectedWorks] = useState<string[]>([])
  const [settings, setSettings] = useState({
    questionCount: 10,
    difficulty: 'Hỗn hợp' as 'Dễ' | 'Trung bình' | 'Khó' | 'Hỗn hợp',
    timeLimit: true,
    timePerQuestion: 30,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchWorks()
    }
  }, [authLoading, user, router])

 // 2. Cập nhật hàm fetchWorks để lấy thêm số lượng câu hỏi
const fetchWorks = async () => {
  try {
    const { data, error } = await supabase // Sử dụng biến supabase đã tạo ở trên
      .from('literary_works')
      .select('id, title, author, question_count') // Lấy thêm cột này
      .order('title')

    if (error) throw error
    setWorks(data || [])
  } catch (error: any) {
    console.error('Error fetching works:', error)
    toast.error('Không thể tải danh sách tác phẩm.')
  } finally {
    setLoading(false)
  }
}

  const toggleWork = (workId: string) => {
    setSelectedWorks((prev) =>
      prev.includes(workId) ? prev.filter((id) => id !== workId) : [...prev, workId]
    )
  }

  const handleStartGame = () => {
    if (selectedWorks.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tác phẩm để bắt đầu.')
      return
    }

    if (settings.questionCount < 2 || settings.questionCount > 50) {
      toast.error('Số câu hỏi phải từ 2 đến 50.')
      return
    }

    const params = new URLSearchParams({
      works: selectedWorks.join(','),
      count: settings.questionCount.toString(),
      difficulty: settings.difficulty,
      timeLimit: settings.timeLimit.toString(),
      timePerQuestion: settings.timePerQuestion.toString(),
    })

    router.push(`/games/quiz-race/play?${params.toString()}`)
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
            <h1 className="text-4xl font-bold mb-2">Quiz Race</h1>
            <p className="text-lg text-muted-foreground">
              Trả lời câu hỏi nhanh nhất có thể để ghi điểm cao
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="questionCount">Số câu hỏi (2-50)</Label>
                    <Input
                      id="questionCount"
                      type="number"
                      min={2}
                      max={50}
                      value={settings.questionCount}
                      onChange={(e) =>
                        setSettings({ ...settings, questionCount: parseInt(e.target.value) || 10 })
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
                          className="w-full text-xs"
                        >
                          {diff}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="timeLimit">Giới hạn thời gian</Label>
                    <Switch
                      id="timeLimit"
                      checked={settings.timeLimit}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, timeLimit: checked })
                      }
                    />
                  </div>

                  {settings.timeLimit && (
                    <div className="space-y-2">
                      <Label htmlFor="timePerQuestion">Thời gian/câu (giây)</Label>
                      <Input
                        id="timePerQuestion"
                        type="number"
                        min={15}
                        max={60}
                        value={settings.timePerQuestion}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            timePerQuestion: parseInt(e.target.value) || 30,
                          })
                        }
                      />
                    </div>
                  )}

                  <Button onClick={handleStartGame} className="w-full" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Bắt đầu chơi
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Chọn tác phẩm</CardTitle>
                  <CardDescription>
                    Đã chọn: {selectedWorks.length} / {works.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {works.length === 0 ? (
                      <p className="text-center text-muted-foreground py-10">Không có tác phẩm nào.</p>
                    ) : (
                      works.map((work) => {
                        const isSelected = selectedWorks.includes(work.id)
                        return (
                          <div
                            key={work.id}
                            onClick={() => toggleWork(work.id)}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-sm ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                            // Tìm đoạn render danh sách tác phẩm và sửa phần hiển thị author/count
<div className="flex-1">
  <h3 className="font-semibold text-sm">{work.title}</h3>
  <p className="text-xs text-muted-foreground">
    {work.author} • <span className="font-medium text-primary">{work.question_count || 0} câu</span>
  </p>
</div>

                            </div>
                          </div>
                        )
                      })
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