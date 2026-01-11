'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

// 1. Tách logic và giao diện vào một Component riêng
function AnonymousLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')

  const roomCode = searchParams.get('room')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) {
      toast.error('Vui lòng nhập tên hiển thị')
      return
    }

    setLoading(true)

    try {
      //Đăng nhập ẩn danh
      const { data, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError

      if (data.user) {
        // Lưu vào bảng profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            display_name: displayName,
            is_anonymous: true
          })
          .eq('id', data.user.id)

          if (profileError) {
            console.error("Lỗi lưu profile:", profileError);
            throw new Error("Không thể tạo hồ sơ người chơi");
          }

        toast.success(`Chào mừng ${displayName}!`)

        if (roomCode) {
          router.push(`/games/room/${roomCode}`)
        } else {
          router.push('/games')
        }
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đăng nhập ẩn danh.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Tham gia nhanh</CardTitle>
        <CardDescription>
          {roomCode ? 'Nhập tên để tham gia phòng' : 'Nhập tên để chơi ngay'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lưu ý: Dữ liệu của bạn sẽ bị mất khi trình duyệt đóng nếu không đăng ký.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Tên hiển thị của bạn</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Unana"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
              maxLength={30}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang chuẩn bị...
              </>
            ) : (
              'Vào chơi ngay'
            )}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/auth/login" className="w-full">
              <Button type="button" variant="ghost" className="w-full text-sm">
                Đăng nhập
              </Button>
            </Link>
            <Link href="/auth/register" className="w-full">
              <Button type="button" variant="ghost" className="w-full text-sm">
                Đăng ký
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// 2. Component chính bọc Suspense để Next.js Build thành công
export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Đang tải biểu mẫu...</p>
        </Card>
      }>
        <AnonymousLoginForm />
      </Suspense>
    </div>
  )
}