import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import { OutcomeBadge, DirectionBadge, SessionBadge } from "./Badge";
import { Eye, Clock, CheckSquare, X, Edit2, Star } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function WeeklyCalendar({ trades, showToast }) {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [pivotDate, setPivotDate] = useState(() => new Date());
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [dailyNotes, setDailyNotes] = useState([]);
  const [selectedNotesDay, setSelectedNotesDay] = useState(null);
  const [preMarketNote, setPreMarketNote] = useState("");
  const [postSessionNote, setPostSessionNote] = useState("");
  const [bias, setBias] = useState("Neutral");
  const [keyLevels, setKeyLevels] = useState("");
  const [disciplineScore, setDisciplineScore] = useState(5);
  const [savingNotes, setSavingNotes] = useState(false);
  const fetchDailyNotes = async () => {
    try {
      const res = await authFetch("/api/daily_notes");
      if (res.ok) {
        const data = await res.json();
        setDailyNotes(data);
      }
    } catch (err) {
    }
  };
  useEffect(() => {
    fetchDailyNotes();
  }, []);
  const handleOpenNotes = (date) => {
    setSelectedNotesDay(date);
    const existing = dailyNotes.find((n) => n.date === date);
    if (existing) {
      setPreMarketNote(existing.pre_market_note || "");
      setPostSessionNote(existing.post_session_note || "");
      setBias(existing.bias || "Neutral");
      setKeyLevels(existing.key_levels || "");
      setDisciplineScore(existing.discipline_score || 5);
    } else {
      setPreMarketNote("");
      setPostSessionNote("");
      setBias("Neutral");
      setKeyLevels("");
      setDisciplineScore(5);
    }
  };
  const handleSaveNotes = async () => {
    if (!selectedNotesDay) return;
    setSavingNotes(true);
    try {
      const res = await authFetch("/api/daily_notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedNotesDay,
          pre_market_note: preMarketNote,
          post_session_note: postSessionNote,
          bias,
          key_levels: keyLevels,
          discipline_score: disciplineScore
        })
      });
      if (res.ok) {
        showToast("Daily journal notes saved successfully!", "success");
        setSelectedNotesDay(null);
        fetchDailyNotes();
      } else {
        throw new Error("Could not save notes");
      }
    } catch (err) {
      showToast(err.message || "Error occurred saving notes.", "error");
    } finally {
      setSavingNotes(false);
    }
  };
  const getMondayOfPivot = (d) => {
    const copy = new Date(d.getTime());
    const day = copy.getUTCDay();
    const diff = copy.getUTCDate() - day + (day === 0 ? -6 : 1);
    copy.setUTCDate(diff);
    return copy;
  };
  const monday = getMondayOfPivot(pivotDate);
  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(monday.getTime());
    day.setUTCDate(monday.getUTCDate() + i);
    const dayName = day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const formattedDate = day.toISOString().substring(0, 10);
    return { dayName, date: formattedDate, dateObj: day };
  });
  const handlePrevWeek = () => {
    const newPivot = new Date(pivotDate.getTime());
    newPivot.setUTCDate(pivotDate.getUTCDate() - 7);
    setPivotDate(newPivot);
  };
  const handleNextWeek = () => {
    const newPivot = new Date(pivotDate.getTime());
    newPivot.setUTCDate(pivotDate.getUTCDate() + 7);
    setPivotDate(newPivot);
  };
  const handleToday = () => {
    setPivotDate(new Date());
  };
  const getWeekRangeLabel = () => {
    const start = daysOfWeek[0].dateObj;
    const end = daysOfWeek[6].dateObj;
    const startDay = start.getUTCDate();
    const endDay = end.getUTCDate();
    const startMonth = start.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    const year = end.getUTCFullYear();
    if (startMonth === endMonth) {
      return `${startDay} \u2013 ${endDay} ${startMonth} ${year}`;
    } else {
      return `${startDay} ${startMonth} \u2013 ${endDay} ${endMonth} ${year}`;
    }
  };
  const outcomePillStyles = {
    Win: "bg-[#14532d]/40 border border-[#166534] text-[#4ade80]",
    Loss: "bg-[#7f1d1d]/40 border border-[#991b1b] text-[#f87171]",
    Breakeven: "bg-[#262626] border border-[#404040] text-gray-200",
    Running: "bg-[#1e3a8a]/40 border border-[#1e40af] text-[#60a5fa]"
  };
  return <div className="space-y-6 text-slate-800 dark:text-white">
      {
    /* Calendar Header with navigation controls */
  }
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-2 gap-4">

        {
    /* Date navigators */
  }
        <div className="flex items-center space-x-2">
          <button
    onClick={handlePrevWeek}
    className="btn-neon btn-neon-ghost btn-neon-sm cursor-pointer"
    title="Go to previous week"
  >
            ← Previous Week
          </button>
          
          <button
    onClick={handleToday}
    className="btn-neon btn-neon-ghost btn-neon-sm cursor-pointer"
  >
            Today
          </button>

          <button
    onClick={handleNextWeek}
    className="btn-neon btn-neon-ghost btn-neon-sm cursor-pointer"
    title="Go to next week"
  >
            Next Week →
          </button>
        </div>
      </div>

      {
    /* Week Title Indicator banner */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 py-3.5 px-6 rounded-2xl flex justify-between items-center shadow-md dark:shadow-lg">
        <span className="font-sans font-bold text-lg text-slate-805 dark:text-white">
          📅 {getWeekRangeLabel()}
        </span>
        <span className="font-mono text-xs text-slate-400 dark:text-gray-500 uppercase tracking-widest">
          Chronological Weekly View
        </span>
      </div>

      {
    /* Grid Layout (Monday to Sunday) */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {daysOfWeek.map((day) => {
    const dayTrades = trades.filter((t) => t.date === day.date);
    const totalNetPnl = dayTrades.reduce((acc, t) => acc + t.net_pnl_usd, 0);
    const hasTrades = dayTrades.length > 0;
    return <div
      key={day.date}
      className={`min-h-[220px] bg-white dark:bg-[#0e0b18]/65 border rounded-2xl p-4 flex flex-col justify-between shadow-sm dark:shadow-lg transition-all duration-300 hover:border-slate-350 dark:hover:border-neutral-700/80 ${day.date === todayStr ? "border-blue-500/50 shadow-blue-500/[0.04]" : "border-slate-200 dark:border-violet-500/15"}`}
    >
              {
      /* Day title & date info */
    }
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-violet-500/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`font-sans font-black text-sm uppercase ${day.date === todayStr ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-gray-400"}`}>
                    {day.dayName}
                  </span>
                  <button
      onClick={() => handleOpenNotes(day.date)}
      className="p-1 text-slate-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-violet-500/10 rounded transition-colors cursor-pointer"
      title="Edit Daily Journal Notes"
    >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
                <span className="font-mono text-[10px] text-slate-400 dark:text-gray-500">{day.date.substring(5)}</span>
              </div>

              {
      /* Day's Trade List */
    }
              <div className="flex-1 overflow-y-auto py-3 space-y-1.5 scrollbar-thin">
                {dayTrades.length === 0 ? <span className="text-[10px] font-mono text-slate-400 dark:text-gray-600 block text-center py-6 select-none">No Trades</span> : dayTrades.map((t) => <button
      key={t.id}
      onClick={() => setSelectedTrade(t)}
      className={`w-full text-left p-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all hover:scale-[1.02] cursor-pointer ${outcomePillStyles[t.outcome] || outcomePillStyles.Running}`}
    >
                      <span className="truncate max-w-[64px] tracking-tight">{t.pair_instrument}</span>
                      <span className="text-[9px] scale-90 font-black shrink-0">
                        {t.net_pnl_usd >= 0 ? `+${t.market === 'Stocks' || t.market === 'Options' ? '₹' : '$'}${t.net_pnl_usd.toFixed(0)}` : `-${t.market === 'Stocks' || t.market === 'Options' ? '₹' : '$'}${Math.abs(t.net_pnl_usd).toFixed(0)}`}
                      </span>
                    </button>)}
              </div>

              {
      /* Day Accumulative Net PNL Footer */
    }
              <div className="pt-2 border-t border-slate-100 dark:border-[#252525]">
                {hasTrades ? <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-gray-500 font-bold font-mono">
                      {dayTrades.length} Trade{dayTrades.length > 1 ? "s" : ""}
                    </span>
                    <span className={`font-mono text-xs font-black ${totalNetPnl >= 0 ? "text-green-600 dark:text-green-500" : "text-red-650 dark:text-red-500"}`}>
                      {totalNetPnl >= 0 ? `+${dayTrades.every(t => t.market === 'Stocks' || t.market === 'Options') ? '₹' : '$'}${totalNetPnl.toFixed(2)}` : `-${dayTrades.every(t => t.market === 'Stocks' || t.market === 'Options') ? '₹' : '$'}${Math.abs(totalNetPnl).toFixed(2)}`}
                    </span>
                  </div> : <span className="text-[9px] font-mono uppercase text-slate-400 dark:text-gray-600 tracking-wider">Breakeven Day</span>}
              </div>
            </div>;
  })}
      </div>

      {
    /* FULL TRADE DETAILS PREVIEW MODAL */
  }
      {selectedTrade && <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-850 dark:text-white">
          <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-205 dark:border-violet-500/15 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden relative">
            
            {
    /* Modal Heading Header */
  }
            <div className="bg-slate-50 dark:bg-[#121212] p-5 border-b border-slate-150 dark:border-violet-500/15 flex justify-between items-center text-slate-800 dark:text-white">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center space-x-2">
                  <span className="bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded text-xs font-mono">REF ID: {selectedTrade.id}</span>
                  <span>{selectedTrade.pair_instrument} Journal Review</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 font-mono">Date Recorded: {selectedTrade.date}</p>
              </div>
              <button
    onClick={() => setSelectedTrade(null)}
    className="p-1 px-2.5 bg-white dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-gray-400 rounded-lg cursor-pointer"
  >
                Close
              </button>
            </div>

            {
    /* Modal body */
  }
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {
    /* Direction */
  }
                <div className="bg-slate-50 dark:bg-[#151225]/45 border border-slate-150 dark:border-violet-500/15 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold">Direction</span>
                  <div className="mt-1"><DirectionBadge direction={selectedTrade.direction} /></div>
                </div>

                {
    /* Session */
  }
                <div className="bg-slate-50 dark:bg-[#151225]/45 border border-slate-150 dark:border-violet-500/15 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold">Session</span>
                  <div className="mt-1"><SessionBadge session={selectedTrade.session} /></div>
                </div>

                {
    /* Setup */
  }
                <div className="bg-slate-50 dark:bg-[#151225]/45 border border-slate-150 dark:border-violet-500/15 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold">Setup Type</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white mt-1 block truncate">
                    {selectedTrade.setup_type || "\u2014"}
                  </span>
                </div>

                {
    /* Outcome */
  }
                <div className="bg-slate-50 dark:bg-[#151225]/45 border border-slate-150 dark:border-violet-500/15 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold">Outcome</span>
                  <div className="mt-1"><OutcomeBadge outcome={selectedTrade.outcome} /></div>
                </div>
              </div>

              {
    /* Financial Stats strip */
  }
              <div className="grid grid-cols-3 bg-slate-50/20 dark:bg-[#151225]/45 p-4 rounded-xl border border-slate-150/40 dark:border-violet-500/15 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 block uppercase font-sans font-bold">Gross profit/Loss</span>
                  <span className={`text-sm font-black block mt-1 ${selectedTrade.pnl_usd >= 0 ? "text-green-600 dark:text-green-500" : "text-red-655 dark:text-red-500"}`}>
                    {selectedTrade.pnl_usd >= 0 ? `+${selectedTrade.market === 'Stocks' || selectedTrade.market === 'Options' ? '₹' : '$'}${selectedTrade.pnl_usd.toFixed(2)}` : `-${selectedTrade.market === 'Stocks' || selectedTrade.market === 'Options' ? '₹' : '$'}${Math.abs(selectedTrade.pnl_usd).toFixed(2)}`}
                  </span>
                </div>
                <div className="border-x border-slate-150/40 dark:border-violet-500/15">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 block uppercase font-sans font-bold">Margin Fees Paid</span>
                  <span className="text-sm font-black block mt-1 text-red-655 dark:text-red-400">
                    -${selectedTrade.market === 'Stocks' || selectedTrade.market === 'Options' ? '₹' : '$'}${Math.abs(selectedTrade.fee_usd).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 block uppercase font-sans font-bold">Net Return PnL</span>
                  <span className={`text-sm font-black block mt-1 ${selectedTrade.net_pnl_usd >= 0 ? "text-green-600 dark:text-green-500" : "text-red-655 dark:text-red-500"}`}>
                    {selectedTrade.net_pnl_usd >= 0 ? `+${selectedTrade.market === 'Stocks' || selectedTrade.market === 'Options' ? '₹' : '$'}${selectedTrade.net_pnl_usd.toFixed(2)}` : `-${selectedTrade.market === 'Stocks' || selectedTrade.market === 'Options' ? '₹' : '$'}${Math.abs(selectedTrade.net_pnl_usd).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {
    /* Confluences & mistakes lists */
  }
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {
    /* Confluences */
  }
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center space-x-1">
                    <CheckSquare className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span>Confluences Applied</span>
                  </h4>
                  {selectedTrade.confluences.length === 0 ? <span className="text-xs text-slate-400 dark:text-gray-600 italic">None logged</span> : <div className="flex flex-wrap gap-1.5 select-none">
                      {selectedTrade.confluences.map((c) => <span key={c} className="bg-green-50 dark:bg-green-500/10 text-green-655 dark:text-green-400 border border-green-200 dark:border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {c}
                        </span>)}
                    </div>}
                </div>

                {
    /* Mistakes */
  }
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-655 dark:text-red-450 flex items-center space-x-1">
                    <X className="w-4 h-4 text-red-500" />
                    <span>Trading Behaviors</span>
                  </h4>
                  {selectedTrade.mistakes.length === 0 ? <span className="text-xs text-slate-400 dark:text-gray-600 italic">None logged</span> : <div className="flex flex-wrap gap-1.5 select-none">
                      {selectedTrade.mistakes.map((m) => <span key={m} className={`bg-red-50 dark:bg-red-500/10 text-red-655 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold ${m === "No Mistake" ? "text-slate-400 dark:text-gray-400 bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-[#333]" : ""}`}>
                          {m}
                        </span>)}
                    </div>}
                </div>
              </div>

              {
    /* Screenshot url if present */
  }
              {selectedTrade.screenshot_url && <div className="bg-slate-50/20 dark:bg-[#151225]/45 p-4 rounded-xl border border-slate-200/40 dark:border-violet-500/15 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-slate-405 dark:text-gray-400 font-mono">Screenshot attachment present</span>
                  </div>
                  <a
    href={selectedTrade.screenshot_url}
    target="_blank"
    rel="noopener noreferrer"
    className="btn-neon btn-neon-sm inline-flex items-center space-x-1 no-underline"
  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Setup Chart</span>
                  </a>
                </div>}

              {
    /* Notes content */
  }
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-405 mb-2">Reflective Log & Notes</h4>
                <div className="bg-slate-50/20 dark:bg-[#151225]/45 p-4 rounded-xl border border-slate-150/40 dark:border-violet-500/15 text-slate-700 dark:text-gray-300 text-xs leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedTrade.notes || <span className="text-slate-400 dark:text-gray-600 italic">No notes captured for this transaction record.</span>}
                </div>
              </div>
            </div>

            {
    /* Modal action footer */
  }
            <div className="p-4 bg-slate-50/20 dark:bg-[#151225]/45 border-t border-slate-150/40 dark:border-violet-500/15 flex justify-end">
              <button
    onClick={() => setSelectedTrade(null)}
    className="btn-neon btn-neon-sm cursor-pointer"
  >
                Acknowledge Review
              </button>
            </div>

          </div>
        </div>}

      {
    /* DAILY NOTES MODAL */
  }
      {selectedNotesDay && <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-850 dark:text-white">
          <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden relative">
            
            {
    /* Header */
  }
            <div className="bg-slate-50 dark:bg-[#121212] p-5 border-b border-slate-150 dark:border-violet-500/15 flex justify-between items-center text-slate-800 dark:text-white">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>📝 Daily Journal Notes</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-gray-405 mt-0.5 font-mono">{selectedNotesDay}</p>
              </div>
              <button
    onClick={() => setSelectedNotesDay(null)}
    className="p-1 px-2.5 bg-white dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-gray-400 rounded-lg cursor-pointer font-bold text-xs select-none"
  >
                Cancel
              </button>
            </div>

            {
    /* Body */
  }
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {
    /* Daily Bias Segmented Control */
  }
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold font-mono">Daily Bias</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Bullish", "Bearish", "Neutral"].map((b) => <button
    key={b}
    type="button"
    onClick={() => setBias(b)}
    className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${bias === b ? b === "Bullish" ? "bg-green-50 dark:bg-green-500/10 border-green-500 text-green-600 dark:text-green-400" : b === "Bearish" ? "bg-red-50 dark:bg-red-500/10 border-red-500 text-red-650 dark:text-red-500" : "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400" : "bg-slate-50 dark:bg-[#1e1e1e] border-slate-200 dark:border-[#333] text-slate-500 dark:text-gray-400 hover:text-[#111] dark:hover:text-white"}`}
  >
                      {b}
                    </button>)}
                </div>
              </div>

              {
    /* Discipline rating selection */
  }
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold font-mono block">Discipline Score</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => <button
    key={star}
    type="button"
    onClick={() => setDisciplineScore(star)}
    className="text-yellow-500 hover:scale-115 transition-all cursor-pointer shadow-none"
  >
                      <Star className={`w-6 h-6 ${star <= disciplineScore ? "fill-yellow-500 text-yellow-500" : "text-slate-250 dark:text-gray-600"}`} />
                    </button>)}
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 ml-2">({disciplineScore}/5)</span>
                </div>
              </div>

              {
    /* Pre-Market prep notes */
  }
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-405 font-bold font-mono">Pre-Market Prep Notes</label>
                <textarea
    value={preMarketNote}
    onChange={(e) => setPreMarketNote(e.target.value)}
    placeholder="Key trends, narrative focus, economic data events..."
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-3 text-xs text-slate-855 dark:text-white placeholder-slate-400 dark:placeholder-gray-605 focus:outline-none focus:border-blue-505 min-h-[70px] resize-y"
  />
              </div>

              {
    /* Post-Session review notes */
  }
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-405 font-bold font-mono">Post-Session Review Notes</label>
                <textarea
    value={postSessionNote}
    onChange={(e) => setPostSessionNote(e.target.value)}
    placeholder="How well did you execute? Lessons, highlights, mistakes..."
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-3 text-xs text-slate-855 dark:text-white placeholder-slate-400 dark:placeholder-gray-650 focus:outline-none focus:border-blue-505 min-h-[70px] resize-y"
  />
              </div>

              {
    /* Key levels watched */
  }
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-405 font-bold font-mono">Key Levels Watched</label>
                <input
    type="text"
    value={keyLevels}
    onChange={(e) => setKeyLevels(e.target.value)}
    placeholder="e.g. BTC 67400, ETH 3520 (comma separated)"
    className="w-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-3 text-xs text-slate-855 dark:text-white placeholder-slate-400 dark:placeholder-gray-605 focus:outline-none focus:border-blue-505"
  />
              </div>
            </div>

            {
    /* Action Footer */
  }
            <div className="p-4 bg-slate-50 dark:bg-[#151225]/45 border-t border-slate-150 dark:border-violet-500/15 flex justify-end gap-2">
              <button
    type="button"
    onClick={() => setSelectedNotesDay(null)}
    className="px-4 py-2 bg-white dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 hover:text-slate-905 dark:hover:text-white text-slate-600 dark:text-gray-400 text-xs font-bold rounded-lg cursor-pointer"
  >
                Cancel
              </button>
              <button
    type="button"
    onClick={handleSaveNotes}
    disabled={savingNotes}
    className="btn-neon btn-neon-sm cursor-pointer flex items-center gap-1"
  >
                {savingNotes ? "Saving..." : "Save Daily Notes"}
              </button>
            </div>

          </div>
        </div>}

      {
    /* Discipline Trend Chart */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">🧠 Discipline Score Trend</h3>
          <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Discipline score history over logged sessions (Scale: 1 to 5 Stars)</p>
        </div>
        <div className="h-64 w-full">
          {dailyNotes.length === 0 ? <div className="text-xs text-slate-400 dark:text-gray-600 font-mono text-center py-20">No daily notes logged yet to plot discipline trend.</div> : <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...dailyNotes].sort((a, b) => a.date.localeCompare(b.date))} margin={{ top: 10, bottom: 10, left: -20, right: 10 }}>
                <defs>
                  <filter id="calLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-slate-100 dark:stroke-violet-500/10" />
                <XAxis dataKey="date" stroke="currentColor" className="text-slate-400 dark:text-gray-500" fontSize={10} tickLine={false} />
                <YAxis stroke="currentColor" className="text-slate-400 dark:text-gray-500" fontSize={10} tickLine={false} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: "var(--bg-card)", 
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: "var(--border-bright)", 
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                    borderWidth: "1px",
                    padding: "8px 12px"
                  }} 
                  itemStyle={{ color: "#a78bfa", fontFamily: "Inter, sans-serif", fontSize: "0.78rem" }} 
                  labelStyle={{ color: "var(--text-primary)", fontFamily: "Inter, sans-serif", fontWeight: "bold", fontSize: "0.8rem", marginBottom: "4px" }} 
                />
                <Line type="monotone" dataKey="discipline_score" name="Discipline Score" stroke="#fb7185" strokeWidth={3.5} dot={{ r: 4, stroke: "#fb7185", strokeWidth: 1, fill: "var(--bg-card)" }} activeDot={{ r: 6, fill: "#fb7185", stroke: "#be123c", strokeWidth: 2 }} filter="url(#calLineGlow)" />
              </LineChart>
            </ResponsiveContainer>}
        </div>
      </div>
    </div>;
}
