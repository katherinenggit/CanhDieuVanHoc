'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner' // Import trực tiếp từ sonner để hết lỗi đỏ
import { createClient } from '@/lib/supabase/client' // Đường dẫn chuẩn tới client mới
import { BookOpen, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  // 1. Khởi tạo Supabase Client ngay tại component
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 2. Sử dụng phương thức chuẩn của Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        // 3. Sử dụng toast.error của sonner
        toast.error(error.message || 'Email hoặc mật khẩu không chính xác.')
      } else {
        toast.success('Đăng nhập thành công!')
        
        // 4. Force refresh để đảm bảo Middleware nhận được Session mới từ Cookie
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi không xác định. Vui lòng thử lại.')
      console.error('Login Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
          <CardDescription>Nhập email và mật khẩu để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
              </div>
            </div>

            <Link href="/auth/anonymous" className="block w-full">
              <Button type="button" variant="outline" className="w-full" disabled={loading}>
                Đăng nhập ẩn danh
              </Button>
            </Link>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                Đăng ký ngay
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}