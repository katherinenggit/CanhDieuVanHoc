'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { resetPassword } from '@/lib/utils/auth'
import { BookOpen, Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Email không hợp lệ: Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword(email)

      if (result.success) {
        setEmailSent(true)
        toast.info('Email đã được gửi!: Vui lòng kiểm tra hộp thư để đặt lại mật khẩu.')
      } else {
        toast.error('Không thể gửi email: Có lỗi xảy ra. Vui lòng thử lại.')
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    try {
      const result = await resetPassword(email)
      if (result.success) {
        toast.info('Email đã được gửi lại!. Vui lòng kiểm tra hộp thư của bạn.',)
      }
    } catch (error) {
      toast.error('Không thể gửi lại email: Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Mail className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Kiểm tra email của bạn</CardTitle>
            <CardDescription className="text-base">
              Chúng tôi đã gửi link đặt lại mật khẩu đến
              <span className="block font-semibold text-foreground mt-1">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Click vào link trong email để đặt lại mật khẩu. Link sẽ hết hạn sau 1 giờ.
              </p>
              <p className="text-sm text-muted-foreground">
                Không nhận được email? Kiểm tra thư mục spam hoặc click nút bên dưới để gửi lại.
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi lại email'
              )}
            </Button>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
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
          <CardTitle className="text-2xl font-bold">Quên mật khẩu?</CardTitle>
          <CardDescription>
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi link đặt lại mật khẩu'
              )}
            </Button>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}