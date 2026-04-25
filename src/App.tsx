import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ToastContainer } from '@/components/ui'
import Dashboard   from '@/routes/Dashboard'
import Habits      from '@/routes/Habits'
import HabitDetail from '@/routes/HabitDetail'
import Tasks       from '@/routes/Tasks'
import TaskDetail  from '@/routes/TaskDetail'
import Stats       from '@/routes/Stats'
import Editor      from '@/routes/Editor'
import Tags        from '@/routes/Tags'
import Settings    from '@/routes/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/"                   element={<Dashboard />} />
          <Route path="/habits"             element={<Habits />} />
          <Route path="/habits/:id"         element={<HabitDetail />} />
          <Route path="/tasks"              element={<Tasks />} />
          <Route path="/tasks/:id"          element={<TaskDetail />} />
          <Route path="/stats"              element={<Stats />} />
          <Route path="/new"                element={<Editor />} />
          <Route path="/edit/:type/:id"     element={<Editor />} />
          <Route path="/tags"               element={<Tags />} />
          <Route path="/settings"           element={<Settings />} />
        </Routes>
      </AppShell>
      <ToastContainer />
    </BrowserRouter>
  )
}
