import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TradeLogger from './pages/TradeLogger'
import AICoach from './pages/AICoach'
import Calendar from './pages/Calendar'
import Profile from './pages/Profile'
import Sidebar from './components/Sidebar'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) setLoggedIn(true)
  }, [])

  const handleLogin = () => setLoggedIn(true)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setLoggedIn(false)
  }

  if (!loggedIn) return <Login onLogin={handleLogin} />

  const pages = {
    dashboard: <Dashboard />,
    trade: <TradeLogger />,
    coach: <AICoach />,
    calendar: <Calendar />,
    profile: <Profile />,
  }

  return (
    <div className="flex min-h-screen text-white" style={{ background: 'var(--bg-base)' }}>
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} />
      <main style={{ flex: 1, marginLeft: 240, padding: '36px 40px', minHeight: '100vh' }}>
        {pages[page]}
      </main>
    </div>
  )
}
