'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { Loader2, Map, Heart, Key, Play, Info } from 'lucide-react' // Thêm Info icon
import { createClient } from '@/lib/supabase/client' 
import { toast } from 'sonner'

interface LiteraryWork {
  id: string
  title: string
  author: string
  genre: string
  question_count: number // FIX BUG: Thêm thuộc tính này để TS không báo lỗi
}

export default function LiteraryMapSetupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient() 
  
  const [works, setWorks] = useState<LiteraryWork[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorks, setSelectedWorks] = useState<string[]>([])
  const [questions, setQuestions] = useState<any[]>([]);

  // Trong file play/page.tsx của bạn
const fetchGameQuestions = async () => {
  // 1. Lấy danh sách ID tác phẩm từ URL (ví dụ: ?works=id1,id2,id3)
  const searchParams = new URLSearchParams(window.location.search);
  const workIds = searchParams.get('works')?.split(',') || [];
  const difficulty = searchParams.get('difficulty') || 'Hỗn hợp';

  // 2. Kết nối Supabase để lấy câu hỏi
  let query = supabase
    .from('questions')
    .select('*')
    .in('work_id', workIds); // Lọc câu hỏi thuộc danh sách tác phẩm đã chọn

  // 3. Lọc thêm độ khó nếu không phải "Hỗn hợp"
  if (difficulty !== 'Hỗn hợp') {
    query = query.eq('difficulty', difficulty);
  }

  const { data, error } = await query.limit(30); // Lấy tối đa 30 câu cho 1 hành trình

  if (error) {
    toast.error("Không thể lấy câu hỏi từ máy chủ");
    return;
  }

  // 4. Trộn ngẫu nhiên câu hỏi (Shuffle) để mỗi lần chơi mỗi khác
  const shuffledQuestions = data.sort(() => Math.random() - 0.5);
  setQuestions(shuffledQuestions);
};
  const [settings, setSettings] = useState({
    hearts: 3 as 3 | 5,
    difficulty: 'Hỗn hợp' as 'Dễ' | 'Trung bình' | 'Khó' | 'Hỗn hợp',
  })

  // Tính tổng số câu hỏi từ các tác phẩm đã chọn
  const totalSelectedQuestions = works
    .filter(w => selectedWorks.includes(w.id))
    .reduce((sum, w) => sum + (w.question_count || 0), 0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    fetchWorks()
  }, [authLoading, user, router])

  const fetchWorks = async () => {
    try {
      // THAY ĐỔI: Lấy tất cả tác phẩm có ít nhất 1 câu hỏi (thay vì 30)
      const { data, error } = await supabase
        .from('literary_works')
        .select('id, title, author, genre, question_count')
        .gt('question_count', 0) 
        .order('title')

      if (error) throw error
      setWorks(data || [])
    } catch (error) {
      console.error('Error fetching works:', error)
      toast.error('Lỗi: Không thể tải danh sách tác phẩm.')
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
    // KIỂM TRA ĐIỀU KIỆN MỚI
    if (selectedWorks.length < 2) {
      toast.info('Vui lòng chọn tối thiểu 2 tác phẩm.')
      return
    }
    if (totalSelectedQuestions < 30) {
      toast.error(`Tổng số câu hỏi hiện tại là ${totalSelectedQuestions}. Bạn cần chọn thêm tác phẩm để đạt ít nhất 30 câu.`)
      return
    }

    const params = new URLSearchParams({
      works: selectedWorks.join(','),
      hearts: settings.hearts.toString(),
      difficulty: settings.difficulty,
    })
    router.push(`/games/literary-map/play?${params.toString()}`)
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-4">
              <Map className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Literary Map</h1>
            <p className="text-lg text-muted-foreground">Hành trình khám phá văn học - 15 phút phiêu lưu</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Số trái tim ban đầu</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={settings.hearts === 3 ? 'default' : 'outline'}
                        onClick={() => setSettings({ ...settings, hearts: 3 })}
                        className="flex-1"
                      >
                        <Heart className="h-4 w-4 mr-2" /> 3 tim
                      </Button>
                      <Button
                        variant={settings.hearts === 5 ? 'default' : 'outline'}
                        onClick={() => setSettings({ ...settings, hearts: 5 })}
                        className="flex-1"
                      >
                        <Heart className="h-4 w-4 mr-2" /> 5 tim
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Độ khó</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Dễ', 'Trung bình', 'Khó', 'Hỗn hợp'] as const).map((diff) => (
                        <Button
                          key={diff}
                          variant={settings.difficulty === diff ? 'default' : 'outline'}
                          onClick={() => setSettings({ ...settings, difficulty: diff })}
                          size="sm"
                        >
                          {diff}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* THÔNG BÁO TỔNG SỐ CÂU */}
                  <div className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${totalSelectedQuestions >= 30 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                    <Info className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="font-bold">Tổng câu hỏi: {totalSelectedQuestions}/30</p>
                      {totalSelectedQuestions < 30 && <p className="text-xs">Chọn thêm tác phẩm để đủ 30 câu.</p>}
                    </div>
                  </div>

                  <Button 
                    onClick={handleStartGame} 
                    className="w-full" 
                    size="lg"
                    disabled={totalSelectedQuestions < 30 || selectedWorks.length < 2}
                  >
                    <Play className="mr-2 h-5 w-5" /> Bắt đầu
                  </Button>
                </CardContent>
              </Card>
              
              {/* Giữ nguyên phần Game Mechanics bên dưới của bạn... */}
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Chọn tác phẩm</CardTitle>
                  <CardDescription>
                    Đã chọn: {selectedWorks.length} | Tổng câu hỏi: <span className={totalSelectedQuestions >= 30 ? "text-green-600 font-bold" : "text-orange-600 font-bold"}>{totalSelectedQuestions}/30</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {works.length === 0 ? (
                    <div className="text-center py-12 italic text-muted-foreground">
                      Không tìm thấy tác phẩm nào có câu hỏi.
                    </div>
                  ) : (
                    <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2">
                      {works.map((work) => {
                        const isSelected = selectedWorks.includes(work.id)
                        return (
                          <div
                            key={work.id}
                            onClick={() => toggleWork(work.id)}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                              isSelected ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{work.title}</h3>
                                <p className="text-xs text-muted-foreground">{work.author} • {work.question_count} câu hỏi</p>
                              </div>
                              <Badge variant={isSelected ? 'default' : 'outline'}>{work.genre}</Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}