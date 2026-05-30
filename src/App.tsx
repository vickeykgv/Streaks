import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AppShell }    from '@/components/AppShell'
import { ToastContainer } from '@/components/ui'
import { ErrorBoundary }  from '@/components/ErrorBoundary'
import { Onboarding }     from '@/components/Onboarding'
import { settingsRepo }   from '@/db/repos/settings'
import { useAppBadge }    from '@/hooks/useAppBadge'
import { runDueRecurring } from '@/lib/spending/recurringRunner'

// Core routes — lazy-loaded per route for code splitting
const Dashboard   = lazy(() => import('@/routes/Dashboard'))
const Habits      = lazy(() => import('@/routes/Habits'))
const HabitDetail = lazy(() => import('@/routes/HabitDetail'))
const Tasks       = lazy(() => import('@/routes/Tasks'))
const TaskDetail  = lazy(() => import('@/routes/TaskDetail'))
const Stats       = lazy(() => import('@/routes/Stats'))
const Editor      = lazy(() => import('@/routes/Editor'))
const Tags        = lazy(() => import('@/routes/Tags'))
const Settings    = lazy(() => import('@/routes/Settings'))
const SignIn      = lazy(() => import('@/routes/SignIn'))

// Spending module
const SpendingDashboard   = lazy(() => import('@/routes/spending/Dashboard'))
const SpendingTransactions = lazy(() => import('@/routes/spending/Transactions'))
const SpendingCategories  = lazy(() => import('@/routes/spending/Categories'))
const SpendingAccounts    = lazy(() => import('@/routes/spending/Accounts'))
const SpendingBudgets     = lazy(() => import('@/routes/spending/Budgets'))
const SpendingReports     = lazy(() => import('@/routes/spending/Reports'))
const TransactionEditor   = lazy(() => import('@/routes/spending/TransactionEditor'))
const AccountEditor       = lazy(() => import('@/routes/spending/AccountEditor'))
const CategoryEditor      = lazy(() => import('@/routes/spending/CategoryEditor'))
const BudgetEditor        = lazy(() => import('@/routes/spending/BudgetEditor'))
const SpendingRecurring   = lazy(() => import('@/routes/spending/Recurring'))
const RecurringEditor     = lazy(() => import('@/routes/spending/RecurringEditor'))

// Moto module
const MotoDashboard  = lazy(() => import('@/routes/moto/Dashboard'))
const MotoVehicles   = lazy(() => import('@/routes/moto/Vehicles'))
const MotoFuel       = lazy(() => import('@/routes/moto/Fuel'))
const MotoService    = lazy(() => import('@/routes/moto/Service'))
const MotoParts      = lazy(() => import('@/routes/moto/Parts'))
const MotoIssues     = lazy(() => import('@/routes/moto/Issues'))
const MotoNotes      = lazy(() => import('@/routes/moto/Notes'))
const MotoDocuments  = lazy(() => import('@/routes/moto/Documents'))
const MotoReports    = lazy(() => import('@/routes/moto/Reports'))

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent" />
    </div>
  )
}

// When the PWA cold-launches it always opens at start_url ("/Streaks/").
// If the user last used a different module, redirect them back to it.
function StartupModuleRedirect() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname !== '/') return
    const stored = localStorage.getItem('active-module')
    if (stored === 'spending') navigate('/spending', { replace: true })
    else if (stored === 'moto') navigate('/moto', { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  useAppBadge()

  // Run recurring spending rules on mount and hourly
  const recurringRef = useRef(false)
  useEffect(() => {
    if (recurringRef.current) return
    recurringRef.current = true
    runDueRecurring()
    const id = setInterval(runDueRecurring, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

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
        <StartupModuleRedirect />
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
              {/* Spending module */}
              <Route path="/spending"                      element={<SpendingDashboard />} />
              <Route path="/spending/transactions"         element={<SpendingTransactions />} />
              <Route path="/spending/categories"             element={<SpendingCategories />} />
              <Route path="/spending/categories/new"         element={<CategoryEditor />} />
              <Route path="/spending/categories/edit/:id"    element={<CategoryEditor />} />
              <Route path="/spending/accounts"             element={<SpendingAccounts />} />
              <Route path="/spending/accounts/new"         element={<AccountEditor />} />
              <Route path="/spending/accounts/edit/:id"    element={<AccountEditor />} />
              <Route path="/spending/budgets"              element={<SpendingBudgets />} />
              <Route path="/spending/budgets/new"         element={<BudgetEditor />} />
              <Route path="/spending/budgets/edit/:id"    element={<BudgetEditor />} />
              <Route path="/spending/recurring"           element={<SpendingRecurring />} />
              <Route path="/spending/recurring/new"       element={<RecurringEditor />} />
              <Route path="/spending/recurring/edit/:id"  element={<RecurringEditor />} />
              <Route path="/spending/reports"              element={<SpendingReports />} />
              <Route path="/spending/new"                  element={<TransactionEditor />} />
              <Route path="/spending/edit/:id"             element={<TransactionEditor />} />
              {/* Moto module */}
              <Route path="/moto"            element={<MotoDashboard />} />
              <Route path="/moto/vehicles"   element={<MotoVehicles />} />
              <Route path="/moto/fuel"       element={<MotoFuel />} />
              <Route path="/moto/service"    element={<MotoService />} />
              <Route path="/moto/parts"      element={<MotoParts />} />
              <Route path="/moto/issues"     element={<MotoIssues />} />
              <Route path="/moto/notes"      element={<MotoNotes />} />
              <Route path="/moto/documents"  element={<MotoDocuments />} />
              <Route path="/moto/reports"    element={<MotoReports />} />
            </Routes>
          </Suspense>
        </AppShell>
      </ErrorBoundary>
      <ToastContainer />
    </BrowserRouter>
  )
}
