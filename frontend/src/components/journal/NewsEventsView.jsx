import { authFetch } from './utils/authFetch';
import { useState, useEffect } from "react";
import { Newspaper, ChevronDown, ChevronUp, Calendar, Award, Trash2, Edit, Save, ListFilter } from "lucide-react";
const CATEGORIES = [
  "Macro (Fed/CPI/NFP)",
  "Crypto News",
  "Exchange News",
  "Regulatory",
  "Technical Level",
  "Personal Note",
  "Other"
];
export default function NewsEventsView({ trades, showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().substring(0, 10));
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [impact, setImpact] = useState("High");
  const [actual, setActual] = useState("");
  const [forecast, setForecast] = useState("");
  const [previous, setPrevious] = useState("");
  const [notes, setNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterImpact, setFilterImpact] = useState("All");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [calDate, setCalDate] = useState(/* @__PURE__ */ new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [selectedDayStr, setSelectedDayStr] = useState(null);
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await authFetch("/api/market_events");
      if (!res.ok) throw new Error("Could not retrieve market news data.");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      showToast(err.message || "Error pulling news event journal.", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEvents();
  }, []);
  const resetForm = () => {
    setEditingId(null);
    setDate((/* @__PURE__ */ new Date()).toISOString().substring(0, 10));
    setTime("");
    setTitle("");
    setCategory(CATEGORIES[0]);
    setImpact("High");
    setActual("");
    setForecast("");
    setPrevious("");
    setNotes("");
  };
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      showToast("Date and Title are required.", "error");
      return;
    }
    const payload = { date, time, title: title.trim(), category, impact, actual, forecast, previous, notes };
    const endpoint = editingId ? `/api/market_events/${editingId}` : "/api/market_events";
    const method = editingId ? "PUT" : "POST";
    try {
      const res = await authFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Server rejected request");
      }
      showToast(`Event successfully ${editingId ? "updated" : "recorded"}!`, "success");
      resetForm();
      setIsFormCollapsed(true);
      fetchEvents();
    } catch (err) {
      showToast(err.message || "Failed saving news event.", "error");
    }
  };
  const handleTriggerEdit = (ev) => {
    setEditingId(ev.id || null);
    setDate(ev.date);
    setTime(ev.time || "");
    setTitle(ev.title);
    setCategory(ev.category || CATEGORIES[0]);
    setImpact(ev.impact || "High");
    setActual(ev.actual || "");
    setForecast(ev.forecast || "");
    setPrevious(ev.previous || "");
    setNotes(ev.notes || "");
    setIsFormCollapsed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Delete this news event entry permanent?")) return;
    try {
      const res = await authFetch(`/api/market_events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete API failed");
      showToast("News event deleted.", "success");
      if (editingId === id) resetForm();
      fetchEvents();
    } catch (err) {
      showToast(err.message || "Could not delete item.", "error");
    }
  };
  const filteredEvents = events.filter((ev) => {
    if (filterCategory !== "All" && ev.category !== filterCategory) return false;
    if (filterImpact !== "All" && ev.impact !== filterImpact) return false;
    if (filterDateFrom && ev.date < filterDateFrom) return false;
    if (filterDateTo && ev.date > filterDateTo) return false;
    return true;
  });
  const startOfMonth = new Date(calDate.getFullYear(), calDate.getMonth(), 1);
  const endOfMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0);
  const startDayIndex = startOfMonth.getDay();
  const numDays = endOfMonth.getDate();
  const prevMonth = () => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
    setSelectedDayEvents(null);
    setSelectedDayStr(null);
  };
  const nextMonth = () => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));
    setSelectedDayEvents(null);
    setSelectedDayStr(null);
  };
  const handleDayClick = (dayNum) => {
    const dStr = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dayEvs = events.filter((e) => e.date === dStr);
    setSelectedDayEvents(dayEvs);
    setSelectedDayStr(dStr);
  };
  const highImpactEventDays = new Set(events.filter((e) => e.impact === "High").map((e) => e.date));
  const eventDayTrades = trades.filter((t) => highImpactEventDays.has(t.date));
  const nonEventDayTrades = trades.filter((t) => !highImpactEventDays.has(t.date));
  const calcWinRate = (arr) => {
    const winnable = arr.filter((t) => t.outcome === "Win" || t.outcome === "Loss");
    if (winnable.length === 0) return 0;
    const wins = winnable.filter((t) => t.outcome === "Win").length;
    return Math.round(wins / winnable.length * 100);
  };
  const eventWinRate = calcWinRate(eventDayTrades);
  const nonEventWinRate = calcWinRate(nonEventDayTrades);
  const isTradedOnHighEvents = eventDayTrades.length > 0;
  const rec = eventWinRate < nonEventWinRate && eventWinRate < 50 ? "\u26A0\uFE0F Avoid Trading (Highly suggested to avoid entering new positions during major High-Impact volatility releases)" : "\u{1F7E2} Trade Carefully (Stay alert for unexpected spreads and instant slippage on high-impact dates)";
  return <div className="space-y-8 pb-10">
      
      {
    /* SECTION A: News Event entry Form */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-6 shadow-md dark:shadow-xl space-y-4">
        <button
    onClick={() => {
      setIsFormCollapsed(!isFormCollapsed);
      if (isFormCollapsed && editingId === null) resetForm();
    }}
    className="w-full flex justify-between items-center text-left"
  >
          <div className="flex items-center space-x-3">
            <Newspaper className="w-5 h-5 text-blue-500 animate-pulse bg-transparent" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                {editingId ? `\u{1F4DD} Edit Event Diary: ${title}` : "\u{1F4F0} Record Market News/Event Event"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">Keep track of Macro events, FOMC briefings or major crypto catalyst listings.</p>
            </div>
          </div>
          {isFormCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400 dark:text-gray-400" /> : <ChevronUp className="w-4 h-4 text-slate-400 dark:text-gray-400" />}
        </button>

        {!isFormCollapsed && <form onSubmit={handleSaveEvent} className="border-t border-slate-200 dark:border-[#2a2a2a] pt-4 space-y-4 animate-slide-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Event Date</label>
                <input
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-mono"
    required
  />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Time (UTC / Local)</label>
                <input
    type="text"
    placeholder="e.g. 14:30 or 15:45"
    value={time}
    onChange={(e) => setTime(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-mono"
  />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Impact Rating</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#121212] p-1 border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-xs">
                  <button
    type="button"
    onClick={() => setImpact("High")}
    className={`p-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${impact === "High" ? "bg-red-500/20 text-red-650 dark:text-red-500 border border-red-500/40" : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"}`}
  >
                    High 🔴
                  </button>
                  <button
    type="button"
    onClick={() => setImpact("Medium")}
    className={`p-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${impact === "Medium" ? "bg-yellow-500/20 text-yellow-650 dark:text-yellow-500 border border-yellow-500/40" : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"}`}
  >
                    Med 🟡
                  </button>
                  <button
    type="button"
    onClick={() => setImpact("Low")}
    className={`p-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${impact === "Low" ? "bg-green-500/20 text-green-600 dark:text-green-500 border border-green-500/40" : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"}`}
  >
                    Low 🟢
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Event Title</label>
                <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="e.g. FOMC Rate Decision, CPI Release, BTC ETF News"
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
    required
  />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Category</label>
                <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-850 dark:text-white dark:[&>option]:bg-[#121212] cursor-pointer font-bold"
  >
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Actual Value</label>
                <input
    type="text"
    placeholder="e.g. 5.25% or 0.25%"
    value={actual}
    onChange={(e) => setActual(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-mono"
  />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Forecast/Expected</label>
                <input
    type="text"
    placeholder="e.g. 5.25%"
    value={forecast}
    onChange={(e) => setForecast(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-mono"
  />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Previous Value</label>
                <input
    type="text"
    placeholder="e.g. 5.50%"
    value={previous}
    onChange={(e) => setPrevious(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-mono"
  />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400 font-bold">Macro Assessment Notes & Observations</label>
              <textarea
    placeholder="Write event implications, market volatility reflections or trade guidelines..."
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] focus:outline-none focus:border-blue-500 rounded-xl p-3 text-xs text-slate-800 dark:text-white min-h-[80px]"
  />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
    type="button"
    onClick={resetForm}
    className="px-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#323232] rounded-xl text-xs text-slate-700 dark:text-gray-300 font-semibold cursor-pointer"
  >
                Cancel
              </button>
              <button
    type="submit"
    className="btn-neon btn-neon-sm flex items-center gap-1.5 cursor-pointer"
  >
                <Save className="w-3.5 h-3.5" />
                <span>{editingId ? "Update Event" : "Save Event"}</span>
              </button>
            </div>
          </form>}
      </div>

      {
    /* CLUSTERING LAYOUT: CALENDAR (LEFT) AND TRADE TO EVENT CORRELATION (RIGHT) */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {
    /* SECTION C: CALENDAR (Lg: 5/12 cols) */
  }
        <div className="lg:col-span-5 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-md dark:shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-violet-500/15 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-mono">Monthly Event Dots</h4>
            </div>
            <div className="flex items-center gap-1">
              <button
    onClick={prevMonth}
    className="p-1.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10 text-slate-700 dark:text-gray-300 text-xs font-mono font-bold cursor-pointer rounded-lg"
  >
                &lt;
              </button>
              <span className="px-3 py-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
                {calDate.toLocaleString("default", { month: "short", year: "numeric" })}
              </span>
              <button
    onClick={nextMonth}
    className="p-1.5 bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 hover:bg-slate-100 dark:hover:bg-violet-500/10 text-slate-700 dark:text-gray-300 text-xs font-mono font-bold cursor-pointer rounded-lg"
  >
                &gt;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => <span key={w} className="text-[10px] font-bold text-slate-400 dark:text-gray-500 font-mono select-none py-1">{w}</span>)}

            {Array.from({ length: startDayIndex }).map((_, idx) => <div key={`empty-${idx}`} />)}

            {Array.from({ length: numDays }).map((_, idx) => {
    const dayNum = idx + 1;
    const dStr = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dayEvents = events.filter((e) => e.date === dStr);
    const hasHigh = dayEvents.some((e) => e.impact === "High");
    const hasMed = dayEvents.some((e) => e.impact === "Medium");
    const hasLow = dayEvents.some((e) => e.impact === "Low");
    const isSelected = selectedDayStr === dStr;
    return <button
      key={`day-${dayNum}`}
      onClick={() => handleDayClick(dayNum)}
      className={`relative p-2 rounded-lg text-xs font-mono font-bold transition-all hover:bg-slate-105 dark:hover:bg-[#2a2a2a] group cursor-pointer ${isSelected ? "bg-blue-600 text-white font-black" : "bg-slate-50 dark:bg-[#121212] text-slate-700 dark:text-gray-300"}`}
    >
                  <span>{dayNum}</span>
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5 pointer-events-none">
                    {hasHigh && <span className="w-1 h-1 rounded-full bg-red-500" />}
                    {hasMed && <span className="w-1 h-1 rounded-full bg-yellow-500" />}
                    {hasLow && <span className="w-1 h-1 rounded-full bg-green-500" />}
                  </div>
                </button>;
  })}
          </div>

          {
    /* Day selection popover/details */
  }
          <div className="mt-2 bg-slate-50 dark:bg-[#151225]/45 rounded-xl border border-slate-200 dark:border-violet-500/15 p-3 text-xs flex-1 min-h-[140px] flex flex-col justify-between">
            {selectedDayStr ? <div className="space-y-2">
                <p className="font-bold text-blue-600 dark:text-blue-400 font-mono text-[10px] border-b border-slate-200 dark:border-violet-500/15 pb-1.5">
                  📅 Events on {selectedDayStr}
                </p>
                {selectedDayEvents && selectedDayEvents.length > 0 ? <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {selectedDayEvents.map((e) => <div key={e.id} className="flex justify-between items-center bg-white dark:bg-[#151225]/45 p-2 rounded-lg border border-slate-200 dark:border-violet-500/15">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold truncate text-[11px] text-slate-800 dark:text-white">{e.title}</p>
                          <p className="text-[9px] uppercase font-mono tracking-wider text-slate-400 dark:text-gray-500">
                            {e.time || "All Day"} | {e.category}
                          </p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${e.impact === "High" ? "bg-red-50 dark:bg-red-500/10 text-red-655 dark:text-red-400 border border-red-200 dark:border-red-500/20" : e.impact === "Medium" ? "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-655 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20" : "bg-green-50 dark:bg-green-500/10 text-green-655 dark:text-green-400 border border-green-200 dark:border-green-500/20"}`}>
                          {e.impact}
                        </span>
                      </div>)}
                  </div> : <p className="text-slate-500 dark:text-gray-500 italic text-center py-6 font-mono text-[10px]">No news event scheduled for this calendar date.</p>}
              </div> : <div className="text-center py-10 text-slate-400 dark:text-gray-600 font-mono text-[10px] flex flex-col items-center justify-center h-full">
                <Calendar className="w-5 h-5 mb-1.5 stroke-1" />
                <span>Click a monthly cell to filter events</span>
              </div>}
          </div>
        </div>

        {
    /* SECTION D: CORRELATION (Lg: 7/12 cols) */
  }
        <div className="lg:col-span-7 bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-5 shadow-md dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-violet-500/15 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-650 dark:text-yellow-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">Macro Correlation Assessment</h4>
                <p className="text-[10px] text-slate-500 dark:text-gray-400">Review historical trades executed on High impact event dates.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 tracking-wider font-bold">EVENT CORRELATION</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center select-none font-mono">
            <div className="bg-slate-50 dark:bg-[#151225]/45 p-2.5 rounded-xl border border-slate-200 dark:border-violet-500/15">
              <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Tension Days</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{eventDayTrades.length} <span className="text-[10px] font-normal text-slate-400 dark:text-gray-500">trades</span></p>
            </div>
            <div className="bg-slate-50 dark:bg-[#151225]/45 p-2.5 rounded-xl border border-slate-200 dark:border-violet-500/15">
              <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Event Win Rate</p>
              <p className={`text-lg font-bold mt-1 ${eventWinRate >= 50 ? "text-green-655 dark:text-green-500" : "text-red-655 dark:text-red-500"}`}>{eventWinRate}%</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#151225]/45 p-2.5 rounded-xl border border-slate-200 dark:border-violet-500/15">
              <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Regular Win Rate</p>
              <p className={`text-lg font-bold mt-1 ${nonEventWinRate >= 50 ? "text-green-655 dark:text-green-500" : "text-red-655 dark:text-red-500"}`}>{nonEventWinRate}%</p>
            </div>
          </div>

          {
    /* Advice alert */
  }
          <div className="p-3.5 bg-blue-50 dark:bg-blue-500/5 border border-blue-150 dark:border-blue-500/20 rounded-xl space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-750 dark:text-blue-400 font-mono">Macro Policy Guard Recommendation</p>
            <p className="text-xs text-slate-700 dark:text-gray-300 font-sans leading-relaxed">{rec}</p>
          </div>

          {
    /* Trade Event Correlation Table */
  }
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-150 dark:border-[#2a2a2a] font-mono uppercase tracking-wider text-[10px] text-slate-400 dark:text-gray-500">
                  <th className="py-2">Date</th>
                  <th className="py-2">Active High-Impact Event</th>
                  <th className="py-2">Trade Entry</th>
                  <th className="py-2">Outcome</th>
                  <th className="py-2 text-right">Net PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-violet-500/10 font-mono">
                {eventDayTrades.length > 0 ? eventDayTrades.slice(0, 5).map((t) => {
    const matchedEvent = events.find((e) => e.date === t.date && e.impact === "High");
    return <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#1f1f1f] transition-all text-slate-700 dark:text-gray-400">
                        <td className="py-2.5 font-bold text-slate-800 dark:text-white">{t.date}</td>
                        <td className="py-2.5 text-red-655 dark:text-red-400 font-semibold">{matchedEvent?.title || "FOMC High Impact Release"}</td>
                        <td className="py-2.5 text-slate-650 dark:text-gray-300 font-medium">
                          {t.pair_instrument} <span className={t.direction === "Long" ? "text-green-600 dark:text-green-400 font-bold" : "text-red-600 dark:text-red-400 font-bold"}>{t.direction}</span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${t.outcome === "Win" ? "bg-green-50 dark:bg-green-500/10 text-green-655 dark:text-green-400" : t.outcome === "Loss" ? "bg-red-50 dark:bg-red-500/10 text-red-655 dark:text-red-400" : "bg-slate-100 dark:bg-gray-500/10 text-slate-600 dark:text-gray-400"}`}>
                            {t.outcome}
                          </span>
                        </td>
                        <td className={`py-2.5 text-right font-black ${t.net_pnl_usd >= 0 ? "text-green-655 dark:text-green-500" : "text-red-655 dark:text-red-500"}`}>
                          {t.net_pnl_usd >= 0 ? "+" : ""}${t.net_pnl_usd.toFixed(2)}
                        </td>
                      </tr>;
  }) : <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-gray-600 italic">
                      No trades registered on days with major high-impact events. Good job maintaining policy discipline!
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {
    /* FILTER BAR FOR TIMELINE VIEW */
  }
      <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-4 shadow-md dark:shadow-lg">
        <div className="flex flex-col md:flex-row gap-3 items-end justify-between">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-blue-500" />
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-slate-500 dark:text-gray-400">Events Directory Timeline</span>
          </div>

          <div className="grid grid-cols-2 md:grid-flow-col gap-3 font-mono text-[10px]">
            <div className="flex flex-col gap-1.5">
              <span className="text-slate-400 dark:text-gray-500 uppercase font-bold text-[9px]">Category</span>
              <select
    value={filterCategory}
    onChange={(e) => setFilterCategory(e.target.value)}
    className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] rounded-lg p-2 text-slate-800 dark:text-white text-xs cursor-pointer font-bold dark:[&>option]:bg-[#121212]"
  >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-slate-400 dark:text-gray-500 uppercase font-bold text-[9px]">Impact</span>
              <select
    value={filterImpact}
    onChange={(e) => setFilterImpact(e.target.value)}
    className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] rounded-lg p-2 text-slate-800 dark:text-white text-xs cursor-pointer font-bold dark:[&>option]:bg-[#121212]"
  >
                <option value="All">All Levels</option>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-slate-400 dark:text-gray-500 uppercase font-bold text-[9px]">Date From</span>
              <input
    type="date"
    value={filterDateFrom}
    onChange={(e) => setFilterDateFrom(e.target.value)}
    className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] rounded-lg p-2 text-slate-800 dark:text-white text-xs font-mono"
  />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-slate-400 dark:text-gray-500 uppercase font-bold text-[9px]">Date To</span>
              <input
    type="date"
    value={filterDateTo}
    onChange={(e) => setFilterDateTo(e.target.value)}
    className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2a2a2a] rounded-lg p-2 text-slate-800 dark:text-white text-xs font-mono"
  />
            </div>
          </div>
        </div>
      </div>

      {
    /* SECTION B: Timeline of events */
  }
      <div className="space-y-4">
        {loading ? <div className="text-center py-10 text-xs font-mono text-slate-500 dark:text-gray-500">Pulling market news event logs...</div> : filteredEvents.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((ev) => {
    const impactColor = ev.impact === "High" ? "text-red-650 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" : ev.impact === "Medium" ? "text-yellow-650 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20" : "text-green-655 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20";
    return <div
      key={ev.id}
      className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 hover:border-slate-350 dark:hover:border-violet-500/25 transition-all rounded-2xl p-5 shadow-md dark:shadow-lg flex flex-col justify-between"
    >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-mono text-[10px] text-slate-450 dark:text-gray-500 flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-white text-[11px]">{ev.date}</span>
                        <span>{ev.time || "All Day"}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 font-mono">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${impactColor}`}>
                          {ev.impact}
                        </span>
                        <span className="text-[9px] bg-slate-50 dark:bg-[#151225]/45 border border-slate-200 dark:border-violet-500/15 px-2 py-0.5 rounded text-slate-650 dark:text-gray-400">
                          {ev.category}
                        </span>
                      </div>
                    </div>

                    <h5 className="font-bold text-slate-800 dark:text-gray-200 text-sm leading-tight">{ev.title}</h5>

                    {
      /* Actual vs Forecast vs Previous values grid */
    }
                    {(ev.actual || ev.forecast || ev.previous) && <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-[#151225]/45 rounded-xl border border-slate-150 dark:border-violet-500/15 p-2 text-center font-mono text-[10px] select-none text-slate-500 dark:text-gray-450">
                        <div>
                          <p className="text-[8px] text-slate-400 dark:text-gray-500">ACTUAL</p>
                          <p className="font-bold text-slate-800 dark:text-white max-w-[80px] truncate">{ev.actual || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-slate-400 dark:text-gray-500">FORECAST</p>
                          <p className="font-semibold text-slate-700 dark:text-gray-300 max-w-[80px] truncate">{ev.forecast || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-slate-400 dark:text-gray-500">PREVIOUS</p>
                          <p className="font-semibold text-slate-700 dark:text-gray-300 max-w-[80px] truncate">{ev.previous || "-"}</p>
                        </div>
                      </div>}

                    {ev.notes && <div className="bg-slate-55 dark:bg-[#151225]/45 rounded-xl p-3 border border-slate-100 dark:border-violet-500/15 text-xs text-slate-600 dark:text-gray-400 italic">
                        {ev.notes}
                      </div>}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-150 dark:border-violet-500/15 pt-3 mt-4">
                    <button
      onClick={() => handleTriggerEdit(ev)}
      className="p-1 px-2.5 bg-slate-50 dark:bg-[#151225]/45 hover:bg-slate-100 dark:hover:bg-violet-500/10 hover:text-slate-850 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-violet-500/15 text-[10px] font-semibold text-slate-600 dark:text-gray-400 cursor-pointer flex items-center gap-1"
    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
      onClick={() => handleDeleteEvent(ev.id)}
      className="p-1 px-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-905/20 rounded-lg transition-colors text-[10px] font-semibold cursor-pointer flex items-center gap-1"
    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>;
  })}
          </div> : <div className="bg-white dark:bg-[#0e0b18]/65 border border-slate-200 dark:border-violet-500/15 rounded-2xl p-10 text-center text-xs text-slate-500 dark:text-gray-500 font-mono shadow-sm">
            No events matches current filters scheduled. Record some macro releases above!
          </div>}
      </div>

    </div>;
}
