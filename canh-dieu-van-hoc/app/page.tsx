import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/Navbar'
import { BookOpen, Brain, Trophy, Users, Zap, Target } from 'lucide-react'
import { Gamepad2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Cánh Diều Văn Học
          </h1>
          <p className="mt-6 text-xl leading-8 text-purple-100">
            Học văn qua game
          </p>
          <p className="mt-4 text-lg text-purple-200">
            Ôn tập 43 tác phẩm Ngữ Văn 12 SGK Cánh Diều qua các trò chơi tương tác
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/auth/register">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8 py-6">
                Bắt đầu ngay
              </Button>
            </Link>
            <Link href="#features">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                Xem demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { label: 'Tác phẩm', value: '43' },
              { label: 'Câu hỏi', value: '1000+' },
              { label: 'Học sinh', value: '500+' },
              { label: 'Trò chơi', value: '3' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-purple-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tại sao chọn Cánh Diều Văn Học?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Phương pháp học tập hiện đại với công nghệ AI
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-100 p-3">
                    <Gamepad2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Học qua Game</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  3 chế độ chơi: Quiz Race, Time Battle, Literary Map. Học tập trở nên thú vị và
                  hiệu quả hơn bao giờ hết.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-purple-100 p-3">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>AI Hỗ trợ</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Tự động tạo câu hỏi và phân tích điểm yếu. AI đưa ra feedback cá nhân hóa sau mỗi
                  lượt chơi.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-orange-100 p-3">
                    <Trophy className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Thi đấu Realtime</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Thách đấu bạn bè, leo bảng xếp hạng. Hệ thống huy hiệu và thành tựu đa dạng.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Cách hoạt động</h2>
            <p className="mt-4 text-lg text-gray-600">4 bước đơn giản để bắt đầu</p>
          </div>

          <div className="grid gap-12 md:grid-cols-4">
            {[
              {
                step: '1',
                icon: BookOpen,
                title: 'Chọn tác phẩm',
                description: 'Chọn tác phẩm văn học muốn ôn tập',
              },
              {
                step: '2',
                icon: Target,
                title: 'Chọn chế độ',
                description: 'Cá nhân hoặc Thi đấu với bạn bè',
              },
              {
                step: '3',
                icon: Zap,
                title: 'Trả lời câu hỏi',
                description: 'Trả lời nhanh, chính xác để ghi điểm',
              },
              {
                step: '4',
                icon: Trophy,
                title: 'Nhận huy hiệu',
                description: 'Leo rank, nhận thành tích, lên level',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-2xl font-bold text-white">
                      {item.step}
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Sẵn sàng chinh phục Ngữ Văn 12?
          </h2>
          <p className="mt-4 text-xl text-purple-100">
            Tham gia cùng hàng trăm học sinh đang học tập hiệu quả
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
                Đăng ký miễn phí
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Cánh Diều Văn Học</span>
              </div>
              <p className="text-sm text-gray-600">
                Học văn qua game
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Về chúng tôi</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="">Giới thiệu</Link>
                </li>
                <li>
                  <Link href="">Liên hệ</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Pháp lý</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="https://chinhphu.vn/chinh-sach-bao-mat.html">Chính sách bảo mật</Link>
                </li>
                <li>
                  <Link href="">Điều khoản sử dụng</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Kết nối</h3>
              <div className="flex space-x-4">
                <a href="https://github.com/katherinenggit" className="text-gray-600 hover:text-primary">
                  Github
                </a>
                <a href="https://www.facebook.com/makeamericangayagain/" className="text-gray-600 hover:text-primary">
                  Facebook
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
            © 2024 Cánh Diều Văn Học. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}