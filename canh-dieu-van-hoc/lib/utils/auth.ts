import { createClient } from '@/lib/supabase/client' 
const supabase = createClient() // THÊM DÒNG NÀY ĐỂ FIX LỖI SUPABASE UNDEFINED

export interface SignUpData {
  email: string
  password: string
  displayName: string
  username: string
}

export interface SignInData {
  email: string
  password: string
}

/**
 * Sign up new user with email and password
 */
export async function signUp({ email, password, displayName, username }: SignUpData) {
  try {
    // 1. Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingUser) {
      return { success: false, error: 'Username đã được sử dụng' }
    }

    // 2. Create auth user (with email confirmation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: displayName,
          username,
        },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Không thể tạo tài khoản')

    // 3. Create profile (only if user was created successfully)
    // Note: This might fail if email confirmation is required
    // In that case, profile will be created after email confirmation
    if (authData.user.id) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        display_name: displayName,
        username,
        email,
        is_verified: false,
        is_anonymous: false,
      })

      // Ignore profile error if it's a duplicate (user might have confirmed email already)
      if (profileError && profileError.code !== '23505') {
        console.error('Profile creation error:', profileError)
      }
    }

    return { 
      success: true, 
      user: authData.user,
      needsEmailConfirmation: !authData.session // If no session, email confirmation required
    }
  } catch (error: any) {
    console.error('Sign up error:', error)
    return { 
      success: false, 
      error: error.message || 'Đã xảy ra lỗi khi đăng ký' 
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error('Sign in error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign in anonymously (for guest access via game link)
 */
export async function signInAnonymously(displayName: string) {
  try {
    // Generate random username
    const randomUsername = `guest_${Math.random().toString(36).substring(2, 10)}`

    // 1. Sign in anonymously with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

    if (authError) throw authError
    if (!authData.user) throw new Error('Anonymous sign in failed')

    // 2. Create anonymous profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      display_name: displayName,
      username: randomUsername,
      email: null,
      is_verified: false,
      is_anonymous: true,
    })

    if (profileError) throw profileError

    return { success: true, user: authData.user }
  } catch (error: any) {
    console.error('Anonymous sign in error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    if (username.length < 4) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Username check error:', error)
      return false
    }

    return !data // If no data, username is available
  } catch (error) {
    console.error('Username check error:', error)
    return false
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Password reset error:', error)
    return { 
      success: false, 
      error: error.message || 'Không thể gửi email đặt lại mật khẩu' 
    }
  }
}

/**
 * Update password (after clicking reset link)
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Update password error:', error)
    return { 
      success: false, 
      error: error.message || 'Không thể cập nhật mật khẩu' 
    }
  }
}