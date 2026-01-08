'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { signUp, checkUsernameAvailability } from '@/lib/utils/auth'
import { BookOpen, Loader2, Check, X } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    username: '',
  })

  const handleUsernameCheck = async (username: string) => {
    if (username.length < 4) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    const available = await checkUsernameAvailability(username)
    setUsernameAvailable(available)
    setCheckingUsername(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu không khớp: Vui lòng kiểm tra lại mật khẩu xác nhận.')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Mật khẩu quá ngắn: Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }

    if (formData.username.length < 4) {
      toast.error('Username không hợp lệ: Username phải có ít nhất 4 ký tự.')
      return
    }

    if (usernameAvailable === false) {
      toast.error('Username không khả dụng: Username này đã được sử dụng. Vui lòng chọn username khác.')
      return
    }

    setLoading(true)

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        username: formData.username,
      })

      if (result.success) {
        if (result.needsEmailConfirmation) {
          // Email confirmation required
          toast.success('Đăng ký thành công! 🎉: Vui lòng kiểm tra email để xác nhận tài khoản.')
          // Redirect to verify email page
          router.push('/auth/verify-email?email=' + encodeURIComponent(formData.email))
        } else {
          // Can login immediately (no email confirmation required)
          toast('Đăng ký thành công: Bạn có thể đăng nhập ngay bây giờ.')
          router.push('/auth/login')
        }
      } else {
        toast.error('Đăng ký thất bại: Có lỗi xảy ra. Vui lòng thử lại.')
      }
    } catch (error: any) {
      toast.error('Lỗi: Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Đăng ký</CardTitle>
          <CardDescription>Tạo tài khoản mới để bắt đầu học tập</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Nguyễn Văn A"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="nguyen_van_a"
                  value={formData.username}
                  onChange={(e) => {
                    const username = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    setFormData({ ...formData, username })
                    if (username.length >= 4) {
                      handleUsernameCheck(username)
                    } else {
                      setUsernameAvailable(null)
                    }
                  }}
                  required
                  disabled={loading}
                  minLength={4}
                  maxLength={20}
                />
                {checkingUsername && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!checkingUsername && usernameAvailable === true && formData.username.length >= 4 && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {!checkingUsername && usernameAvailable === false && formData.username.length >= 4 && (
                  <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                4-20 ký tự, chỉ chữ thường, số và dấu gạch dưới
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (formData.username.length >= 4 && usernameAvailable !== true)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                'Đăng ký'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}