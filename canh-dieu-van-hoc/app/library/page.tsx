'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  BookOpen,
  Plus,
  Sparkles,
  Search,
  Lock,
  Globe,
  Loader2,
  Trash2,
  Edit,
  X,
  Save
} from 'lucide-react'
import { toast } from 'sonner'
//import { QuestionWithAnswer } from '@/lib/types/game'

interface QuestionWithAnswer {
    id: string
    content: string
    difficulty: string
    is_public: boolean
    created_by: string
    work_id: string
    explanation?: string
    answer_data: {
      options: string[]
      correct: string
    }
    // Đây là phần quan trọng để fix lỗi title
    literary_works?: {
      title: string
      author?: string
    }
    profiles?: {
      username: string
      display_name: string
    }
  }

interface LiteraryWork {
  id: string
  title: string
  author: string
  genre: string
}

export default function LibraryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [works, setWorks] = useState<LiteraryWork[]>([])
  const [myQuestions, setMyQuestions] = useState<QuestionWithAnswer[]>([])
  const [publicQuestions, setPublicQuestions] = useState<QuestionWithAnswer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [aiRequestsToday, setAiRequestsToday] = useState(0)
  const [aiQuestions, setAiQuestions] = useState<any[]>([]) // Danh sách câu hỏi AI vừa tạo
