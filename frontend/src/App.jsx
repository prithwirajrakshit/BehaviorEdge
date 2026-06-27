import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TradeLogger from './pages/TradeLogger'
import AICoach from './pages/AICoach'
import Calendar from './pages/Calendar'
import Profile from './pages/Profile'
import JournalWorkspace from './pages/JournalWorkspace'
import Sidebar from './components/Sidebar'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) setLoggedIn(true)
  }, [])

  // Automatically close sidebar drawer on mobile navigation
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [page])

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
    journal: <JournalWorkspace />,
    profile: <Profile />,
  }

  return (
    <div className="app-container dark">
      {/* Mobile Sticky Header */}
      <header className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)} className="mobile-menu-btn" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="mobile-logo">
          <img
            src="/logo-64.png"
            alt="BehaviorEdge"
            style={{ width: 24, height: 24, objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(192,38,211,0.6))' }}
          />
          <span>Behavior<span style={{ color: 'var(--accent-light)' }}>Edge</span></span>
        </div>
        <div style={{ width: 36 }} /> {/* Visual balance spacer */}
      </header>

      {/* Blurred mobile background overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar 
        page={page} 
        setPage={setPage} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {pages[page]}
      </main>
    </div>
  )
}
