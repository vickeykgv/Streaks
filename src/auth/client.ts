import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { unsubscribeFromPush } from '@/push/subscribe'
import { reminderApi } from '@/push/api'

export type AuthUser = User

export const authClient = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data.user
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  },

  async signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  },

  async signOut() {
    await Promise.allSettled([
      unsubscribeFromPush(),
      reminderApi.cancelAll(),
    ])
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async getUser(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
  },
}