const [showReview, setShowReview] = useState(false) // Trạng thái hiển thị giao diện kiểm duyệt

  // Create question form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    content: '',
    work_id: '',
    difficulty: 'Dễ' as 'Dễ' | 'Trung bình' | 'Khó',
    options: ['', '', '', ''],
    correct: '',
    explanation: ''
  })

  // AI Generator
  const [showAIForm, setShowAIForm] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/library')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      // Load literary works
      const { data: worksData } = await supabase
        .from('literary_works')
        .select('*')
        .order('title', { ascending: true })
      setWorks(worksData || [])

      // Load my questions
      const { data: myQuestionsData } = await supabase
        .from('questions')
        .select(`
          *,
          literary_works:work_id (
            id, title, author, genre
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
      setMyQuestions(myQuestionsData || [])

      // Load public questions
      const { data: publicQuestionsData, error: publicError } = await supabase
        .from('questions')
        .select(`
          *,
          literary_works:work_id (
            id, title, author, genre
          ),
          profiles:created_by (
            id, username, display_name
          )
        `)
        .eq('is_public', true)
        .neq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
        if (publicError) {
          console.error("Lỗi lấy câu hỏi công khai:", publicError)
      }
      setPublicQuestions(publicQuestionsData || [])

      // Check AI requests today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data: aiRequests } = await supabase
        .from('ai_requests')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
      setAiRequestsToday(aiRequests?.length || 0)

    } catch (error) {
      console.error('Error loading library:', error)
      toast.error('Không thể tải thư viện')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuestion = async () => {
    if (!user) return

    // Validate
    if (!newQuestion.content.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi')
      return
    }
    if (!newQuestion.work_id) {
      toast.error('Vui lòng chọn tác phẩm')
      return
    }
    if (newQuestion.options.some(opt => !opt.trim())) {
      toast.error('Vui lòng điền đầy đủ 4 đáp án')
      return
    }
    if (!newQuestion.correct) {
      toast.error('Vui lòng chọn đáp án đúng')
      return
    }

    try {
      const { error } = await supabase.from('questions').insert({
        content: newQuestion.content.trim(),
        question_type: 'multiple_choice',
        answer_data: {
          options: newQuestion.options,
          correct: newQuestion.correct
        },
        work_id: newQuestion.work_id,
        difficulty: newQuestion.difficulty,
        explanation: newQuestion.explanation.trim() || null,
        created_by: user.id,
        is_public: false
      })

      if (error) throw error

      toast.success('Đã tạo câu hỏi thành công!')
      setShowCreateForm(false)
      setNewQuestion({
        content: '',
        work_id: '',
        difficulty: 'Dễ',
        options: ['', '', '', ''],
        correct: '',
        explanation: ''
      })
      loadData()
    } catch (error) {
      console.error('Error creating question:', error)
      toast.error('Không thể tạo câu hỏi')
    }
  }

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return toast.error('Vui lòng nhập yêu cầu')
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        body: JSON.stringify({ prompt: aiPrompt, userId: user?.id })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
  
      // Tự động khớp work_id dựa trên tên tác phẩm AI trả về (nếu có)
      const processed = data.questions.map((q: any) => {
        const matchedWork = works.find(w => w.title.toLowerCase().includes(q.work_title.toLowerCase()))
        return { ...q, work_id: matchedWork?.id || '' }
      })
  
      setAiQuestions(processed)
      setShowReview(true) // Mở giao diện kiểm duyệt
      setShowAIForm(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setAiLoading(false)
    }
  }
  // Hàm cập nhật từng câu hỏi trong danh sách kiểm duyệt
const updateAiQuestion = (index: number, field: string, value: any) => {
  const newQuestions = [...aiQuestions]
  newQuestions[index] = { ...newQuestions[index], [field]: value }
  setAiQuestions(newQuestions)
}

// Hàm Lưu tất cả vào Supabase
const handleSaveAllAiQuestions = async () => {
  setAiLoading(true)
  try {
    const questionsToSave = aiQuestions.map(q => ({
      content: q.content,
      question_type: 'multiple_choice',
      answer_data: {
        options: q.options,
        correct: q.correct
      },
      work_id: q.work_id, // Sử dụng ID đã được người dùng chọn/khớp
      difficulty: q.difficulty,
      explanation: q.explanation,
      created_by: user?.id,
      is_public: false,
      is_ai_generated: true
    }))

    const { error } = await supabase.from('questions').insert(questionsToSave)
    if (error) throw error

    toast.success(`Đã lưu thành công ${questionsToSave.length} câu hỏi!`)
    setAiQuestions([])
    setShowReview(false)
    loadData() // Refresh danh sách thư viện
  } catch (error: any) {
    toast.error('Lỗi khi lưu: ' + error.message)
  } finally {
    setAiLoading(false)
  }
}
  const handleTogglePublic = async (questionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_public: !currentStatus })
        .eq('id', questionId)

      if (error) throw error

      toast.success(currentStatus ? 'Đã chuyển sang riêng tư' : 'Đã công khai câu hỏi')
      loadData()
    } catch (error) {
      console.error('Error toggling public:', error)
      toast.error('Không thể cập nhật')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      toast.success('Đã xóa câu hỏi')
      loadData()
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Không thể xóa câu hỏi')
    }
  }

  const handleCopyQuestion = async (question: QuestionWithAnswer) => {
    if (!user) return

    try {
      const { error } = await supabase.from('questions').insert({
        content: question.content,
//        question_type: question.question_type,  
        answer_data: question.answer_data,
        work_id: question.work_id,
        difficulty: question.difficulty,
        explanation: question.explanation,
        created_by: user.id,
        is_public: false
      })

      if (error) throw error

      toast.success('Đã sao chép câu hỏi vào thư viện của bạn')
      loadData()
    } catch (error) {
      console.error('Error copying question:', error)
      toast.error('Không thể sao chép câu hỏi')
    }
  }

  const filteredMyQuestions = myQuestions.filter(q =>
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPublicQuestions = publicQuestions.filter(q =>
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Thư viện câu hỏi</h1>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo mới
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAIForm(true)}
                  disabled={aiRequestsToday >= 5}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI ({aiRequestsToday}/5)
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="my-questions">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="my-questions">
                <Lock className="mr-2 h-4 w-4" />
                Của tôi ({myQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="public-questions">
                <Globe className="mr-2 h-4 w-4" />
                Công khai ({publicQuestions.length})
              </TabsTrigger>
            </TabsList>

            {/* My Questions */}
            <TabsContent value="my-questions">
              {filteredMyQuestions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có câu hỏi nào</p>
                    <p className="text-sm mt-2">Tạo câu hỏi đầu tiên của bạn!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredMyQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{question.difficulty}</Badge>
                              <Badge variant="outline">
                                {question.literary_works?.title || 'Không xác định'}
                              </Badge>
                              {question.is_public ? (
                                <Badge className="bg-green-100 text-green-700">
                                  <Globe className="mr-1 h-3 w-3" />
                                  Công khai
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Lock className="mr-1 h-3 w-3" />
                                  Riêng tư
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold mb-3">{question.content}</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {question.answer_data.options?.map((option, idx) => (
                                <div
                                  key={idx}
                                  className={`text-sm p-2 rounded border ${
                                    question.answer_data.correct === option
                                      ? 'bg-green-50 border-green-300 font-medium'
                                      : 'bg-gray-50 border-gray-100'
                                  }`}
                                >
                                  <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                                  {option}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTogglePublic(question.id, question.is_public)}
                            >
                              {question.is_public ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Public Questions */}
            <TabsContent value="public-questions">
              {filteredPublicQuestions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có câu hỏi công khai nào</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPublicQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{question.difficulty}</Badge>
                              <Badge variant="outline">
                                {question.literary_works?.title || 'Không xác định'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                bởi @{question.profiles?.display_name || question.profiles?.username || 'Người dùng ẩn danh'}
                              </span>
                            </div>
                            <h3 className="font-semibold mb-3">{question.content}</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {question.answer_data.options?.map((option, idx) => (
                                <div
                                key={idx}
                                className={`text-sm p-2 rounded border ${
                                  question.answer_data.correct === option
                                    ? 'bg-green-50 border-green-300 font-medium'
                                    : 'bg-gray-50 border-gray-100'
                                }`}
                              >
                                <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                                {option}
                              </div>
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleCopyQuestion(question)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Sao chép
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <Card className="w-full max-w-2xl my-8">
                <CardHeader>
                  <CardTitle>Tạo câu hỏi mới</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nội dung câu hỏi *</Label>
                    <Textarea
                      placeholder="Nhập câu hỏi của bạn..."
                      value={newQuestion.content}
                      onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tác phẩm *</Label>
                      <Select value={newQuestion.work_id} onValueChange={(v) => setNewQuestion({ ...newQuestion, work_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tác phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {works.map((work) => (
                            <SelectItem key={work.id} value={work.id}>
                              {work.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Độ khó *</Label>
                      <Select value={newQuestion.difficulty} onValueChange={(v: any) => setNewQuestion({ ...newQuestion, difficulty: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dễ">Dễ</SelectItem>
                          <SelectItem value="Trung bình">Trung bình</SelectItem>
                          <SelectItem value="Khó">Khó</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>4 đáp án *</Label>
                    <div className="space-y-2 mt-2">
                      {newQuestion.options.map((opt, idx) => (
                        <Input
                          key={idx}
                          placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...newQuestion.options]
                            newOpts[idx] = e.target.value
                            setNewQuestion({ ...newQuestion, options: newOpts })
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Đáp án đúng *</Label>
                    <Select value={newQuestion.correct} onValueChange={(v) => setNewQuestion({ ...newQuestion, correct: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đáp án đúng" />
                      </SelectTrigger>
                      <SelectContent>
                        {newQuestion.options.filter(o => o.trim()).map((opt, idx) => (
                          <SelectItem key={idx} value={opt}>
                            {String.fromCharCode(65 + idx)}. {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Giải thích (tùy chọn)</Label>
                    <Textarea
                      placeholder="Giải thích đáp án đúng..."
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">
                      Hủy
                    </Button>
                    <Button onClick={handleCreateQuestion} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Lưu câu hỏi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Generator Modal */}
          {showAIForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Tạo câu hỏi bằng AI
                  </CardTitle>
                  <CardDescription>
                    Còn {5 - aiRequestsToday} lượt sử dụng hôm nay
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="VD: Tạo 5 câu hỏi trắc nghiệm về tác phẩm Chiếc Thuyền Ngoài Xa, độ khó trung bình"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    disabled={aiLoading}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAIForm(false)}
                      disabled={aiLoading}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleGenerateWithAI}
                      disabled={aiLoading}
                      className="flex-1"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Tạo câu hỏi
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/*Giao diện check câu hỏi*/}
          {showReview && (
  <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-0 md:p-4 backdrop-blur-md">
    <Card className="w-full max-w-5xl h-full md:h-[90vh] flex flex-col shadow-2xl overflow-hidden border-none bg-white">
      
      {/* 1. HEADER: FIX LỖI CỤT VÀ LÒI CHỮ */}
      <div className="shrink-0 border-b bg-white px-6 py-4 z-[110] relative">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-orange-800 flex items-center gap-2 text-xl font-bold">
              <Sparkles className="text-orange-500 h-6 w-6" /> 
              Kiểm duyệt câu hỏi từ AI
            </CardTitle>
            <CardDescription className="mt-1">
              Chỉnh sửa nội dung trực tiếp dưới đây. Các ô sẽ tự xuống hàng nếu chữ quá dài.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowReview(false)} className="rounded-full hover:bg-orange-50">
            <X className="h-6 w-6 text-gray-500" />
          </Button>
        </div>
      </div>
      
      {/* 2. CONTENT: FIX LỖI TRÀN CHỮ BẰNG TEXTAREA */}
      <CardContent className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 bg-gray-100/50">
        {aiQuestions.map((q, idx) => (
          <div key={idx} className="p-6 border border-gray-200 rounded-2xl bg-white shadow-md relative space-y-6">
            <Badge className="absolute -top-3 left-6 px-4 py-1 bg-orange-600 text-white border-none shadow-md">
              CÂU HỎI {idx + 1}
            </Badge>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Nội dung câu hỏi - Dùng Textarea để không bao giờ tràn ngang */}
              <div className="lg:col-span-7 space-y-2">
                <Label className="font-bold text-gray-700 flex items-center gap-2">
                   Nội dung câu hỏi
                </Label>
                <Textarea 
                  className="min-h-[100px] w-full resize-none border-gray-300 focus:border-orange-500 bg-gray-50/30 text-base leading-relaxed" 
                  value={q.content} 
                  onChange={(e) => updateAiQuestion(idx, 'content', e.target.value)} 
                />
              </div>

              {/* Tác phẩm - Dropdown rộng rãi */}
              <div className="lg:col-span-5 space-y-2">
                <Label className="font-bold text-red-600">Tác phẩm (Bắt buộc)</Label>
                <Select value={q.work_id} onValueChange={(v) => updateAiQuestion(idx, 'work_id', v)}>
                  <SelectTrigger className="w-full h-[50px] border-gray-300">
                    <SelectValue placeholder="Bấm để chọn tác phẩm..." />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    {works.map(w => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4 ĐÁP ÁN: SỬ DỤNG TEXTAREA ĐỂ TỰ XUỐNG DÒNG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt: string, oIdx: number) => (
                <div key={oIdx} className="space-y-1.5">
                  <Label className="text-xs font-black text-gray-400 ml-1">ĐÁP ÁN {String.fromCharCode(65 + oIdx)}</Label>
                  <Textarea 
                    rows={2}
                    className="w-full resize-none min-h-[60px] border-gray-200 focus:ring-orange-500 py-2"
                    value={opt} 
                    onChange={(e) => {
                      const newOpts = [...q.options];
                      newOpts[oIdx] = e.target.value;
                      updateAiQuestion(idx, 'options', newOpts);
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dashed">
              <div className="flex gap-4 flex-1">
                <div className="flex-1 space-y-2">
                  <Label className="text-green-700 font-bold text-xs uppercase">Đáp án đúng</Label>
                  <Select value={q.correct} onValueChange={(v) => updateAiQuestion(idx, 'correct', v)}>
                    <SelectTrigger className="border-green-200 bg-green-50/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[120]">
                      {q.options.map((o: string, i: number) => (
                        <SelectItem key={i} value={o}>Câu {String.fromCharCode(65+i)} là đúng</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">Độ khó</Label>
                  <Select value={q.difficulty} onValueChange={(v) => updateAiQuestion(idx, 'difficulty', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[120]">
                      <SelectItem value="Dễ">Dễ</SelectItem>
                      <SelectItem value="Trung bình">Trung bình</SelectItem>
                      <SelectItem value="Khó">Khó</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => setAiQuestions(aiQuestions.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-5 w-5 mr-2" /> Xóa câu này
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {/* 3. FOOTER: FIX LỖI CỤT VÀ LÀM NỀN TRẮNG ĐẶC */}
      <div className="shrink-0 p-4 border-t bg-white z-[110] flex flex-col md:flex-row justify-end gap-3 sticky bottom-0">
        <Button 
          variant="outline" 
          onClick={() => setShowReview(false)} 
          className="w-full md:w-auto border-gray-300"
        >
          Hủy bỏ
        </Button>
        <Button 
          onClick={handleSaveAllAiQuestions} 
          disabled={aiLoading || aiQuestions.length === 0}
          className="bg-orange-600 hover:bg-orange-700 text-white w-full md:w-auto px-10 font-bold shadow-lg shadow-orange-200"
        >
          {aiLoading ? (
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          LƯU {aiQuestions.length} CÂU HỎI
        </Button>
      </div>
    </Card>
  </div>
)}
        </div>
      </main>
    </div>
  )
}