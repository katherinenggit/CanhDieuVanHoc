'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function VerifyEmaiContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email')
  const [resending, setResending] = useState(false)
  const supabase = createClient()

  const handleResendEmail = async () => {
    if (!email) return

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) throw error

      toast.info('Email đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
      )
    } catch (error: any) {
      toast.error('Lỗi: Không thể gửi lại email.')
    } finally {
      setResending(false)
    }
  }

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
            Chúng tôi đã gửi link xác nhận đến
            {email && (
              <span className="block font-semibold text-foreground mt-1">{email}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Các bước tiếp theo:
            </h4>
            <ol className="text-sm text-muted-foreground space-y-2 ml-6 list-decimal">
              <li>Mở email từ Cánh Diều Văn Học</li>
              <li>Click vào link xác nhận trong email</li>
              <li>Bạn sẽ được chuyển về trang đăng nhập</li>
              <li>Đăng nhập và bắt đầu học tập!</li>
            </ol>
          </div>

          <div className="text-sm text-center text-muted-foreground">
            <p>Không nhận được email?</p>
            <p className="mt-1">Kiểm tra thư mục spam hoặc</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={resending || !email}
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi lại email xác nhận'
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

export default function VerifyEmaiPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <VerifyEmaiContent />
    </Suspense>
  )
}