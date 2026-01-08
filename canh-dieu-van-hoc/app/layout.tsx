import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'



const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'Cánh Diều Văn Học - Học văn qua game',
  description:
    'Ôn tập 43 tác phẩm Ngữ Văn 12 SGK Cánh Diều qua các trò chơi tương tác với AI hỗ trợ',
  keywords: 'văn học, ngữ văn 12, cánh diều, game học tập, trắc nghiệm văn học',
  authors: [{ name: 'Cánh Diều Văn Học' }],
  openGraph: {
    title: 'Cánh Diều Văn Học',
    description: 'Học văn qua game - Vui là chính!',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}