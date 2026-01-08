'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/hooks/useAuth'
import { BookOpen, Home, Trophy, Gamepad2, Settings, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, signOut, isAuthenticated } = useAuth()

  const navItems = [
    { href: '/', label: 'Trang chủ', icon: Home },
    { href: '/games', label: 'Trò chơi', icon: Gamepad2 },
    { href: '/leaderboard', label: 'Xếp hạng', icon: Trophy },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl hidden sm:inline-block">
            Cánh Diều Văn Học
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={cn('flex items-center space-x-2')}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                    <AvatarFallback>{profile.display_name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile.display_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile.email || 'Khách'}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs font-semibold text-primary">
                        Level {profile.level}
                      </span>
                      <span className="mx-2 text-xs text-muted-foreground">•</span>
                      <span className="text-xs">{profile.badge}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button variant="ghost">Đăng nhập</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Đăng ký</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}