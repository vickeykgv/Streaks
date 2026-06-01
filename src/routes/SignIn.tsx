import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { authClient } from '@/auth/client'
import { toast } from '@/store/toastStore'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

type Mode = 'signin' | 'signup' | 'magic'

export default function SignIn() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const returnTo  = new URLSearchParams(location.search).get('return') ?? '/'
  const [mode, setMode]         = useState<Mode>('signin')
  const [loading, setLoading]   = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      if (mode === 'signin') {
        await authClient.signIn(data.email, data.password)
        navigate(returnTo)
      } else if (mode === 'signup') {
        await authClient.signUp(data.email, data.password)
        toast.success('Check your email to confirm your account')
        navigate('/')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    const email = getValues('email')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email first')
      return
    }
    setLoading(true)
    try {
      await authClient.signInWithMagicLink(email)
      setMagicSent(true)
      toast.success('Check your email for the sign-in link')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="hero-panel rounded-[30px] px-6 py-8 text-center mb-6">
          <div className="text-4xl mb-3">🎯</div>
          <div className="font-sans text-[26px] font-extrabold tracking-tight text-[var(--text-primary)]">
            Habit Tracker
          </div>
          <div className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
            {mode === 'signin' ? 'Sign in to sync across devices' : mode === 'signup' ? 'Create your account' : 'Sign in with a magic link'}
          </div>
        </div>

        {magicSent ? (
          <div className="glass-panel rounded-[24px] p-6 text-center">
            <div className="text-3xl mb-3">📬</div>
            <p className="font-sans text-[15px] font-bold text-[var(--text-primary)]">Check your inbox</p>
            <p className="mt-2 font-body text-[13px] text-[var(--text-secondary)]">
              We sent a sign-in link to your email. Click it to continue.
            </p>
            <button
              onClick={() => setMagicSent(false)}
              className="mt-4 font-body text-[13px] text-[var(--color-brand-400)]"
            >
              Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="glass-panel rounded-[24px] p-6 flex flex-col gap-4">
            <div>
              <label className="block mb-1.5 font-sans text-[13px] font-semibold text-[var(--text-secondary)]">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] px-4 py-3 font-body text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-brand-400)]"
              />
              {errors.email && (
                <p className="mt-1 font-body text-[12px] text-[var(--color-overdue)]">{errors.email.message}</p>
              )}
            </div>

            {mode !== 'magic' && (
              <div>
                <label className="block mb-1.5 font-sans text-[13px] font-semibold text-[var(--text-secondary)]">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] px-4 py-3 font-body text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-brand-400)]"
                />
                {errors.password && (
                  <p className="mt-1 font-body text-[12px] text-[var(--color-overdue)]">{errors.password.message}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-1">
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-2xl font-sans text-[14px] font-extrabold text-[var(--text-on-brand)] disabled:opacity-50"
                style={{ background: 'var(--color-brand-500)', boxShadow: 'var(--shadow-glow)' }}
              >
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="h-12 w-full rounded-2xl bg-[var(--bg-surface-2)] font-sans text-[14px] font-bold text-[var(--text-secondary)]"
                >
                  Create account
                </button>
              )}
              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="h-12 w-full rounded-2xl bg-[var(--bg-surface-2)] font-sans text-[14px] font-bold text-[var(--text-secondary)]"
                >
                  Back to sign in
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              <span className="font-body text-[12px] text-[var(--text-tertiary)]">or</span>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-[var(--bg-surface-2)] font-sans text-[14px] font-bold text-[var(--text-secondary)] disabled:opacity-50"
            >
              Send magic link
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="font-body text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            ← Back to app (no sync)
          </Link>
        </div>
      </div>
    </div>
  )
}
