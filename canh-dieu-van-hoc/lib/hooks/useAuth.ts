"use client" // Đảm bảo có dòng này vì dùng hook

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
// 1. Sửa lại import: dùng hàm createClient thay vì biến supabase trực tiếp
import { createClient } from '@/lib/supabase/client' 
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Khởi tạo supabase client bên trong hoặc ngoài hook tùy cách bạn setup
  const supabase = createClient()

  useEffect(() => {
    // 2. Fix lỗi getSession
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    getInitialSession()

    // 3. Fix lỗi onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    // Thêm dấu ? để tránh lỗi khi profile chưa load xong
    isAnonymous: profile?.is_anonymous ?? false, 
  }
}