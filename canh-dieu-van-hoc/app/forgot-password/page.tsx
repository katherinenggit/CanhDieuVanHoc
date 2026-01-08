'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { resetPassword } from '@/lib/utils/auth'
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await resetPassword(email)
      if (result.success) {
        setSubmitted(true)
        toast.success('Đã gửi email khôi phục mật khẩu!')
      } else {
        toast.error(result.error || 'Có lỗi xảy ra, vui lòng thử lại.')
      }
    } catch (error) {
      toast.error('Lỗi kết nối hệ thống.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Kiểm tra Email</CardTitle>
            <CardDescription>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">Quay lại đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Quên mật khẩu?</CardTitle>
          <CardDescription className="text-center">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email tài khoản</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gửi yêu cầu
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}