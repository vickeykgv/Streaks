import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell }    from '@/components/AppShell'
import { ToastContainer } from '@/components/ui'
import { ErrorBoundary }  from '@/components/ErrorBoundary'
import { Onboarding }     from '@/components/Onboarding'
import { settingsRepo }   from '@/db/repos/settings'
import Dashboard   from '@/routes/Dashboard'
import Habits      from '@/routes/Habits'
import HabitDetail from '@/routes/HabitDetail'
import Tasks       from '@/routes/Tasks'
import TaskDetail  from '@/routes/TaskDetail'
import Editor      from '@/routes/Editor'
import Tags        from '@/routes/Tags'
import Settings    from '@/routes/Settings'
import SignIn      from '@/routes/SignIn'

const Stats = lazy(() => import('@/routes/Stats'))

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    settingsRepo.get<boolean>('onboardingDone', false).then(done => {
      setShowOnboarding(!done)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return <div className="min-h-screen" style={{ background: 'var(--bg-app)' }} />
  }

  if (showOnboarding) {
    return (
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary>
          <Onboarding
            onComplete={async () => {
              await settingsRepo.set('onboardingDone', true)
              setShowOnboarding(false)
            }}
          />
        </ErrorBoundary>
        <ToastContainer />
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ErrorBoundary>
        <AppShell>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/"                element={<Dashboard />} />
              <Route path="/habits"          element={<Habits />} />
              <Route path="/habits/:id"      element={<HabitDetail />} />
              <Route path="/tasks"           element={<Tasks />} />
              <Route path="/tasks/:id"       element={<TaskDetail />} />
              <Route path="/stats"           element={<Stats />} />
              <Route path="/new"             element={<Editor />} />
              <Route path="/edit/:type/:id"  element={<Editor />} />
              <Route path="/tags"            element={<Tags />} />
              <Route path="/settings"        element={<Settings />} />
              <Route path="/signin"          element={<SignIn />} />
            </Routes>
          </Suspense>
        </AppShell>
      </ErrorBoundary>
      <ToastContainer />
    </BrowserRouter>
  )
}
