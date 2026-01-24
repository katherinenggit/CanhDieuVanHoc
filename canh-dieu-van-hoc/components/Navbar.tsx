'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
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
    { href: '/ranking', label: 'Xếp hạng', icon: Trophy },
    { href: '/library', label: 'Thư viện', icon: BookOpen },
    { href: '/profile', label: 'Hồ sơ', icon: User },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#C5E1A5] bg-[#945034]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FFD8DF]/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl hidden sm:inline-block text-[#5F8B4C]">
            Cánh Diều Văn Học
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'flex items-center space-x-2 px-3',
                    isActive && 'bg-[#5F8B4C] font-semibold text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
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
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar>
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                    <AvatarFallback className="bg-[#FFB7C5] text-primary-foreground">
                      {profile.display_name ? profile.display_name[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-64" align="end" forceMount>
                {/* Đã sửa: Biến Label thành MenuItem để bấm vào Avatar header là tới Profile */}
                <DropdownMenuItem asChild className="cursor-pointer p-3 focus:bg-accent transition-colors">
                  <Link href="/profile">
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none">{profile.display_name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {profile.email || 'Học viên'}
                        </p>
                      </div>
                      <div className="flex items-center pt-1 border-t border-border/50">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5E1A5] text-[#4A5D23] uppercase">
                          Lv {profile.level || 1}
                        </span>
                        <span className="mx-2 text-muted-foreground opacity-30">|</span>
                        <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                          {profile.badge || 'Tập sự'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem  className="cursor-pointer">
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem  className="cursor-pointer">
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Cài đặt</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                
                <DropdownMenuItem 
                  onClick={() => signOut()} 
                  className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Đăng nhập</Button>
              </Link>
              <Link href="/auth/register">
              <Button size="sm" className="bg-[#FF8E9E] hover:bg-[#FF7488] text-white">Đăng ký</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}