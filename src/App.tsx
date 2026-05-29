import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell }    from '@/components/AppShell'
import { ToastContainer } from '@/components/ui'
import { ErrorBoundary }  from '@/components/ErrorBoundary'
import { Onboarding }     from '@/components/Onboarding'
import { settingsRepo }   from '@/db/repos/settings'
import { useAppBadge }    from '@/hooks/useAppBadge'
import { runDueRecurring } from '@/lib/spending/recurringRunner'
import Dashboard   from '@/routes/Dashboard'
import Habits      from '@/routes/Habits'
import HabitDetail from '@/routes/HabitDetail'
import Tasks       from '@/routes/Tasks'
import TaskDetail  from '@/routes/TaskDetail'
import Editor      from '@/routes/Editor'
import Tags        from '@/routes/Tags'
import Settings    from '@/routes/Settings'
import SignIn      from '@/routes/SignIn'
import SpendingDashboard     from '@/routes/spending/Dashboard'
import SpendingTransactions   from '@/routes/spending/Transactions'
import SpendingCategories     from '@/routes/spending/Categories'
import SpendingAccounts       from '@/routes/spending/Accounts'
import SpendingBudgets        from '@/routes/spending/Budgets'
import SpendingReports        from '@/routes/spending/Reports'
import TransactionEditor      from '@/routes/spending/TransactionEditor'
import AccountEditor          from '@/routes/spending/AccountEditor'
import CategoryEditor         from '@/routes/spending/CategoryEditor'
import BudgetEditor           from '@/routes/spending/BudgetEditor'
import SpendingRecurring      from '@/routes/spending/Recurring'
import RecurringEditor        from '@/routes/spending/RecurringEditor'
import MotoDashboard          from '@/routes/moto/Dashboard'
import MotoVehicles           from '@/routes/moto/Vehicles'
import MotoFuel               from '@/routes/moto/Fuel'
import MotoService            from '@/routes/moto/Service'
import MotoParts              from '@/routes/moto/Parts'
import MotoIssues             from '@/routes/moto/Issues'
import MotoNotes              from '@/routes/moto/Notes'
import MotoDocuments          from '@/routes/moto/Documents'
import MotoReports            from '@/routes/moto/Reports'

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
