'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePassword } from '@/lib/utils/auth'
import { BookOpen, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    // Check if user came from email link with valid token
    checkToken()
  }, [])

  const checkToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      // User should have a session from the email link
      if (session) {
        setIsValidToken(true)
      } else {
        setIsValidToken(false)
        toast.error('Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.')
      }
    } catch (error) {
      console.error('Token validation error:', error)
      setIsValidToken(false)
    } finally {
      setValidating(false)
    }
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

    setLoading(true)

    try {
      const result = await updatePassword(formData.password)

      if (result.success) {
        toast.success('Đặt lại mật khẩu thành công! 🎉: Bạn có thể đăng nhập với mật khẩu mới.')
        
        // Sign out after password reset
        await supabase.auth.signOut()
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        toast.error('Không thể đặt lại mật khẩu')
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <BookOpen className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Link không hợp lệ</CardTitle>
            <CardDescription className="text-base">
              Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push('/auth/forgot-password')}
            >
              Yêu cầu link mới
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
          <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
          <CardDescription>
            Nhập mật khẩu mới cho tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {formData.password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`h-1 flex-1 rounded ${
                    formData.password.length < 8 ? 'bg-red-500' :
                    formData.password.length < 12 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-muted-foreground">
                    {formData.password.length < 8 ? 'Yếu' :
                     formData.password.length < 12 ? 'Trung bình' :
                     'Mạnh'}
                  </span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Đặt lại mật khẩu
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}