import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Table,
  PlusCircle,
  Image,
  Calendar,
  DollarSign,
  AlertOctagon,
  ClipboardCheck,
  Target,
  Calculator,
  Globe,
  Newspaper,
  CheckSquare,
  Settings,
  Sun,
  Moon
} from 'lucide-react'

// Import all ported journal views
import DashboardView from '../components/journal/DashboardView'
import AllTradesTable from '../components/journal/AllTradesTable'
import AddTradeForm from '../components/journal/AddTradeForm'
import WeeklyCalendar from '../components/journal/WeeklyCalendar'
import FeesAnalytics from '../components/journal/FeesAnalytics'
import SettingsView from '../components/journal/SettingsView'
import WeeklyReview from '../components/journal/WeeklyReview'
import MistakesView from '../components/journal/MistakesView'
import GoalsView from '../components/journal/GoalsView'
import CalculatorView from '../components/journal/CalculatorView'
import GalleryView from '../components/journal/GalleryView'
import NewsEventsView from '../components/journal/NewsEventsView'
import FFCalendarView from '../components/journal/FFCalendarView'
import RulesView from '../components/journal/RulesView'
import { ToastNotification } from '../components/journal/Toast'
import { authFetch } from '../components/journal/utils/authFetch'

export default function JournalWorkspace() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [trades, setTrades] = useState([])
  const [editingTrade, setEditingTrade] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('success')
  const [loading, setLoading] = useState(true)

  const showToast = (message, type = 'success') => {
    setToastMessage(message)
    setToastType(type)
  }

  const fetchTrades = async () => {
    try {
      const res = await authFetch('/api/trades')
      if (!res.ok) throw new Error('Could not pull trade history catalog.')
      const data = await res.json()
      setTrades(data)
    } catch (err) {
      showToast(err.message || 'Error sync trades records from system database.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [])

  const handleSaveTrade = async (payload) => {
    const isEdit = !!payload.id
    const endpoint = isEdit ? `/api/trades/${payload.id}` : '/api/trades'
    const method = isEdit ? 'PUT' : 'POST'

    const response = await authFetch(endpoint, {
      method,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || 'Server faulty payload rejection.')
    }

    const savedTrade = await response.json()
    showToast(`Trade successfully ${isEdit ? 'updated' : 'recorded'}!`, 'success')
    setEditingTrade(null)
    await fetchTrades()
    setCurrentPage('trades')
    return savedTrade
  }

  const handleDeleteTrade = async (id) => {
    const response = await authFetch(`/api/trades/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || 'Failed deleting record.')
    }

    showToast('Trade record permanently cleared!', 'success')
    await fetchTrades()
  }

  const handleClearAllTrades = async () => {
    const response = await authFetch('/api/trades', {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || 'Bulk erasure command rejected.')
    }

    showToast('Wiped database successfully!', 'success')
    await fetchTrades()
    setCurrentPage('dashboard')
  }

  const handleTriggerEdit = (trade) => {
    setEditingTrade(trade)
    setCurrentPage('add')
  }

  const handleExportCSV = () => {
    if (trades.length === 0) {
      showToast('No trades found to export.', 'error')
      return
    }
    try {
      const headers = ['ID', 'Date', 'Pair / Instrument', 'Market', 'Direction', 'Session', 'Setup Type', 'Gross PnL (USD)', 'Fees (USD)', 'Net PnL (USD)', 'Outcome', 'Notes']
      const rows = trades.map(t => [
        t.id, t.date, t.pair_instrument, t.market, t.direction, t.session, t.setup_type || '', t.pnl_usd, t.fee_usd, t.net_pnl_usd, t.outcome, (t.notes || '').replace(/"/g, '""')
      ])
      const csvContent = [headers.join(','), ...rows.map(r => r.map(v => typeof v === 'string' ? `"${v}"` : v).join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `trade_journal_export_${new Date().toISOString().substring(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast('CSV backup downloaded successfully!', 'success')
    } catch (e) {
      showToast(`Export failed: ${e.message}`, 'error')
    }
  }

  const totalNetPnL = trades.reduce((acc, t) => acc + (t.net_pnl_usd || 0), 0)
  const currentEquity = 10000 + totalNetPnL

  // Sub-navigation menu groups for 14 views
  const menuGroups = [
    {
      title: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'trades', label: 'Trades Log', icon: Table },
        { id: 'add', label: 'Add Trade', icon: PlusCircle },
        { id: 'gallery', label: 'Gallery', icon: Image }
      ]
    },
    {
      title: 'Analysis',
      items: [
        { id: 'calendar', label: 'Weekly Calendar', icon: Calendar },
        { id: 'fees', label: 'Fees & Drag', icon: DollarSign },
        { id: 'mistakes', label: 'Mistakes Log', icon: AlertOctagon },
        { id: 'weekly_review', label: 'Weekly Reviews', icon: ClipboardCheck }
      ]
    },
    {
      title: 'Planning',
      items: [
        { id: 'goals', label: 'Weekly Goals', icon: Target },
        { id: 'calculator', label: 'Position Calculator', icon: Calculator },
        { id: 'news', label: 'Macro Events', icon: Globe },
        { id: 'ff_calendar', label: 'Forex Calendar', icon: Newspaper },
        { id: 'rules', label: 'Trading Rules', icon: CheckSquare }
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ]

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Analytics Dashboard'
      case 'trades': return 'Trade Directory'
      case 'add': return editingTrade ? 'Edit Trade Diary' : 'Add Trade Record'
      case 'calendar': return 'Weekly Calendar'
      case 'fees': return 'Fees & Commissions'
      case 'settings': return 'System Settings'
      case 'weekly_review': return 'Weekly Review Assessment'
      case 'mistakes': return 'Discipline Analytics & Mistakes'
      case 'goals': return 'Progress Milestones & Goals'
      case 'calculator': return 'Position Planning Suite'
      case 'gallery': return 'Screenshots Gallery'
      case 'news': return 'Macro Calendar & Impact News'
      case 'ff_calendar': return 'Forex Calendar'
      case 'rules': return 'Standard Operating Rules Checklist'
      default: return 'TradeLog Workspace'
    }
  }

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden" style={{ margin: '-36px -40px' }}>
      
      {/* Cohesive Sub-Sidebar inside the main viewport */}
      <aside className="w-56 flex flex-col border-r border-violet-500/20 bg-[#0e0b18]/60 backdrop-blur-md shrink-0 select-none overflow-y-auto">
        {/* Workspace Title */}
        <div className="p-4 border-b border-violet-500/10">
          <h3 className="font-semibold text-xs text-violet-400 uppercase tracking-widest font-mono">
            Journal Workspace
          </h3>
          <div className="mt-2 text-xs text-[#c8c0e0] font-sans">
            Equity: <strong className="text-white">${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Navigation Items grouped */}
        <div className="flex-1 p-3 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <span className="px-3 text-[10px] font-bold text-violet-500/80 uppercase tracking-wider font-mono">
                {group.title}
              </span>
              {group.items.map((item) => {
                const active = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id !== 'add') setEditingTrade(null)
                      setCurrentPage(item.id)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-all font-medium ${
                      active
                        ? 'bg-violet-600/20 text-[#a78bfa] border-l-2 border-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.1)]'
                        : 'text-violet-300/70 hover:text-white hover:bg-violet-500/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main viewport area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#07050f]/30">
        
        {/* Header Bar */}
        <header className="h-14 border-b border-violet-500/10 flex items-center justify-between px-6 bg-[#0e0b18]/40 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">{getPageTitle()}</h2>
          </div>
          
          <div className="flex gap-2 items-center">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-[#0e0b18] hover:bg-violet-500/10 text-xs font-semibold rounded-lg border border-violet-500/20 text-violet-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                setEditingTrade(null)
                setCurrentPage('add')
              }}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-xs font-semibold rounded-lg text-white transition-all cursor-pointer shadow-md shadow-violet-600/15"
            >
              + New Trade
            </button>
          </div>
        </header>

        {/* Scrollable Content Container Shell */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4">
              <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-[10px] font-mono text-violet-400/80 uppercase tracking-widest animate-pulse">
                Spinning sqlite journal database core...
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {currentPage === 'dashboard' && <DashboardView showToast={showToast} onNavigate={setCurrentPage} />}
              
              {currentPage === 'trades' && (
                <AllTradesTable
                  trades={trades}
                  onEdit={handleTriggerEdit}
                  onDelete={handleDeleteTrade}
                  onRefresh={fetchTrades}
                  showToast={showToast}
                  onNavigate={setCurrentPage}
                />
              )}

              {currentPage === 'add' && (
                <AddTradeForm
                  trades={trades}
                  editingTrade={editingTrade}
                  onSave={handleSaveTrade}
                  onCancel={() => {
                    setEditingTrade(null)
                    setCurrentPage('trades')
                  }}
                  showToast={showToast}
                />
              )}

              {currentPage === 'calendar' && (
                <WeeklyCalendar
                  trades={trades}
                  showToast={showToast}
                />
              )}

              {currentPage === 'fees' && (
                <FeesAnalytics
                  showToast={showToast}
                  trades={trades}
                />
              )}

              {currentPage === 'settings' && (
                <SettingsView
                  trades={trades}
                  onClearAll={handleClearAllTrades}
                  showToast={showToast}
                />
              )}

              {currentPage === 'weekly_review' && (
                <WeeklyReview
                  trades={trades}
                  showToast={showToast}
                />
              )}

              {currentPage === 'mistakes' && (
                <MistakesView
                  trades={trades}
                />
              )}

              {currentPage === 'goals' && (
                <GoalsView
                  trades={trades}
                  showToast={showToast}
                />
              )}

              {currentPage === 'calculator' && (
                <CalculatorView />
              )}

              {currentPage === 'gallery' && (
                <GalleryView
                  trades={trades}
                  onNavigate={setCurrentPage}
                  onEditTrade={handleTriggerEdit}
                />
              )}

              {currentPage === 'news' && (
                <NewsEventsView
                  trades={trades}
                  showToast={showToast}
                />
              )}

              {currentPage === 'ff_calendar' && (
                <FFCalendarView
                  trades={trades}
                  showToast={showToast}
                />
              )}

              {currentPage === 'rules' && (
                <RulesView
                  trades={trades}
                  showToast={showToast}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification wrapper */}
      <ToastNotification
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />
    </div>
  )
}
